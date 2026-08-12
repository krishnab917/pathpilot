import { and, asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  aiConversations,
  aiMessages,
  careerMatches,
  careers,
  goals,
  InsertUser,
  projects,
  roadmapMilestones,
  roadmaps,
  simulations,
  studentProfiles,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

export type ResourceLink = { label: string; url: string };
export type CareerRecommendation = {
  name: string;
  description: string;
  salaryRange: string;
  educationRequirements: string;
  requiredSkills: string[];
  dailyResponsibilities: string[];
  relatedCareers: string[];
  matchScore: number;
  reasoning: string;
  strengths: string[];
  missingSkills: string[];
  realityCheck: string;
  nextSteps: string[];
};

export type RoadmapMilestoneInput = {
  year: number;
  title: string;
  description?: string;
  category: "skill" | "project" | "experience";
  deadline?: Date;
  priority: "low" | "medium" | "high";
  estimatedHours: number;
  resources: ResourceLink[];
  progress?: number;
  status?: "not_started" | "in_progress" | "completed" | "paused";
  sortOrder: number;
};

let _db: ReturnType<typeof drizzle> | null = null;

/** Lazily instantiates the database client so checks can run without a live database. */
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to initialize:", error);
      _db = null;
    }
  }
  return _db;
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("The PathPilot database is currently unavailable.");
  return db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getStudentProfile(userId: number) {
  const db = await requireDb();
  const result = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, userId)).limit(1);
  return result[0];
}

export async function saveStudentProfile(
  userId: number,
  profile: {
    grade: string;
    location: string;
    interests: string[];
    skills: string[];
    activities: string[];
    careerPreferences: string[];
  }
) {
  const db = await requireDb();
  const values = { ...profile, userId, onboardingCompletedAt: new Date() };
  await db.insert(studentProfiles).values(values).onDuplicateKeyUpdate({
    set: { ...profile, onboardingCompletedAt: new Date() },
  });
  return getStudentProfile(userId);
}

function toSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 180);
}

export async function replaceCareerMatches(userId: number, recommendations: CareerRecommendation[]) {
  if (recommendations.length !== 5) throw new Error("Career discovery must contain exactly five matches.");
  const db = await requireDb();
  await db.delete(careerMatches).where(eq(careerMatches.userId, userId));

  for (let index = 0; index < recommendations.length; index += 1) {
    const recommendation = recommendations[index];
    const slug = toSlug(recommendation.name);
    await db.insert(careers).values({
      slug,
      name: recommendation.name,
      description: recommendation.description,
      salaryRange: recommendation.salaryRange,
      educationRequirements: recommendation.educationRequirements,
      requiredSkills: recommendation.requiredSkills,
      dailyResponsibilities: recommendation.dailyResponsibilities,
      relatedCareers: recommendation.relatedCareers,
    }).onDuplicateKeyUpdate({
      set: {
        name: recommendation.name,
        description: recommendation.description,
        salaryRange: recommendation.salaryRange,
        educationRequirements: recommendation.educationRequirements,
        requiredSkills: recommendation.requiredSkills,
        dailyResponsibilities: recommendation.dailyResponsibilities,
        relatedCareers: recommendation.relatedCareers,
      },
    });
    const career = await db.select({ id: careers.id }).from(careers).where(eq(careers.slug, slug)).limit(1);
    if (!career[0]) throw new Error("Unable to persist the generated career match.");
    await db.insert(careerMatches).values({
      userId,
      careerId: career[0].id,
      rank: index + 1,
      matchScore: Math.max(0, Math.min(100, Math.round(recommendation.matchScore))),
      reasoning: recommendation.reasoning,
      strengths: recommendation.strengths,
      missingSkills: recommendation.missingSkills,
      realityCheck: recommendation.realityCheck,
      nextSteps: recommendation.nextSteps,
    });
  }
  return getCareerMatches(userId);
}

export async function getCareerMatches(userId: number) {
  const db = await requireDb();
  return db.select({
    id: careerMatches.id,
    rank: careerMatches.rank,
    matchScore: careerMatches.matchScore,
    reasoning: careerMatches.reasoning,
    strengths: careerMatches.strengths,
    missingSkills: careerMatches.missingSkills,
    realityCheck: careerMatches.realityCheck,
    nextSteps: careerMatches.nextSteps,
    generatedAt: careerMatches.generatedAt,
    career: {
      id: careers.id,
      name: careers.name,
      description: careers.description,
      salaryRange: careers.salaryRange,
      educationRequirements: careers.educationRequirements,
      requiredSkills: careers.requiredSkills,
      dailyResponsibilities: careers.dailyResponsibilities,
      relatedCareers: careers.relatedCareers,
    },
  }).from(careerMatches).innerJoin(careers, eq(careerMatches.careerId, careers.id))
    .where(eq(careerMatches.userId, userId)).orderBy(asc(careerMatches.rank));
}

export async function listGoals(userId: number) {
  const db = await requireDb();
  return db.select().from(goals).where(eq(goals.userId, userId)).orderBy(asc(goals.status), asc(goals.deadline), desc(goals.updatedAt));
}

export async function createGoal(userId: number, goal: {
  title: string; description?: string; category: string; deadline?: Date; priority: "low" | "medium" | "high"; estimatedHours: number; resources?: ResourceLink[];
}) {
  const db = await requireDb();
  const result = await db.insert(goals).values({ ...goal, userId, resources: goal.resources ?? [] });
  const id = Number(result[0].insertId);
  return (await db.select().from(goals).where(eq(goals.id, id)).limit(1))[0];
}

export async function updateGoal(userId: number, goalId: number, update: {
  progress?: number; status?: "not_started" | "in_progress" | "completed" | "paused"; priority?: "low" | "medium" | "high";
}) {
  const db = await requireDb();
  const result = await db.update(goals).set({ ...update, updatedAt: new Date() })
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId)));
  if (result[0].affectedRows === 0) throw new Error("Goal not found.");
  return (await db.select().from(goals).where(eq(goals.id, goalId)).limit(1))[0];
}

export async function getActiveRoadmap(userId: number) {
  const db = await requireDb();
  const roadmap = (await db.select().from(roadmaps)
    .where(and(eq(roadmaps.userId, userId), eq(roadmaps.status, "active"))).orderBy(desc(roadmaps.updatedAt)).limit(1))[0];
  if (!roadmap) return undefined;
  const milestones = await db.select().from(roadmapMilestones).where(eq(roadmapMilestones.roadmapId, roadmap.id))
    .orderBy(asc(roadmapMilestones.year), asc(roadmapMilestones.sortOrder));
  return { ...roadmap, milestones };
}

export async function createRoadmap(userId: number, targetCareer: string, milestones: RoadmapMilestoneInput[]) {
  const db = await requireDb();
  const result = await db.insert(roadmaps).values({ userId, targetCareer, completionPercentage: 0 });
  const roadmapId = Number(result[0].insertId);
  if (milestones.length) {
    await db.insert(roadmapMilestones).values(milestones.map(milestone => ({
      ...milestone,
      roadmapId,
      resources: milestone.resources,
      progress: milestone.progress ?? 0,
      status: milestone.status ?? "not_started",
    })));
  }
  return getActiveRoadmap(userId);
}

export async function updateMilestoneProgress(userId: number, milestoneId: number, progress: number) {
  const db = await requireDb();
  const match = await db.select({ id: roadmapMilestones.id, roadmapId: roadmaps.id }).from(roadmapMilestones)
    .innerJoin(roadmaps, eq(roadmapMilestones.roadmapId, roadmaps.id))
    .where(and(eq(roadmapMilestones.id, milestoneId), eq(roadmaps.userId, userId))).limit(1);
  if (!match[0]) throw new Error("Roadmap milestone not found.");
  const normalized = Math.max(0, Math.min(100, Math.round(progress)));
  await db.update(roadmapMilestones).set({
    progress: normalized,
    status: normalized === 100 ? "completed" : normalized > 0 ? "in_progress" : "not_started",
    updatedAt: new Date(),
  }).where(eq(roadmapMilestones.id, milestoneId));
  const milestones = await db.select({ progress: roadmapMilestones.progress }).from(roadmapMilestones)
    .where(eq(roadmapMilestones.roadmapId, match[0].roadmapId));
  const completionPercentage = milestones.length ? Math.round(milestones.reduce((sum, milestone) => sum + milestone.progress, 0) / milestones.length) : 0;
  await db.update(roadmaps).set({ completionPercentage, updatedAt: new Date() }).where(eq(roadmaps.id, match[0].roadmapId));
  return getActiveRoadmap(userId);
}

export async function createSimulation(userId: number, simulation: { career: string; title: string; scenarios: unknown[] }) {
  const db = await requireDb();
  const result = await db.insert(simulations).values({ ...simulation, userId, userChoices: [] });
  const id = Number(result[0].insertId);
  return (await db.select().from(simulations).where(eq(simulations.id, id)).limit(1))[0];
}

export async function getSimulation(userId: number, simulationId: number) {
  const db = await requireDb();
  return (await db.select().from(simulations).where(and(eq(simulations.id, simulationId), eq(simulations.userId, userId))).limit(1))[0];
}

export async function completeSimulation(userId: number, simulationId: number, outcome: {
  userChoices: { scenarioId: string; choiceId: string }[]; technicalScore: number; leadershipScore: number; careerCompatibilityScore: number; score: number; feedback: string;
}) {
  const db = await requireDb();
  const result = await db.update(simulations).set({ ...outcome, status: "completed", completedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(simulations.id, simulationId), eq(simulations.userId, userId)));
  if (result[0].affectedRows === 0) throw new Error("Simulation not found.");
  return getSimulation(userId, simulationId);
}

export async function getOrCreateMentorConversation(userId: number) {
  const db = await requireDb();
  const existing = await db.select().from(aiConversations).where(eq(aiConversations.userId, userId))
    .orderBy(desc(aiConversations.updatedAt)).limit(1);
  if (existing[0]) return existing[0];
  const result = await db.insert(aiConversations).values({ userId, title: "Career mentor" });
  return (await db.select().from(aiConversations).where(eq(aiConversations.id, Number(result[0].insertId))).limit(1))[0];
}

export async function getConversationMessages(userId: number, conversationId: number) {
  const db = await requireDb();
  const conversation = await db.select({ id: aiConversations.id }).from(aiConversations)
    .where(and(eq(aiConversations.id, conversationId), eq(aiConversations.userId, userId))).limit(1);
  if (!conversation[0]) throw new Error("Conversation not found.");
  return db.select().from(aiMessages).where(and(eq(aiMessages.conversationId, conversationId), eq(aiMessages.userId, userId))).orderBy(asc(aiMessages.createdAt));
}

export async function addMentorMessage(userId: number, conversationId: number, role: "user" | "assistant", content: string) {
  const db = await requireDb();
  await db.insert(aiMessages).values({ userId, conversationId, role, content });
  await db.update(aiConversations).set({ updatedAt: new Date() }).where(and(eq(aiConversations.id, conversationId), eq(aiConversations.userId, userId)));
}

export async function listProjects(userId: number) {
  const db = await requireDb();
  return db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.updatedAt));
}

export async function getDashboardData(userId: number) {
  const [profile, matches, allGoals, roadmap, allProjects] = await Promise.all([
    getStudentProfile(userId), getCareerMatches(userId), listGoals(userId), getActiveRoadmap(userId), listProjects(userId),
  ]);
  const activeGoals = allGoals.filter(goal => goal.status !== "completed" && goal.status !== "paused");
  const readiness = roadmap?.completionPercentage ?? (matches[0]?.matchScore ? Math.round(matches[0].matchScore * 0.35) : 0);
  return { profile, matches, goals: allGoals, activeGoals, roadmap, projects: allProjects, readiness };
}
