import { currentSupabaseClient } from "../supabase";
import { createGoal, createRoadmap, getActiveRoadmap, getLatestCompletedAdaptiveSimulation, getStudentProfile, listGoals, listProjects, type RoadmapMilestoneInput } from "../db";
import { buildCountryAwareRecommendations } from "./recommendations";
import { getNationalEducationContext } from "./national-context";

type RecommendationStatus = "pending" | "accepted" | "skipped" | "dismissed";
type RecommendationInput = { title?: string; description?: string; priority?: "low" | "medium" | "high"; suggestedDeadline?: Date | null };
const client = () => currentSupabaseClient();
const check = (error: { message: string } | null) => { if (error) throw new Error("We could not update your roadmap recommendations. Please try again."); };
const asDate = (value: string | null) => value ? new Date(value) : null;

function recommendation(row: any) {
  return {
    id: row.id, userId: row.user_id, sourceSimulationId: row.source_simulation_id, roadmapId: row.roadmap_id, acceptedGoalId: row.accepted_goal_id,
    targetCareer: row.target_career, countrySnapshot: row.country_snapshot, educationSystemSnapshot: row.education_system_snapshot,
    phase: row.phase, title: row.title, description: row.description, rationale: row.rationale, category: row.category as "skill" | "project" | "experience",
    suggestedDeadline: asDate(row.suggested_deadline), priority: row.priority as "low" | "medium" | "high", estimatedHours: row.estimated_hours,
    status: row.status as RecommendationStatus, sortOrder: row.sort_order, contextVersion: row.context_version, createdAt: new Date(row.created_at), updatedAt: new Date(row.updated_at),
  };
}

export async function listRoadmapRecommendations(userId: string, sourceSimulationId?: string) {
  let query = client().from("roadmap_recommendations").select("*").eq("user_id", userId).order("sort_order").order("created_at");
  if (sourceSimulationId) query = query.eq("source_simulation_id", sourceSimulationId);
  const { data, error } = await query;
  check(error);
  return (data ?? []).map(recommendation);
}

export async function getRoadmapRecommendationContext(userId: string, simulationId?: string) {
  const [profile, simulation, goals, projects, roadmap] = await Promise.all([
    getStudentProfile(userId),
    simulationId ? getLatestCompletedSimulationById(userId, simulationId) : getLatestCompletedAdaptiveSimulation(userId),
    listGoals(userId), listProjects(userId), getActiveRoadmap(userId),
  ]);
  if (!profile) throw new Error("Complete onboarding before building a roadmap.");
  if (!simulation) throw new Error("Complete a simulation before building recommendations.");
  const national = getNationalEducationContext(profile.countryCode);
  return { profile, simulation, goals, projects, roadmap, national };
}

async function getLatestCompletedSimulationById(userId: string, simulationId: string) {
  const { data, error } = await client().from("simulations").select("*").eq("id", simulationId).eq("user_id", userId).eq("engine_version", "adaptive-v2").eq("status", "completed").maybeSingle();
  check(error);
  return data ? {
    id: data.id, career: data.career, behavioralProfile: data.behavioral_profile ?? null, compatibilityResults: data.compatibility_results ?? [], resultSummary: data.result_summary ?? null,
  } : null;
}

export async function generateRoadmapRecommendations(userId: string, simulationId?: string, force = false) {
  const context = await getRoadmapRecommendationContext(userId, simulationId);
  const existingRecommendations = await listRoadmapRecommendations(userId, context.simulation.id);
  const pending = existingRecommendations.filter(item => item.status === "pending");
  if (pending.length && !force) return { context, recommendations: existingRecommendations };
  if (pending.length && force) {
    const { error: dismissError } = await client().from("roadmap_recommendations").update({ status: "dismissed", updated_at: new Date().toISOString() }).eq("user_id", userId).eq("source_simulation_id", context.simulation.id).eq("status", "pending");
    check(dismissError);
  }
  const existingTitles = [
    ...context.goals.filter(goal => goal.status !== "completed").map(goal => goal.title),
    ...context.projects.filter(project => project.status !== "archived").map(project => project.name),
    ...(context.roadmap?.milestones ?? []).map(milestone => milestone.title),
  ];
  const drafts = buildCountryAwareRecommendations({
    career: context.simulation.career, countryCode: context.profile.countryCode, grade: context.profile.grade,
    skills: context.profile.skills, activities: context.profile.activities, existingTitles,
    strongestTraits: context.simulation.behavioralProfile?.strongestTraits ?? [],
  });
  const { data, error } = await client().from("roadmap_recommendations").insert(drafts.map(item => ({
    user_id: userId, source_simulation_id: context.simulation.id, target_career: context.simulation.career,
    country_snapshot: context.profile.countryCode ?? "ZZ", education_system_snapshot: context.national.educationSystem,
    phase: item.phase, title: item.title, description: item.description, rationale: item.rationale, category: item.category,
    priority: item.priority, estimated_hours: item.estimatedHours, sort_order: item.sortOrder,
  }))).select("*");
  check(error);
  return { context, recommendations: (data ?? []).map(recommendation) };
}

export async function updateRoadmapRecommendation(userId: string, recommendationId: string, update: RecommendationInput) {
  const patch = {
    ...(update.title !== undefined ? { title: update.title } : {}),
    ...(update.description !== undefined ? { description: update.description } : {}),
    ...(update.priority !== undefined ? { priority: update.priority } : {}),
    ...(update.suggestedDeadline !== undefined ? { suggested_deadline: update.suggestedDeadline?.toISOString() ?? null } : {}),
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await client().from("roadmap_recommendations").update(patch).eq("id", recommendationId).eq("user_id", userId).eq("status", "pending").select("*").maybeSingle();
  check(error);
  if (!data) throw new Error("Roadmap recommendation not found or no longer editable.");
  return recommendation(data);
}

export async function skipRoadmapRecommendation(userId: string, recommendationId: string) {
  const { data, error } = await client().from("roadmap_recommendations").update({ status: "skipped", updated_at: new Date().toISOString() }).eq("id", recommendationId).eq("user_id", userId).eq("status", "pending").select("*").maybeSingle();
  check(error);
  if (!data) throw new Error("Roadmap recommendation not found or no longer pending.");
  return recommendation(data);
}

export async function acceptRoadmapRecommendation(userId: string, recommendationId: string) {
  const { data, error } = await client().from("roadmap_recommendations").select("*").eq("id", recommendationId).eq("user_id", userId).maybeSingle();
  check(error);
  if (!data) throw new Error("Roadmap recommendation not found.");
  if (data.status === "accepted") return recommendation(data);
  if (data.status !== "pending") throw new Error("Only pending recommendations can be added to your roadmap.");
  const item = recommendation(data);
  const goal = await createGoal(userId, { title: item.title, description: item.description, category: item.category, deadline: item.suggestedDeadline ?? undefined, priority: item.priority, estimatedHours: item.estimatedHours, resources: [] });
  let active = await getActiveRoadmap(userId);
  if (!active) {
    active = await createRoadmap(userId, item.targetCareer, [{ year: 1, title: item.title, description: item.description, category: item.category, deadline: item.suggestedDeadline ?? undefined, priority: item.priority, estimatedHours: item.estimatedHours, resources: [], sortOrder: 0 }]);
  } else {
    const sortOrder = Math.max(-1, ...active.milestones.map(milestone => milestone.sortOrder)) + 1;
    const { error: milestoneError } = await client().from("roadmap_milestones").insert({ roadmap_id: active.id, year: 1, title: item.title, description: item.description, category: item.category, deadline: item.suggestedDeadline?.toISOString() ?? null, priority: item.priority, estimated_hours: item.estimatedHours, resources: [], sort_order: sortOrder });
    check(milestoneError);
  }
  const roadmapId = active!.id;
  const { data: saved, error: updateError } = await client().from("roadmap_recommendations").update({ status: "accepted", accepted_goal_id: goal.id, roadmap_id: roadmapId, updated_at: new Date().toISOString() }).eq("id", item.id).eq("user_id", userId).select("*").maybeSingle();
  check(updateError);
  if (!saved) throw new Error("Roadmap recommendation could not be accepted.");
  return recommendation(saved);
}
