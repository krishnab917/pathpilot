import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  addMentorMessage,
  completeSimulation,
  createGoal,
  createProject,
  createProjectFromRoadmapMilestone,
  createProjectWorkspaceMilestone,
  createPortfolioDraftFromProject,
  createGoalFromVerifiedOpportunity,
  createRoadmap,
  createSimulation,
  createAdaptiveSimulation,
  clearPlanningActivity,
  createPlanningReportShareLink,
  exportPlanningActivity,
  chooseAdaptiveSimulationDecision,
  setSimulationTimingOptIn,
  getAdaptivePublicScenario,
  getAdaptiveSimulation,
  getLatestCompletedAdaptiveSimulation,
  listPlanningActivity,
  listPlanningReportShareLinks,
  getActiveRoadmap,
  getBehaviorEvolution,
  getCrossProductEvidenceSummary,
  getPlanningReview,
  getProjectWorkspace,
  getPortfolioWorkspace,
  getPublicPortfolio,
  getSharedPlanningReport,
  getCareerMatches,
  getConversationMessages,
  getDashboardData,
  getOnboardingDraft,
  getOrCreateMentorConversation,
  getSimulation,
  getResumableAdaptiveSimulation,
  getStudentProfile,
  listGoals,
  listProjects,
  searchVerifiedOpportunities,
  refreshCuratedOpportunityCatalog,
  refreshNasaSpaceAppsOpportunity,
  replaceCareerMatches,
  revokePlanningReportShareLink,
  RoadmapMilestoneInput,
  saveStudentProfile,
  saveOnboardingDraft,
  setStudentOpportunityState,
  updateGoal,
  updateProject,
  updateProjectWorkspaceMilestone,
  updatePortfolioProject,
  upsertPortfolioProfile,
  publishPortfolioProject,
  unpublishPortfolioProject,
  deleteProjectWorkspaceMilestone,
  updateMilestoneProgress,
  updateStudentCountryContext,
} from "../db";
import { invokeLLM, listLLMModels } from "../_core/llm";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { retryValidatedGuidance, withCareerGuidanceTimeout } from "../career-guidance";
import { buildSimulationFeedback, calculateSimulationScores, hasExactlyFiveUniqueCareerMatches } from "../pathpilot.helpers";
import { countryOptions, getNationalEducationContext } from "../roadmap/national-context";
import { acceptRoadmapRecommendation, addEvolvedRoadmapRecommendations, generateRoadmapRecommendations, getRoadmapRecommendationContext, getRoadmapRecommendationEvolutionPreview, listRoadmapRecommendations, skipRoadmapRecommendation, updateRoadmapRecommendation } from "../roadmap/recommendation-repository";
import { getSimulationGraph, getSimulationGraphById } from "../simulation/engine";
import { buildMentorPlanningContext } from "../mentor-context";
import { buildDecisionReview, presentTerminalOutcome } from "../simulation/presentation";
import { cacheProjectGuidance, getCachedProjectGuidance, invalidateProjectGuidanceCache, PROJECT_GUIDANCE_CACHE_VERSION, projectGuidanceInputHash } from "../ai-result-cache";
import { cancelDerivedAnalysis, getDerivedAnalysisStatus, requestDerivedAnalysis, retryDerivedAnalysis } from "../derived-analysis";

const selectionSchema = z.array(z.string().trim().min(1).max(80)).min(1).max(12);
const prioritySchema = z.enum(["low", "medium", "high"]);
const resourceSchema = z.object({ label: z.string().trim().min(1).max(120), url: z.string().url().max(500) });
const milestoneSchema = z.object({
  year: z.number().int().min(1).max(8),
  title: z.string().trim().min(1).max(180),
  description: z.string().trim().max(1000).optional(),
  category: z.enum(["skill", "project", "experience"]),
  deadline: z.date().optional(),
  priority: prioritySchema,
  estimatedHours: z.number().int().min(1).max(1000),
  resources: z.array(resourceSchema).max(8),
  progress: z.number().int().min(0).max(100).optional(),
  status: z.enum(["not_started", "in_progress", "completed", "paused"]).optional(),
  sortOrder: z.number().int().min(0).max(100),
});

const recommendationSchema = z.object({
  name: z.string().trim().min(2).max(180),
  description: z.string().trim().min(20).max(900),
  salaryRange: z.string().trim().min(3).max(120),
  educationRequirements: z.string().trim().min(10).max(500),
  requiredSkills: z.array(z.string().trim().min(1).max(80)).min(3).max(8),
  dailyResponsibilities: z.array(z.string().trim().min(1).max(180)).min(2).max(6),
  relatedCareers: z.array(z.string().trim().min(1).max(180)).min(2).max(6),
  matchScore: z.number().int().min(1).max(100),
  reasoning: z.string().trim().min(30).max(1000),
  strengths: z.array(z.string().trim().min(1).max(150)).min(1).max(6),
  missingSkills: z.array(z.string().trim().min(1).max(150)).min(1).max(6),
  realityCheck: z.string().trim().min(30).max(1000),
  nextSteps: z.array(z.string().trim().min(1).max(220)).min(2).max(5),
});

const discoverySchema = z.object({ matches: z.array(recommendationSchema).length(5) });
const simulationScenarioSchema = z.object({
  id: z.string().regex(/^s[1-3]$/),
  title: z.string().trim().min(3).max(160),
  prompt: z.string().trim().min(30).max(900),
  choices: z.array(z.object({
    id: z.string().regex(/^c[1-3]$/),
    label: z.string().trim().min(3).max(280),
    technicalImpact: z.number().int().min(0).max(100),
    leadershipImpact: z.number().int().min(0).max(100),
    compatibilityImpact: z.number().int().min(0).max(100),
  })).length(3),
});
const simulationGenerationSchema = z.object({
  title: z.string().trim().min(3).max(180),
  scenarios: z.array(simulationScenarioSchema).length(3),
});
const generatedMilestoneSchema = z.object({
  year: z.number().int().min(1).max(3),
  title: z.string().trim().min(2).max(180),
  description: z.string().trim().min(15).max(1000),
  category: z.enum(["skill", "project", "experience"]),
  deadline: z.string().datetime().nullable(),
  priority: prioritySchema,
  estimatedHours: z.number().int().min(1).max(1000),
  resources: z.array(resourceSchema).max(4),
});
const roadmapGenerationSchema = z.object({ milestones: z.array(generatedMilestoneSchema).length(9) });
const suggestedGoalSchema = z.object({
  title: z.string().trim().min(2).max(180), description: z.string().trim().max(1200), category: z.string().trim().min(2).max(64),
  priority: prioritySchema, estimatedHours: z.number().int().min(1).max(1000), deadline: z.string().datetime().nullable(),
});
const mentorResponseSchema = z.object({
  reply: z.string().trim().min(1).max(4000),
  suggestedGoal: suggestedGoalSchema.nullable(),
  priorityAdjustment: z.object({ goalId: z.string().uuid(), priority: prioritySchema }).nullable(),
});

const discoveryJsonSchema = {
  type: "object",
  properties: {
    matches: {
      type: "array", minItems: 5, maxItems: 5,
      items: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 2, maxLength: 180 }, description: { type: "string", minLength: 20, maxLength: 900 }, salaryRange: { type: "string", minLength: 3, maxLength: 120 }, educationRequirements: { type: "string", minLength: 10, maxLength: 500 },
          requiredSkills: { type: "array", minItems: 3, maxItems: 8, items: { type: "string", minLength: 1, maxLength: 80 } }, dailyResponsibilities: { type: "array", minItems: 2, maxItems: 6, items: { type: "string", minLength: 1, maxLength: 180 } }, relatedCareers: { type: "array", minItems: 2, maxItems: 6, items: { type: "string", minLength: 1, maxLength: 180 } },
          matchScore: { type: "integer", minimum: 1, maximum: 100 }, reasoning: { type: "string", minLength: 30, maxLength: 1000 }, strengths: { type: "array", minItems: 1, maxItems: 6, items: { type: "string", minLength: 1, maxLength: 150 } }, missingSkills: { type: "array", minItems: 1, maxItems: 6, items: { type: "string", minLength: 1, maxLength: 150 } },
          realityCheck: { type: "string", minLength: 30, maxLength: 1000 }, nextSteps: { type: "array", minItems: 2, maxItems: 5, items: { type: "string", minLength: 1, maxLength: 220 } },
        },
        required: ["name", "description", "salaryRange", "educationRequirements", "requiredSkills", "dailyResponsibilities", "relatedCareers", "matchScore", "reasoning", "strengths", "missingSkills", "realityCheck", "nextSteps"],
        additionalProperties: false,
      },
    },
  },
  required: ["matches"],
  additionalProperties: false,
} as const;

const simulationJsonSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    scenarios: {
      type: "array", minItems: 3, maxItems: 3,
      items: {
        type: "object",
        properties: {
          id: { type: "string" }, title: { type: "string" }, prompt: { type: "string" },
          choices: {
            type: "array", minItems: 3, maxItems: 3,
            items: { type: "object", properties: { id: { type: "string" }, label: { type: "string" }, technicalImpact: { type: "integer" }, leadershipImpact: { type: "integer" }, compatibilityImpact: { type: "integer" } }, required: ["id", "label", "technicalImpact", "leadershipImpact", "compatibilityImpact"], additionalProperties: false },
          },
        },
        required: ["id", "title", "prompt", "choices"], additionalProperties: false,
      },
    },
  },
  required: ["title", "scenarios"], additionalProperties: false,
} as const;

const roadmapJsonSchema = {
  type: "object",
  properties: {
    milestones: {
      type: "array", minItems: 9, maxItems: 9,
      items: {
        type: "object",
        properties: {
          year: { type: "integer" }, title: { type: "string" }, description: { type: "string" }, category: { type: "string", enum: ["skill", "project", "experience"] },
          deadline: { type: ["string", "null"] }, priority: { type: "string", enum: ["low", "medium", "high"] }, estimatedHours: { type: "integer" },
          resources: { type: "array", items: { type: "object", properties: { label: { type: "string" }, url: { type: "string" } }, required: ["label", "url"], additionalProperties: false } },
        },
        required: ["year", "title", "description", "category", "deadline", "priority", "estimatedHours", "resources"], additionalProperties: false,
      },
    },
  },
  required: ["milestones"], additionalProperties: false,
} as const;

const mentorJsonSchema = {
  type: "object",
  properties: {
    reply: { type: "string" },
    suggestedGoal: {
      type: ["object", "null"],
      properties: { title: { type: "string" }, description: { type: "string" }, category: { type: "string" }, priority: { type: "string", enum: ["low", "medium", "high"] }, estimatedHours: { type: "integer" }, deadline: { type: ["string", "null"] } },
      required: ["title", "description", "category", "priority", "estimatedHours", "deadline"], additionalProperties: false,
    },
    priorityAdjustment: {
      type: ["object", "null"],
      properties: { goalId: { type: "string" }, priority: { type: "string", enum: ["low", "medium", "high"] } },
      required: ["goalId", "priority"], additionalProperties: false,
    },
  },
  required: ["reply", "suggestedGoal", "priorityAdjustment"], additionalProperties: false,
} as const;

const projectGuidanceSchema = z.object({
  summary: z.string().trim().min(1).max(900),
  nextSteps: z.array(z.string().trim().min(1).max(260)).min(2).max(4),
  watchouts: z.array(z.string().trim().min(1).max(260)).max(3),
  questions: z.array(z.string().trim().min(1).max(260)).max(3),
});
const projectGuidanceJsonSchema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    nextSteps: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 },
    watchouts: { type: "array", items: { type: "string" }, maxItems: 3 },
    questions: { type: "array", items: { type: "string" }, maxItems: 3 },
  },
  required: ["summary", "nextSteps", "watchouts", "questions"], additionalProperties: false,
} as const;

function contentFrom(response: Awaited<ReturnType<typeof invokeLLM>>) {
  const content = response.choices[0]?.message.content;
  if (typeof content !== "string") throw new TRPCError({ code: "BAD_GATEWAY", message: "The AI service returned an unsupported response." });
  return content;
}

async function preferredModel() {
  const models = await listLLMModels();
  return models.data.find(model => model.id === "gpt-5-mini")?.id ?? models.data[0]?.id;
}

function projectWorkspaceContext(project: NonNullable<Awaited<ReturnType<typeof getProjectWorkspace>>>) {
  const milestones = project.milestones.map(item => `${item.title} [${item.status}, ${item.progress}%${item.targetDate ? `, target ${item.targetDate}` : ""}]${item.details ? ` — ${item.details}` : ""}`).join("; ") || "No project milestones yet.";
  return [
    `Project name: ${project.name}`,
    `Description: ${project.description}`,
    `Scope: ${project.scopeStatement ?? "Not yet specified."}`,
    `Technologies or methods: ${project.skills.join(", ") || "Not yet specified."}`,
    `Status: ${project.status}; progress: ${project.progress}%`,
    `Dates: start ${project.startDate ?? "not set"}; completion ${project.completionDate ?? "not set"}`,
    `Links: repository ${project.githubLink ?? "not set"}; live project ${project.liveUrl ?? "not set"}`,
    `Student project notes: ${project.projectNotes ?? "None provided."}`,
    `Project milestones: ${milestones}`,
  ].join("\n");
}

async function clearProjectGuidanceCache(userId: string, projectId: string) {
  try { await invalidateProjectGuidanceCache(userId, projectId); }
  catch (error) { console.error("[PathPilot] project guidance cache invalidation failed", error); }
}

function profileContext(profile: NonNullable<Awaited<ReturnType<typeof getStudentProfile>>>) {
  return [
    `Grade: ${profile.grade}`,
    `Location: ${profile.location}`,
    `Country: ${profile.countryCode ?? "Not selected"}`,
    `Education context: ${profile.educationSystem ?? "Not selected"}`,
    `Interests: ${profile.interests.join(", ")}`,
    `Skills: ${profile.skills.join(", ")}`,
    `Activities: ${profile.activities.join(", ")}`,
    `Preferred work: ${profile.careerPreferences.join(", ")}`,
  ].join("\n");
}

function adaptiveSimulationResponse(simulation: any) {
  const graph = getSimulationGraphById(simulation.scenarioGraphId) ?? getSimulationGraph(simulation.career);
  const decisionReview = buildDecisionReview(graph, simulation.decisionHistory, simulation.behavioralEvents ?? []);
  const publicSimulation = { id: simulation.id, career: simulation.career, title: simulation.title, status: simulation.status, createdAt: simulation.createdAt, updatedAt: simulation.updatedAt, completedAt: simulation.completedAt, decisionCount: simulation.decisionHistory.length, resultSummary: simulation.resultSummary, behavioralProfile: simulation.behavioralProfile, compatibilityResults: simulation.compatibilityResults, technicalScore: simulation.technicalScore, leadershipScore: simulation.leadershipScore, careerCompatibilityScore: simulation.careerCompatibilityScore, score: simulation.score, responseTimingOptIn: simulation.responseTimingOptIn, terminalOutcome: simulation.status === "completed" ? presentTerminalOutcome(graph, simulation.currentNodeId) : null, latestConsequence: simulation.behavioralEvents?.at(-1) ?? null, decisionReview };
  return { simulation: publicSimulation, scenario: simulation.status === "completed" ? null : getAdaptivePublicScenario(simulation) };
}

export const pathpilotRouter = router({
  profile: router({
    get: protectedProcedure.query(({ ctx }) => getStudentProfile(ctx.user.id)),
    getDraft: protectedProcedure.query(({ ctx }) => getOnboardingDraft(ctx.user.id)),
    saveDraft: protectedProcedure.input(z.object({ currentStep: z.number().int().min(0).max(4), profile: z.object({ grade: z.string().max(16), location: z.string().max(160), countryCode: z.string().regex(/^[A-Z]{2}$/).nullable().optional(), educationSystem: z.string().max(180).nullable().optional(), interests: z.array(z.string().max(80)).max(12), skills: z.array(z.string().max(80)).max(12), activities: z.array(z.string().max(80)).max(12), careerPreferences: z.array(z.string().max(80)).max(12) }) })).mutation(({ ctx, input }) => saveOnboardingDraft(ctx.user.id, input.currentStep, input.profile)),
    completeOnboarding: protectedProcedure.input(z.object({
      grade: z.string().trim().min(1).max(16),
      location: z.string().trim().min(2).max(160),
      countryCode: z.string().regex(/^[A-Z]{2}$/),
      educationSystem: z.string().trim().min(2).max(180),
      interests: selectionSchema,
      skills: selectionSchema,
      activities: selectionSchema,
      careerPreferences: selectionSchema,
    })).mutation(({ ctx, input }) => saveStudentProfile(ctx.user.id, input)),
    countryOptions: protectedProcedure.query(() => countryOptions),
    updateCountry: protectedProcedure.input(z.object({ countryCode: z.string().regex(/^[A-Z]{2}$/), educationSystem: z.string().trim().min(2).max(180) })).mutation(({ ctx, input }) => updateStudentCountryContext(ctx.user.id, input.countryCode, input.educationSystem)),
  }),

  dashboard: router({
    get: protectedProcedure.query(({ ctx }) => getDashboardData(ctx.user.id)),
  }),

  derivedAnalysis: router({
    status: protectedProcedure.query(({ ctx }) => getDerivedAnalysisStatus(ctx.user.id)),
    request: protectedProcedure.mutation(({ ctx }) => requestDerivedAnalysis(ctx.user.id)),
    retry: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(({ ctx, input }) => retryDerivedAnalysis(ctx.user.id, input.id)),
    cancel: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(({ ctx, input }) => cancelDerivedAnalysis(ctx.user.id, input.id)),
  }),

  discovery: router({
    list: protectedProcedure.query(({ ctx }) => getCareerMatches(ctx.user.id)),
    preflight: protectedProcedure.mutation(async ({ ctx }) => {
      const profile = await getStudentProfile(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Complete onboarding before requesting career guidance." });
      return { profileReady: true };
    }),
    analyze: protectedProcedure.mutation(async ({ ctx }) => {
      const profile = await getStudentProfile(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Complete onboarding before requesting career guidance." });
      try {
        const model = await withCareerGuidanceTimeout(preferredModel(), 8_000);
        const matches = await retryValidatedGuidance(
          async attempt => {
            const response = await withCareerGuidanceTimeout(invokeLLM({
              model,
              messages: [
                { role: "system", content: `You are PathPilot's career discovery engine for high-school students. Give encouraging, specific, age-appropriate educational guidance. Do not claim certainty about outcomes. Recommend exactly five distinct realistic careers based only on the supplied profile. Salary ranges must be described as location-dependent estimates, not guarantees. Keep every text field to one concise sentence or phrase. Return exactly the required minimum list sizes: 3 required skills, 2 daily responsibilities, 2 related careers, 1 current strength, 1 skill to build, and 2 next steps. Return only the requested JSON.${attempt ? " This is a validation retry: ensure all five career names are distinct and every required field is complete." : ""}` },
                { role: "user", content: `Analyze this student profile:\n${profileContext(profile)}` },
              ],
              response_format: { type: "json_schema", json_schema: { name: "career_discovery", strict: true, schema: discoveryJsonSchema } },
            }), 45_000);
            return contentFrom(response);
          },
          content => {
            const parsed = discoverySchema.safeParse(JSON.parse(String(content)));
            if (!parsed.success) {
              const fields = parsed.error.issues.map(issue => issue.path.join(".") || "response").join(", ");
              throw new Error(`The model response did not satisfy the career-discovery contract at: ${fields}.`);
            }
            if (!hasExactlyFiveUniqueCareerMatches(parsed.data.matches)) throw new Error("The model response did not contain five unique career names.");
            return parsed.data.matches;
          },
        );
        return replaceCareerMatches(ctx.user.id, matches);
      } catch (error) {
        console.error("[PathPilot] career discovery failed", error);
        throw new TRPCError({ code: "BAD_GATEWAY", message: "Career guidance is temporarily unavailable. Please try again shortly." });
      }
    }),
  }),

  goals: router({
    list: protectedProcedure.query(({ ctx }) => listGoals(ctx.user.id)),
    create: protectedProcedure.input(z.object({
      title: z.string().trim().min(2).max(180), description: z.string().trim().max(1200).optional(), category: z.string().trim().min(2).max(64),
      deadline: z.date().optional(), priority: prioritySchema, estimatedHours: z.number().int().min(1).max(1000), resources: z.array(resourceSchema).max(8).optional(),
    })).mutation(({ ctx, input }) => createGoal(ctx.user.id, input)),
    update: protectedProcedure.input(z.object({ id: z.string().uuid(), progress: z.number().int().min(0).max(100).optional(), status: z.enum(["not_started", "in_progress", "completed", "paused"]).optional(), priority: prioritySchema.optional(), title: z.string().trim().min(2).max(180).optional(), description: z.string().trim().max(1200).optional(), deadline: z.date().nullable().optional(), resources: z.array(resourceSchema).max(8).optional() }))
      .mutation(({ ctx, input }) => updateGoal(ctx.user.id, input.id, { progress: input.progress, status: input.status, priority: input.priority, title: input.title, description: input.description, deadline: input.deadline, resources: input.resources })),
  }),

  activity: router({
    list: protectedProcedure.query(({ ctx }) => listPlanningActivity(ctx.user.id)),
    export: protectedProcedure.query(({ ctx }) => exportPlanningActivity(ctx.user.id)),
    clear: protectedProcedure.input(z.object({ confirmed: z.literal(true) })).mutation(({ ctx }) => clearPlanningActivity(ctx.user.id)),
  }),

  evidencePolicy: router({
    summary: protectedProcedure.query(({ ctx }) => getCrossProductEvidenceSummary(ctx.user.id)),
  }),

  review: router({
    get: protectedProcedure.query(({ ctx }) => getPlanningReview(ctx.user.id)),
  }),

  reportShares: router({
    list: protectedProcedure.query(({ ctx }) => listPlanningReportShareLinks(ctx.user.id)),
    create: protectedProcedure.mutation(({ ctx }) => createPlanningReportShareLink(ctx.user.id)),
    revoke: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(({ ctx, input }) => revokePlanningReportShareLink(ctx.user.id, input.id)),
  }),

  sharedReport: router({
    get: publicProcedure.input(z.object({ token: z.string().regex(/^[A-Za-z0-9_-]{43}$/) })).query(({ input }) => getSharedPlanningReport(input.token)),
  }),

  opportunities: router({
    list: protectedProcedure.input(z.object({
      category: z.enum(["internship", "competition", "research"]).optional(),
      alignedOnly: z.boolean().optional(),
      search: z.string().trim().max(100).optional(),
      countryCode: z.string().regex(/^[A-Z]{2}$/).optional(),
      grade: z.string().trim().min(1).max(32).optional(),
      deadlineOnly: z.boolean().optional(),
      page: z.number().int().min(1).max(10000).optional(),
      pageSize: z.number().int().min(1).max(48).optional(),
    }).optional()).query(({ ctx, input }) => searchVerifiedOpportunities(ctx.user.id, input ?? {})),
    setState: protectedProcedure.input(z.object({ opportunityId: z.string().uuid(), status: z.enum(["saved", "dismissed"]) })).mutation(({ ctx, input }) => setStudentOpportunityState(ctx.user.id, input.opportunityId, input.status)),
    createGoal: protectedProcedure.input(z.object({ opportunityId: z.string().uuid() })).mutation(({ ctx, input }) => createGoalFromVerifiedOpportunity(ctx.user.id, input.opportunityId)),
    refreshNasaSource: protectedProcedure.mutation(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Only a PathPilot administrator can refresh the verified source." });
      try {
        return await refreshNasaSpaceAppsOpportunity();
      } catch (error) {
        console.error("[PathPilot] NASA source refresh failed", error);
        throw new TRPCError({ code: "BAD_GATEWAY", message: "The official source could not be refreshed. The last verified record remains unchanged." });
      }
    }),
    refreshCuratedCatalog: protectedProcedure.mutation(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Only a PathPilot administrator can refresh the curated catalog." });
      try {
        return await refreshCuratedOpportunityCatalog();
      } catch (error) {
        console.error("[PathPilot] curated opportunity refresh failed", error);
        throw new TRPCError({ code: "BAD_GATEWAY", message: "The popular opportunity directories could not be refreshed. Existing records remain available." });
      }
    }),
  }),

  roadmap: router({
    get: protectedProcedure.query(({ ctx }) => getActiveRoadmap(ctx.user.id)),
    preflight: protectedProcedure.input(z.object({ targetCareer: z.string().trim().min(2).max(180) })).mutation(async ({ ctx }) => {
      const profile = await getStudentProfile(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Complete onboarding before generating a roadmap." });
      return { profileReady: true };
    }),
    generate: protectedProcedure.input(z.object({ targetCareer: z.string().trim().min(2).max(180) })).mutation(async ({ ctx, input }) => {
      const [profile, latestSimulation, goals, projects, activeRoadmap] = await Promise.all([getStudentProfile(ctx.user.id), getLatestCompletedAdaptiveSimulation(ctx.user.id), listGoals(ctx.user.id), listProjects(ctx.user.id), getActiveRoadmap(ctx.user.id)]);
      if (!profile) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Complete onboarding before generating a roadmap." });
      try {
        const response = await invokeLLM({
          model: await preferredModel(),
          messages: [
            { role: "system", content: "You are PathPilot's roadmap planner for high-school students. Create an actionable but realistic three-year career roadmap. Return exactly nine milestones: three per year, with one skill, one project, and one experience milestone in each year. Adapt scope and deadlines to the student's profile, completed simulation observations, country context, existing goals, projects, and current roadmap. Do not duplicate an active or completed goal, project, or milestone. Country context is general planning information only: never invent local opportunities, admissions requirements, eligibility, or a deadline. Dates must be UTC ISO-8601 strings or null when a deadline would be speculative. Include only well-known, directly relevant resources with valid https URLs; use an empty resources list if unsure. Do not promise outcomes. Return only the requested JSON." },
            { role: "user", content: `Target career: ${input.targetCareer}\nStudent profile:\n${profileContext(profile)}\n\nNational education context:\n${getNationalEducationContext(profile.countryCode).planningSignals.join(" ")}\n${getNationalEducationContext(profile.countryCode).sourceNote}\n\nLatest observed simulation insight:\n${latestSimulation?.resultSummary ?? "No completed simulation yet."}\n\nExisting goals:\n${goals.map(goal => `${goal.title} [${goal.status}]`).join("; ") || "None"}\n\nExisting projects:\n${projects.map(project => `${project.name} [${project.status}]`).join("; ") || "None"}\n\nExisting roadmap:\n${activeRoadmap?.milestones.map(milestone => milestone.title).join("; ") || "None"}` },
          ],
          response_format: { type: "json_schema", json_schema: { name: "career_roadmap", strict: true, schema: roadmapJsonSchema } },
        });
        const parsed = roadmapGenerationSchema.safeParse(JSON.parse(contentFrom(response)));
        if (!parsed.success || new Set(parsed.data.milestones.map(milestone => `${milestone.year}-${milestone.category}`)).size !== 9) {
          throw new Error("The generated roadmap did not include the required yearly milestone structure.");
        }
        const milestones: RoadmapMilestoneInput[] = parsed.data.milestones.map((milestone, index) => ({
          ...milestone,
          deadline: milestone.deadline ? new Date(milestone.deadline) : undefined,
          sortOrder: index,
        }));
        return createRoadmap(ctx.user.id, input.targetCareer, milestones);
      } catch (error) {
        console.error("[PathPilot] roadmap generation failed", error);
        throw new TRPCError({ code: "BAD_GATEWAY", message: "Your personalized roadmap is temporarily unavailable. Please try again shortly." });
      }
    }),
    create: protectedProcedure.input(z.object({ targetCareer: z.string().trim().min(2).max(180), milestones: z.array(milestoneSchema).min(1).max(30) }))
      .mutation(({ ctx, input }) => createRoadmap(ctx.user.id, input.targetCareer, input.milestones as RoadmapMilestoneInput[])),
    updateMilestoneProgress: protectedProcedure.input(z.object({ id: z.string().uuid(), progress: z.number().int().min(0).max(100) }))
      .mutation(({ ctx, input }) => updateMilestoneProgress(ctx.user.id, input.id, input.progress)),
    recommendationContext: protectedProcedure.input(z.object({ simulationId: z.string().uuid().optional() })).query(({ ctx, input }) => getRoadmapRecommendationContext(ctx.user.id, input.simulationId)),
    recommendations: router({
      list: protectedProcedure.input(z.object({ simulationId: z.string().uuid().optional() })).query(({ ctx, input }) => listRoadmapRecommendations(ctx.user.id, input.simulationId)),
      generate: protectedProcedure.input(z.object({ simulationId: z.string().uuid().optional(), force: z.boolean().default(false) })).mutation(({ ctx, input }) => generateRoadmapRecommendations(ctx.user.id, input.simulationId, input.force)),
      evolutionPreview: protectedProcedure.input(z.object({ simulationId: z.string().uuid().optional() })).query(({ ctx, input }) => getRoadmapRecommendationEvolutionPreview(ctx.user.id, input.simulationId)),
      addEvolved: protectedProcedure.input(z.object({ simulationId: z.string().uuid().optional(), confirmed: z.literal(true) })).mutation(({ ctx, input }) => addEvolvedRoadmapRecommendations(ctx.user.id, input.simulationId)),
      update: protectedProcedure.input(z.object({ id: z.string().uuid(), title: z.string().trim().min(2).max(180).optional(), description: z.string().trim().min(10).max(1200).optional(), priority: prioritySchema.optional(), suggestedDeadline: z.date().nullable().optional() })).mutation(({ ctx, input }) => updateRoadmapRecommendation(ctx.user.id, input.id, input)),
      accept: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(({ ctx, input }) => acceptRoadmapRecommendation(ctx.user.id, input.id)),
      skip: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(({ ctx, input }) => skipRoadmapRecommendation(ctx.user.id, input.id)),
    }),
  }),

  simulations: router({
    adaptive: router({
      behaviorSummary: protectedProcedure.query(({ ctx }) => getBehaviorEvolution(ctx.user.id)),
      resume: protectedProcedure.query(async ({ ctx }) => {
        const simulation = await getResumableAdaptiveSimulation(ctx.user.id) ?? await getLatestCompletedAdaptiveSimulation(ctx.user.id);
        return simulation ? adaptiveSimulationResponse(simulation) : null;
      }),
      get: protectedProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
        const simulation = await getAdaptiveSimulation(ctx.user.id, input.id);
        if (!simulation) throw new TRPCError({ code: "NOT_FOUND", message: "Simulation not found." });
        return adaptiveSimulationResponse(simulation);
      }),
      start: protectedProcedure.input(z.object({ career: z.string().trim().min(2).max(180), responseTimingOptIn: z.boolean().default(false) })).mutation(async ({ ctx, input }) => {
        const profile = await getStudentProfile(ctx.user.id);
        if (!profile) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Complete onboarding before starting a simulation." });
        const resumable = await getResumableAdaptiveSimulation(ctx.user.id);
        return adaptiveSimulationResponse(resumable ?? await createAdaptiveSimulation(ctx.user.id, input.career, input.responseTimingOptIn));
      }),
      setTimingOptIn: protectedProcedure.input(z.object({ id: z.string().uuid(), optIn: z.boolean() })).mutation(async ({ ctx, input }) => setSimulationTimingOptIn(ctx.user.id, input.id, input.optIn)),
      choose: protectedProcedure.input(z.object({ id: z.string().uuid(), decisionId: z.string().trim().min(2).max(80), responseTimeMs: z.number().int().min(0).max(1_800_000).optional() })).mutation(async ({ ctx, input }) => {
        try {
          return adaptiveSimulationResponse(await chooseAdaptiveSimulationDecision(ctx.user.id, input.id, input.decisionId, input.responseTimeMs));
        } catch (error) {
          if (error instanceof Error && error.message === "Simulation not found.") throw new TRPCError({ code: "NOT_FOUND", message: error.message });
          if (error instanceof Error && (error.message.includes("not available") || error.message.includes("already complete"))) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
          throw error;
        }
      }),
    }),
    get: protectedProcedure.input(z.object({ id: z.string().uuid() })).query(({ ctx, input }) => getSimulation(ctx.user.id, input.id)),
    start: protectedProcedure.input(z.object({ career: z.string().trim().min(2).max(180) })).mutation(async ({ ctx, input }) => {
      const profile = await getStudentProfile(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Complete onboarding before starting a simulation." });
      try {
        const response = await invokeLLM({
          model: await preferredModel(),
          messages: [
            { role: "system", content: "You create concise, age-appropriate career simulations for high-school students. Build exactly three connected decision scenarios for the target career. Each scenario must have exactly three viable options. Choice impact scores must range from 0 to 100 and assess thoughtful problem solving, collaboration, and career-aligned judgment. Do not make any option humiliating or unsafe. Return only the requested JSON." },
            { role: "user", content: `Target career: ${input.career}\nStudent profile:\n${profileContext(profile)}` },
          ],
          response_format: { type: "json_schema", json_schema: { name: "career_simulation", strict: true, schema: simulationJsonSchema } },
        });
        const parsed = simulationGenerationSchema.safeParse(JSON.parse(contentFrom(response)));
        if (!parsed.success) throw new Error("The model simulation did not satisfy validation.");
        return createSimulation(ctx.user.id, { career: input.career, title: parsed.data.title, scenarios: parsed.data.scenarios });
      } catch (error) {
        console.error("[PathPilot] simulation generation failed", error);
        throw new TRPCError({ code: "BAD_GATEWAY", message: "The career simulation is temporarily unavailable. Please try again shortly." });
      }
    }),
    complete: protectedProcedure.input(z.object({ id: z.string().uuid(), choices: z.array(z.object({ scenarioId: z.string().regex(/^s[1-3]$/), choiceId: z.string().regex(/^c[1-3]$/) })).length(3) }))
      .mutation(async ({ ctx, input }) => {
        const simulation = await getSimulation(ctx.user.id, input.id);
        if (!simulation) throw new TRPCError({ code: "NOT_FOUND", message: "Simulation not found." });
        const scenarios = z.array(simulationScenarioSchema).length(3).safeParse(simulation.scenarios);
        if (!scenarios.success) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Simulation data cannot be evaluated." });
        const scores = input.choices.map(selection => {
          const scenario = scenarios.data.find(item => item.id === selection.scenarioId);
          const choice = scenario?.choices.find(item => item.id === selection.choiceId);
          if (!choice) throw new TRPCError({ code: "BAD_REQUEST", message: "A submitted simulation choice is invalid." });
          return choice;
        });
        const { technicalScore, leadershipScore, careerCompatibilityScore, score } = calculateSimulationScores(scores);
        return completeSimulation(ctx.user.id, input.id, { userChoices: input.choices, technicalScore, leadershipScore, careerCompatibilityScore, score, feedback: buildSimulationFeedback(simulation.career, technicalScore, leadershipScore, careerCompatibilityScore) });
      }),
  }),

  mentor: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const conversation = await getOrCreateMentorConversation(ctx.user.id);
      const messages = await getConversationMessages(ctx.user.id, conversation.id);
      return { conversation, messages };
    }),
    send: protectedProcedure.input(z.object({ content: z.string().trim().min(1).max(3000) })).mutation(async ({ ctx, input }) => {
      const [conversation, dashboard, latestSimulation, behaviorEvolution, planningActivity] = await Promise.all([getOrCreateMentorConversation(ctx.user.id), getDashboardData(ctx.user.id), getLatestCompletedAdaptiveSimulation(ctx.user.id), getBehaviorEvolution(ctx.user.id), listPlanningActivity(ctx.user.id)]);
      const messages = await getConversationMessages(ctx.user.id, conversation.id);
      await addMentorMessage(ctx.user.id, conversation.id, "user", input.content);
      const history = messages.slice(-12).map(message => `${message.role === "user" ? "Student" : "Mentor"}: ${message.content}`).join("\n");
      const roadmapSummary = dashboard.roadmap ? `${dashboard.roadmap.targetCareer} (${dashboard.roadmap.completionPercentage}% complete); milestones: ${dashboard.roadmap.milestones.map(milestone => `${milestone.title} ${milestone.progress}%`).join(", ")}` : "No roadmap created yet.";
      const goalsSummary = dashboard.goals.slice(0, 8).map(goal => `#${goal.id} ${goal.title} [${goal.status}, ${goal.priority}, ${goal.progress}%]`).join("; ") || "No goals yet.";
      const planningContext = buildMentorPlanningContext({ behaviorEvolution, planningActivity });
      try {
        const response = await invokeLLM({
          model: await preferredModel(),
          messages: [
            { role: "system", content: "You are PathPilot, a supportive career mentor for high-school students. Provide pragmatic, age-appropriate guidance, not promises. Help create goals, re-prioritize work, and compare learning decisions when requested. Do not diagnose, shame, or state that a student must choose a particular career. Treat the following profile, roadmap, goals, simulation observations, planning context, and conversation as private context. Simulation insights are limited observations from one or more scenarios, not personality diagnoses or career predictions. Return a JSON response with a concise Markdown reply. Populate suggestedGoal only when the student explicitly asks you to create a goal; otherwise return null. Populate priorityAdjustment only when the student explicitly asks you to change a listed goal's priority; otherwise return null.\n\nStudent profile:\n" + (dashboard.profile ? profileContext(dashboard.profile) : "Not yet completed.") + `\n\nRoadmap:\n${roadmapSummary}\n\nGoals:\n${goalsSummary}\n\nLatest simulation:\n${latestSimulation?.resultSummary ?? "No completed simulation yet."}\nTop observed traits: ${(latestSimulation?.behavioralProfile?.strongestTraits ?? []).join(", ") || "Not yet available."}\nCareer alignment: ${(latestSimulation?.compatibilityResults ?? []).slice(0, 3).map((item: any) => `${item.careerName} ${item.score}%`).join("; ") || "Not yet available."}\n\n${planningContext}\n\nPrior messages:\n${history}` },
            { role: "user", content: input.content },
          ],
          response_format: { type: "json_schema", json_schema: { name: "mentor_response", strict: true, schema: mentorJsonSchema } },
        });
        const parsed = mentorResponseSchema.safeParse(JSON.parse(contentFrom(response)));
        if (!parsed.success) throw new Error("The mentor response failed validation.");
        const updatedGoal = parsed.data.priorityAdjustment ? await updateGoal(ctx.user.id, parsed.data.priorityAdjustment.goalId, { priority: parsed.data.priorityAdjustment.priority }) : null;
        const actionNote = parsed.data.suggestedGoal ? "\n\n> **Suggested goal ready for your review.**" : updatedGoal ? `\n\n> **Priority updated:** ${updatedGoal.title} is now ${updatedGoal.priority}.` : "";
        const reply = parsed.data.reply + actionNote;
        await addMentorMessage(ctx.user.id, conversation.id, "assistant", reply);
        return { conversationId: conversation.id, reply, suggestedGoal: parsed.data.suggestedGoal, updatedGoal };
      } catch (error) {
        console.error("[PathPilot] mentor response failed", error);
        throw new TRPCError({ code: "BAD_GATEWAY", message: "Your career mentor is temporarily unavailable. Please try again shortly." });
      }
    }),
    acceptSuggestedGoal: protectedProcedure.input(suggestedGoalSchema).mutation(({ ctx, input }) => createGoal(ctx.user.id, { ...input, deadline: input.deadline ? new Date(input.deadline) : undefined, resources: [] })),
  }),

  projects: router({
    list: protectedProcedure.query(({ ctx }) => listProjects(ctx.user.id)),
    create: protectedProcedure.input(z.object({ name: z.string().trim().min(2).max(180), description: z.string().trim().min(10).max(4000), scopeStatement: z.string().trim().min(1).max(2000).nullable().optional(), projectNotes: z.string().trim().min(1).max(6000).nullable().optional(), skills: z.array(z.string().trim().min(1).max(80)).max(20), githubLink: z.string().url().max(500).optional(), liveUrl: z.string().url().max(500).optional(), status: z.enum(["idea", "in_progress", "completed", "archived"]).default("in_progress"), progress: z.number().int().min(0).max(100).default(0), startDate: z.string().date().optional(), completionDate: z.string().date().optional(), careerId: z.string().uuid().optional(), goalIds: z.array(z.string().uuid()).max(20).optional() })).mutation(({ ctx, input }) => createProject(ctx.user.id, input)),
    createFromRoadmapMilestone: protectedProcedure.input(z.object({ milestoneId: z.string().uuid() })).mutation(({ ctx, input }) => createProjectFromRoadmapMilestone(ctx.user.id, input.milestoneId)),
    update: protectedProcedure.input(z.object({ id: z.string().uuid(), name: z.string().trim().min(2).max(180).optional(), description: z.string().trim().min(10).max(4000).optional(), scopeStatement: z.string().trim().min(1).max(2000).nullable().optional(), projectNotes: z.string().trim().min(1).max(6000).nullable().optional(), skills: z.array(z.string().trim().min(1).max(80)).max(20).optional(), status: z.enum(["idea", "in_progress", "completed", "archived"]).optional(), progress: z.number().int().min(0).max(100).optional(), githubLink: z.string().url().max(500).nullable().optional(), liveUrl: z.string().url().max(500).nullable().optional(), startDate: z.string().date().nullable().optional(), completionDate: z.string().date().nullable().optional() })).mutation(async ({ ctx, input }) => { const project = await updateProject(ctx.user.id, input.id, input); await clearProjectGuidanceCache(ctx.user.id, input.id); return project; }),
    createMilestone: protectedProcedure.input(z.object({ projectId: z.string().uuid(), title: z.string().trim().min(2).max(180), details: z.string().trim().min(1).max(2000).nullable().optional(), status: z.enum(["not_started", "in_progress", "completed"]).default("not_started"), progress: z.number().int().min(0).max(100).default(0), targetDate: z.string().date().nullable().optional(), sortOrder: z.number().int().min(0).max(999).default(0) })).mutation(async ({ ctx, input }) => { const milestone = await createProjectWorkspaceMilestone(ctx.user.id, input.projectId, input); await clearProjectGuidanceCache(ctx.user.id, input.projectId); return milestone; }),
    updateMilestone: protectedProcedure.input(z.object({ projectId: z.string().uuid(), id: z.string().uuid(), title: z.string().trim().min(2).max(180).optional(), details: z.string().trim().min(1).max(2000).nullable().optional(), status: z.enum(["not_started", "in_progress", "completed"]).optional(), progress: z.number().int().min(0).max(100).optional(), targetDate: z.string().date().nullable().optional(), sortOrder: z.number().int().min(0).max(999).optional() })).mutation(async ({ ctx, input }) => { const milestone = await updateProjectWorkspaceMilestone(ctx.user.id, input.projectId, input.id, input); await clearProjectGuidanceCache(ctx.user.id, input.projectId); return milestone; }),
    deleteMilestone: protectedProcedure.input(z.object({ projectId: z.string().uuid(), id: z.string().uuid() })).mutation(async ({ ctx, input }) => { const result = await deleteProjectWorkspaceMilestone(ctx.user.id, input.projectId, input.id); await clearProjectGuidanceCache(ctx.user.id, input.projectId); return result; }),
    guidance: protectedProcedure.input(z.object({ projectId: z.string().uuid(), request: z.string().trim().min(3).max(1200), refresh: z.boolean().default(false) })).mutation(async ({ ctx, input }) => {
      const project = await getProjectWorkspace(ctx.user.id, input.projectId);
      if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Project workspace not found." });
      const inputHash = projectGuidanceInputHash({ request: input.request, project: { name: project.name, description: project.description, scopeStatement: project.scopeStatement, projectNotes: project.projectNotes, skills: project.skills, status: project.status, progress: project.progress, startDate: project.startDate, completionDate: project.completionDate, githubLink: project.githubLink, liveUrl: project.liveUrl, milestones: project.milestones.map(item => ({ title: item.title, details: item.details, status: item.status, progress: item.progress, targetDate: item.targetDate, sortOrder: item.sortOrder })) } });
      if (input.refresh) await invalidateProjectGuidanceCache(ctx.user.id, input.projectId);
      if (!input.refresh) {
        try {
          const cached = await getCachedProjectGuidance(ctx.user.id, input.projectId, inputHash);
          const parsedCached = projectGuidanceSchema.safeParse(cached);
          if (parsedCached.success) return { ...parsedCached.data, cacheStatus: "cached" as const, cacheVersion: PROJECT_GUIDANCE_CACHE_VERSION };
        } catch (error) { console.error("[PathPilot] project guidance cache read failed", error); }
      }
      try {
        const response = await invokeLLM({
          model: await preferredModel(),
          messages: [
            { role: "system", content: "You are PathPilot's project coach for high-school students. Give concise, age-appropriate guidance for one selected student-owned project. Use only the supplied project context and request. Treat the context as private. Do not access or infer facts from repository or live-project links, external sources, goals, roadmaps, career matches, simulations, mentor history, or behavioral information. Do not diagnose, label ability, predict career outcomes, guarantee results, or make automatic changes. When details are missing, say so plainly and suggest a student-controlled next step. Return only the requested JSON." },
            { role: "user", content: `Selected project workspace:\n${projectWorkspaceContext(project)}\n\nStudent request:\n${input.request}` },
          ],
          response_format: { type: "json_schema", json_schema: { name: "project_guidance", strict: true, schema: projectGuidanceJsonSchema } },
        });
        const parsed = projectGuidanceSchema.safeParse(JSON.parse(contentFrom(response)));
        if (!parsed.success) throw new Error("The project guidance response failed validation.");
        try { await cacheProjectGuidance(ctx.user.id, input.projectId, inputHash, parsed.data); } catch (error) { console.error("[PathPilot] project guidance cache write failed", error); }
        return { ...parsed.data, cacheStatus: "fresh" as const, cacheVersion: PROJECT_GUIDANCE_CACHE_VERSION };
      } catch (error) {
        console.error("[PathPilot] project guidance failed", error);
        throw new TRPCError({ code: "BAD_GATEWAY", message: "Project guidance is temporarily unavailable. Please try again shortly." });
      }
    }),
  }),
  portfolio: router({
    mine: protectedProcedure.query(({ ctx }) => getPortfolioWorkspace(ctx.user.id)),
    saveProfile: protectedProcedure.input(z.object({ handle: z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9-]{2,47}$/), displayName: z.string().trim().min(1).max(80), introduction: z.string().trim().min(1).max(1000).nullable().optional() })).mutation(({ ctx, input }) => upsertPortfolioProfile(ctx.user.id, input)),
    createDraftFromProject: protectedProcedure.input(z.object({ projectId: z.string().uuid() })).mutation(({ ctx, input }) => createPortfolioDraftFromProject(ctx.user.id, input.projectId)),
    updateProject: protectedProcedure.input(z.object({ id: z.string().uuid(), title: z.string().trim().min(2).max(180).optional(), summary: z.string().trim().min(10).max(4000).optional(), technologies: z.array(z.string().trim().min(1).max(80)).max(20).optional(), repositoryUrl: z.string().url().max(500).nullable().optional(), liveUrl: z.string().url().max(500).nullable().optional() })).mutation(({ ctx, input }) => updatePortfolioProject(ctx.user.id, input.id, input)),
    publish: protectedProcedure.input(z.object({ id: z.string().uuid(), confirmed: z.literal(true) })).mutation(({ ctx, input }) => publishPortfolioProject(ctx.user.id, input.id)),
    unpublish: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(({ ctx, input }) => unpublishPortfolioProject(ctx.user.id, input.id)),
    public: publicProcedure.input(z.object({ handle: z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9-]{2,47}$/) })).query(({ input }) => getPublicPortfolio(input.handle)),
  }),
});
