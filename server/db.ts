import { createClient } from "@supabase/supabase-js";
import { currentSupabaseClient, getSupabaseConfig } from "./supabase";
import { buildAdaptiveResults, chooseSimulationDecision, getPublicScenario, getSimulationGraph, getSimulationGraphById, initialSimulationState } from "./simulation/engine";
import type { BehavioralEvidence, DecisionRecord, SimulationState } from "./simulation/contracts";
import { fetchNasaSpaceAppsRecord } from "./opportunities/nasa-space-apps-source";
import { fetchBnlHighSchoolResearchRecord } from "./opportunities/bnl-high-school-research-source";
import { fetchCuratedOpportunityDrafts, type OpportunityCategory } from "./opportunities/curated-catalog-source";
import { explainOpportunityRelevance, opportunityRelevanceMethod } from "./opportunities/relevance";
import { buildBehaviorEvolution } from "./simulation/evolution";
import { hasTimePressurePresentation } from "./simulation/time-pressure-presentation";
import { buildDashboardNextAction } from "./dashboard/intelligence";
import { goalActivity, presentPlanningActivity, projectActivity, roadmapMilestoneActivity, type PlanningActivitySubject, type PlanningActivityType } from "./planning-activity";
import { buildPlanningReview } from "./planning-review";
import { buildCrossProductEvidenceSummary } from "./cross-product-evidence-policy";
import { createPlanningReportShareToken, hashPlanningReportShareToken, isPlanningReportShareToken, planningReportShareExpiresAt, toSharedPlanningReport } from "./report-share";

export type ResourceLink = { label: string; url: string };
export type CareerRecommendation = { name: string; description: string; salaryRange: string; educationRequirements: string; requiredSkills: string[]; dailyResponsibilities: string[]; relatedCareers: string[]; matchScore: number; reasoning: string; strengths: string[]; missingSkills: string[]; realityCheck: string; nextSteps: string[] };
export type RoadmapMilestoneInput = { year: number; title: string; description?: string; category: "skill" | "project" | "experience"; deadline?: Date; priority: "low" | "medium" | "high"; estimatedHours: number; resources: ResourceLink[]; progress?: number; status?: GoalStatus; sortOrder: number };
type GoalStatus = "not_started" | "in_progress" | "completed" | "paused";

const client = () => currentSupabaseClient();
const list = <T>(value: T[] | null) => value ?? [];
const strings = (value: unknown) => Array.isArray(value) ? value as string[] : [];
const resources = (value: unknown) => Array.isArray(value) ? value as ResourceLink[] : [];
const check = (error: { message: string } | null) => { if (error) throw new Error("We could not save your PathPilot data. Please try again."); };
const date = (value: string | null | undefined) => value ? new Date(value) : null;
const iso = (value?: Date) => value?.toISOString() ?? null;
const slug = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
export async function recordPlanningActivity(userId: string, eventType: PlanningActivityType, subjectType: PlanningActivitySubject, subjectId: string, metadata: Record<string, unknown>) { try { const { error } = await client().from("behavioral_activity_events").insert({ user_id: userId, event_type: eventType, subject_type: subjectType, subject_id: subjectId, metadata }); if (error) console.warn("[PathPilot] planning activity was not recorded", error.message); } catch (error) { console.warn("[PathPilot] planning activity was not recorded", error); } }
export async function listPlanningActivity(userId: string) { const { data, error } = await client().from("behavioral_activity_events").select("id, event_type, subject_type, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(12); check(error); return list(data as any[]).map(row => presentPlanningActivity({ id: row.id, eventType: row.event_type as PlanningActivityType, subjectType: row.subject_type as PlanningActivitySubject, createdAt: new Date(row.created_at) })); }
export async function exportPlanningActivity(userId: string) { const { data, error } = await client().from("behavioral_activity_events").select("event_type, subject_type, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(100); check(error); return list(data as any[]).map(row => { const item = presentPlanningActivity({ id: "export", eventType: row.event_type as PlanningActivityType, subjectType: row.subject_type as PlanningActivitySubject, createdAt: new Date(row.created_at) }); return { activity: item.title, subject: item.subjectType, recordedAt: item.createdAt }; }); }
export async function clearPlanningActivity(userId: string) { const { error } = await client().from("behavioral_activity_events").delete().eq("user_id", userId); check(error); return { cleared: true }; }

function serviceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Career catalog persistence is not configured.");
  return createClient(getSupabaseConfig().url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function validateCareerCatalogWrite(userId: string, recommendations: CareerRecommendation[]) {
  if (!uuidPattern.test(userId)) throw new Error("A valid authenticated user is required to update career matches.");
  if (recommendations.length !== 5) throw new Error("Career discovery must contain exactly five matches.");
  const names = new Set<string>();
  for (const recommendation of recommendations) {
    const normalizedName = recommendation.name.trim().toLowerCase();
    if (!normalizedName || normalizedName.length > 180 || names.has(normalizedName) || !Number.isInteger(recommendation.matchScore) || recommendation.matchScore < 1 || recommendation.matchScore > 100) throw new Error("Career recommendations failed validation.");
    if (recommendation.requiredSkills.length < 3 || recommendation.requiredSkills.length > 8 || recommendation.dailyResponsibilities.length < 2 || recommendation.dailyResponsibilities.length > 6 || recommendation.relatedCareers.length < 2 || recommendation.relatedCareers.length > 6 || recommendation.strengths.length < 1 || recommendation.strengths.length > 6 || recommendation.missingSkills.length < 1 || recommendation.missingSkills.length > 6 || recommendation.nextSteps.length < 2 || recommendation.nextSteps.length > 5) throw new Error("Career recommendations failed validation.");
    names.add(normalizedName);
  }
}
async function syncSharedCareerCatalog(recommendations: CareerRecommendation[]) {
  const admin = serviceClient();
  const stored: { careerId: string; recommendation: CareerRecommendation }[] = [];
  for (const recommendation of recommendations) {
    const { data, error } = await admin.from("careers").upsert({ slug: slug(recommendation.name), name: recommendation.name, description: recommendation.description, salary_range: recommendation.salaryRange, education_requirements: recommendation.educationRequirements, required_skills: recommendation.requiredSkills, daily_responsibilities: recommendation.dailyResponsibilities, related_careers: recommendation.relatedCareers }, { onConflict: "slug" }).select("id").single();
    check(error); stored.push({ careerId: (data as any).id, recommendation });
  }
  return stored;
}
export function profile(row: any) { return row ? { id: row.id, userId: row.user_id, grade: row.grade, location: row.location, countryCode: row.country_code ?? null, educationSystem: row.education_system ?? null, interests: strings(row.interests), skills: strings(row.skills), activities: strings(row.activities), careerPreferences: strings(row.career_preferences), onboardingCompletedAt: date(row.onboarding_completed_at), createdAt: new Date(row.created_at), updatedAt: new Date(row.updated_at) } : null; }
export function onboardingDraft(row: any) { return row ? { currentStep: row.current_step, payload: row.payload as Record<string, unknown> } : null; }
function goal(row: any) { return { id: row.id, userId: row.user_id, title: row.title, description: row.description, category: row.category, deadline: date(row.deadline), priority: row.priority, estimatedHours: row.estimated_hours, resources: resources(row.resources), progress: row.progress, status: row.status as GoalStatus, createdAt: new Date(row.created_at), updatedAt: new Date(row.updated_at) }; }
function milestone(row: any) { return { id: row.id, roadmapId: row.roadmap_id, year: row.year, title: row.title, description: row.description, category: row.category, deadline: date(row.deadline), priority: row.priority, estimatedHours: row.estimated_hours, resources: resources(row.resources), progress: row.progress, status: row.status as GoalStatus, sortOrder: row.sort_order }; }
function simulation(row: any) { return row ? { id: row.id, userId: row.user_id, career: row.career, title: row.title, scenarios: row.scenarios ?? [], userChoices: row.user_choices ?? [], technicalScore: row.technical_score ?? 0, leadershipScore: row.leadership_score ?? 0, careerCompatibilityScore: row.career_compatibility_score ?? 0, score: row.score ?? 0, feedback: row.feedback, status: row.status, completedAt: date(row.completed_at), createdAt: new Date(row.created_at), updatedAt: date(row.updated_at) ?? new Date(row.created_at), engineVersion: row.engine_version ?? "legacy-v1", scenarioGraphId: row.scenario_graph_id, currentNodeId: row.current_node_id, nodeHistory: list(row.node_history), decisionHistory: list(row.decision_history), simulationState: row.simulation_state ?? null, behavioralEvidence: list(row.behavioral_evidence), behavioralEvents: list(row.behavioral_events), behavioralProfile: row.behavioral_profile ?? null, compatibilityResults: list(row.compatibility_results), resultSummary: row.result_summary ?? null, responseTimingOptIn: Boolean(row.response_timing_opt_in), responseTimingEvents: list(row.response_timing_events) } : undefined; }
function opportunity(row: any) { const source = row.source_name ? { name: row.source_name } : Array.isArray(row.opportunity_sources) ? row.opportunity_sources[0] : row.opportunity_sources; const nestedState = (list(row.student_opportunity_states) as any[])[0]; const state = row.student_status ? { status: row.student_status } : nestedState; return { id: row.id, title: row.title, summary: row.summary, category: row.category as OpportunityCategory, participationMode: row.participation_mode, locationLabel: row.location_label, sourceDateLabel: row.source_date_label ?? null, careerDomains: strings(row.career_domains), countryCodes: strings(row.country_codes), eligibleGrades: strings(row.eligible_grades), startAt: date(row.start_at), endAt: date(row.end_at), registrationOpensAt: date(row.registration_opens_at), applicationDeadlineAt: date(row.application_deadline_at), eligibilitySummary: row.eligibility_summary, applicationUrl: row.application_url, sourceUrl: row.source_url, sourceName: source?.name ?? "Official source", verifiedAt: new Date(row.verified_at), savedStatus: state?.status ?? null }; }

export async function getStudentProfile(userId: string) { const { data, error } = await client().from("student_profiles").select("*").eq("user_id", userId).maybeSingle(); check(error); return profile(data); }
export async function getOnboardingDraft(userId: string) { const { data, error } = await client().from("onboarding_drafts").select("*").eq("user_id", userId).maybeSingle(); check(error); return onboardingDraft(data); }
export async function saveOnboardingDraft(userId: string, currentStep: number, payload: Record<string, unknown>) { const { data, error } = await client().from("onboarding_drafts").upsert({ user_id: userId, current_step: currentStep, payload, updated_at: new Date().toISOString() }, { onConflict: "user_id" }).select().single(); check(error); return data; }
export async function saveStudentProfile(userId: string, value: { grade: string; location: string; countryCode?: string | null; educationSystem?: string | null; interests: string[]; skills: string[]; activities: string[]; careerPreferences: string[] }) { const db = client(); const { data, error } = await db.from("student_profiles").upsert({ user_id: userId, grade: value.grade, location: value.location, country_code: value.countryCode ?? null, education_system: value.educationSystem ?? null, interests: value.interests, skills: value.skills, activities: value.activities, career_preferences: value.careerPreferences, onboarding_completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: "user_id" }).select().single(); check(error); const draft = await db.from("onboarding_drafts").delete().eq("user_id", userId); check(draft.error); return profile(data); }
export async function updateStudentCountryContext(userId: string, countryCode: string, educationSystem: string) { const { data, error } = await client().from("student_profiles").update({ country_code: countryCode, education_system: educationSystem, updated_at: new Date().toISOString() }).eq("user_id", userId).select().maybeSingle(); check(error); if (!data) throw new Error("Student profile not found."); return profile(data); }
function careerDomainsFor(name: string) { const value = name.toLowerCase(); const tags = new Set<string>(); if (/software|data|cyber|computer|developer|it/.test(value)) tags.add("technology"); if (/engineer|architect|mechanic/.test(value)) tags.add("engineering"); if (/doctor|nurs|biolog|scient|environment|research|chemist|physic/.test(value)) tags.add("science"); if (/designer|artist|media|writer/.test(value)) tags.add("design"); if (/business|market|finance|entrepreneur/.test(value)) tags.add("business"); if (/teacher|psych|social|policy|law/.test(value)) tags.add("social-impact"); return Array.from(tags); }
export type OpportunityDiscoveryFilters = { category?: OpportunityCategory; alignedOnly?: boolean; search?: string; countryCode?: string; grade?: string; deadlineOnly?: boolean; page?: number; pageSize?: number };
export async function searchVerifiedOpportunities(userId: string, filters: OpportunityDiscoveryFilters = {}) {
  const [profile, matches] = await Promise.all([getStudentProfile(userId), getCareerMatches(userId)]);
  const careerDirections = matches.map(match => match.career.name);
  const targetDomains = Array.from(new Set(matches.flatMap(match => careerDomainsFor(match.career.name))));
  const page = Math.max(1, Math.floor(filters.page ?? 1));
  const pageSize = Math.max(1, Math.min(48, Math.floor(filters.pageSize ?? 12)));
  const search = filters.search?.trim() || null;
  const countryCode = filters.countryCode?.trim().toUpperCase() || null;
  const grade = filters.grade?.trim() || null;
  const { data, error } = await client().rpc("list_discoverable_opportunities", {
    filter_category: filters.category ?? null,
    filter_search: search,
    filter_country_code: countryCode,
    filter_grade: grade,
    require_application_deadline: Boolean(filters.deadlineOnly),
    filter_domains: filters.alignedOnly && targetDomains.length ? targetDomains : null,
    page_number: page,
    page_size: pageSize,
    ranking_country_code: profile?.countryCode ?? null,
    ranking_grade: profile?.grade ?? null,
    ranking_domains: targetDomains.length ? targetDomains : null,
  });
  check(error);
  const rows = list(data as any[]);
  const relevanceContext = { careerDirections, careerDomains: targetDomains, countryCode: profile?.countryCode ?? null, grade: profile?.grade ?? null };
  const items = rows.map(opportunity).map(item => ({ ...item, alignedCareers: matches.filter(match => careerDomainsFor(match.career.name).some(domain => item.careerDomains.includes(domain))).map(match => match.career.name), relevanceReasons: explainOpportunityRelevance(item, relevanceContext) }));
  const totalCount = rows.length ? Number((rows[0] as any).total_count) : 0;
  const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : 0;
  return { items, totalCount, page, pageSize, totalPages, hasNextPage: page < totalPages, relevanceMethod: opportunityRelevanceMethod };
}
export async function listVerifiedOpportunities(userId: string, filters: OpportunityDiscoveryFilters = {}) { return (await searchVerifiedOpportunities(userId, filters)).items; }
export async function getLatestSavedOpportunity(userId: string) { const { data, error } = await client().from("student_opportunity_states").select("updated_at, opportunities!inner(title, source_date_label)").eq("user_id", userId).eq("status", "saved").order("updated_at", { ascending: false }).limit(1).maybeSingle(); check(error); const row = data as any; const record = Array.isArray(row?.opportunities) ? row.opportunities[0] : row?.opportunities; return record ? { title: record.title as string, sourceDateLabel: record.source_date_label as string | null } : null; }
export async function setStudentOpportunityState(userId: string, opportunityId: string, status: "saved" | "dismissed") { const db = client(); const { data: available, error: availableError } = await db.from("opportunities").select("id").eq("id", opportunityId).eq("status", "active").maybeSingle(); check(availableError); if (!available) throw new Error("Verified opportunity not found."); const { data, error } = await db.from("student_opportunity_states").upsert({ user_id: userId, opportunity_id: opportunityId, status, updated_at: new Date().toISOString() }, { onConflict: "user_id,opportunity_id" }).select().single(); check(error); await recordPlanningActivity(userId, status === "saved" ? "opportunity_saved" : "opportunity_dismissed", "opportunity", opportunityId, {}); return { opportunityId: (data as any).opportunity_id, status: (data as any).status as "saved" | "dismissed" }; }
export async function createGoalFromVerifiedOpportunity(userId: string, opportunityId: string) {
  const db = client();
  const { data: row, error } = await db.from("opportunities").select("id, title, summary, eligibility_summary, application_url, source_url, status").eq("id", opportunityId).eq("status", "active").maybeSingle();
  check(error);
  if (!row) throw new Error("Verified opportunity not found.");
  const marker = `PathPilot opportunity: ${(row as any).id}`;
  const { data: existing, error: existingError } = await db.from("goals").select("id, resources").eq("user_id", userId);
  check(existingError);
  const duplicate = list(existing as any[]).find(item => resources((item as any).resources).some(resource => resource.label === marker));
  if (duplicate) return { goalId: (duplicate as any).id as string, created: false };
  const goal = await createGoal(userId, {
    title: `Prepare for ${(row as any).title}`,
    description: `${(row as any).summary}\n\nBefore acting, confirm eligibility and current organizer details: ${(row as any).eligibility_summary}`,
    category: "opportunity",
    priority: "medium",
    estimatedHours: 2,
    resources: [{ label: "Official application or participation page", url: (row as any).application_url }, { label: "Organizer source page", url: (row as any).source_url }, { label: marker, url: (row as any).application_url }],
  });
  await recordPlanningActivity(userId, "opportunity_goal_created", "opportunity", opportunityId, {});
  return { goalId: goal!.id, created: true };
}
export async function refreshNasaSpaceAppsOpportunity() {
  const record = await fetchNasaSpaceAppsRecord();
  const admin = serviceClient();
  const { data: source, error: sourceError } = await admin.from("opportunity_sources").upsert({ slug: record.source.slug, name: record.source.name, source_url: record.source.sourceUrl, source_type: record.source.sourceType, verification_note: record.source.verificationNote, last_verified_at: record.source.verifiedAt.toISOString(), active: true, updated_at: new Date().toISOString() }, { onConflict: "slug" }).select("id").single();
  check(sourceError);
  const { data, error } = await admin.from("opportunities").upsert({ source_id: (source as any).id, external_id: record.opportunity.externalId, title: record.opportunity.title, summary: record.opportunity.summary, category: record.opportunity.category, participation_mode: record.opportunity.participationMode, location_label: record.opportunity.locationLabel, source_date_label: "November 14–15, 2026", career_domains: ["science", "technology", "engineering", "design"], country_codes: record.opportunity.countryCodes, start_at: record.opportunity.startAt.toISOString(), end_at: record.opportunity.endAt.toISOString(), registration_opens_at: record.opportunity.registrationOpensAt.toISOString(), eligibility_summary: record.opportunity.eligibilitySummary, application_url: record.opportunity.applicationUrl, source_url: record.opportunity.sourceUrl, source_updated_at: record.opportunity.sourceUpdatedAt, verified_at: record.opportunity.verifiedAt.toISOString(), status: "active", updated_at: new Date().toISOString() }, { onConflict: "source_id,external_id" }).select("id, title, verified_at").single();
  check(error);
  return { id: (data as any).id, title: (data as any).title, verifiedAt: new Date((data as any).verified_at) };
}
export async function refreshBnlHighSchoolResearchOpportunity() {
  const record = await fetchBnlHighSchoolResearchRecord();
  const admin = serviceClient();
  const now = new Date().toISOString();
  const { data: source, error: sourceError } = await admin.from("opportunity_sources").upsert({ slug: record.source.slug, name: record.source.name, source_url: record.source.sourceUrl, source_type: record.source.sourceType, verification_note: record.source.verificationNote, last_verified_at: record.source.verifiedAt.toISOString(), active: true, updated_at: now }, { onConflict: "slug" }).select("id").single();
  check(sourceError);
  const { data, error } = await admin.from("opportunities").upsert({ source_id: (source as any).id, external_id: record.opportunity.externalId, title: record.opportunity.title, summary: record.opportunity.summary, category: record.opportunity.category, participation_mode: record.opportunity.participationMode, location_label: record.opportunity.locationLabel, source_date_label: record.opportunity.sourceDateLabel, career_domains: ["science", "technology", "engineering"], country_codes: record.opportunity.countryCodes, eligible_grades: record.opportunity.eligibleGrades, start_at: record.opportunity.startAt.toISOString(), end_at: record.opportunity.endAt.toISOString(), registration_opens_at: null, application_deadline_at: record.opportunity.applicationDeadlineAt.toISOString(), eligibility_summary: record.opportunity.eligibilitySummary, application_url: record.opportunity.applicationUrl, source_url: record.opportunity.sourceUrl, source_updated_at: record.opportunity.sourceUpdatedAt, verified_at: record.opportunity.verifiedAt.toISOString(), status: "active", updated_at: now }, { onConflict: "source_id,external_id" }).select("id, title, verified_at").single();
  check(error);
  return { id: (data as any).id, title: (data as any).title, verifiedAt: new Date((data as any).verified_at) };
}
export async function refreshCuratedOpportunityCatalog() {
  const [nasa, bnl, drafts] = await Promise.all([refreshNasaSpaceAppsOpportunity(), refreshBnlHighSchoolResearchOpportunity(), fetchCuratedOpportunityDrafts()]);
  const admin = serviceClient();
  const verifiedAt = new Date().toISOString();
  const sources = [{ slug: "hack-club", name: "Hack Club High School Hackathons", source_url: "https://hackathons.hackclub.com/", source_type: "curated_directory", verification_note: "Popular high-school hackathons gathered from the Hack Club public directory. Confirm participation details with each organizer.", last_verified_at: verifiedAt, active: true, updated_at: verifiedAt }, { slug: "pathways-to-science", name: "PathwaysToScience Summer Research", source_url: "https://www.pathwaystoscience.org/programs.aspx", source_type: "curated_directory", verification_note: "Research and internship programs gathered from the PathwaysToScience public summer-research directory. Confirm current program details with the listed source.", last_verified_at: verifiedAt, active: true, updated_at: verifiedAt }];
  const sourceIds = new Map<string, string>();
  for (const sourceRow of sources) { const { data, error } = await admin.from("opportunity_sources").upsert(sourceRow, { onConflict: "slug" }).select("id, slug").single(); check(error); sourceIds.set((data as any).slug, (data as any).id); }
  const rows = drafts.map(draft => ({ source_id: sourceIds.get(draft.sourceSlug)!, external_id: draft.externalId, title: draft.title, summary: draft.summary, category: draft.category, participation_mode: draft.participationMode, location_label: draft.locationLabel, source_date_label: draft.sourceDateLabel, career_domains: draft.careerDomains, country_codes: [], start_at: null, end_at: null, registration_opens_at: null, eligibility_summary: "This is a popular directory listing, not a personalized eligibility decision. Review the source and organizer page for current rules, dates, eligibility, and registration.", application_url: draft.applicationUrl, source_url: draft.sourceUrl, source_updated_at: null, verified_at: verifiedAt, status: "active", updated_at: verifiedAt }));
  if (rows.length < 100) throw new Error("The curated sources did not return the minimum catalog size.");
  const { error } = await admin.from("opportunities").upsert(rows, { onConflict: "source_id,external_id" }); check(error);
  return { nasa, bnl, imported: rows.length, categoryCounts: rows.reduce<Record<string, number>>((counts, row) => ({ ...counts, [row.category]: (counts[row.category] ?? 0) + 1 }), {}) };
}

export async function getCareerMatches(userId: string) {
  const { data, error } = await client().from("career_matches").select("*, careers(*)").eq("user_id", userId).order("rank"); check(error);
  return list(data as any[]).map(row => ({ id: row.id, rank: row.rank, matchScore: row.match_score, reasoning: row.reasoning, strengths: strings(row.strengths), missingSkills: strings(row.missing_skills), realityCheck: row.reality_check, nextSteps: strings(row.next_steps), generatedAt: new Date(row.generated_at), career: { id: row.careers.id, name: row.careers.name, description: row.careers.description, salaryRange: row.careers.salary_range ?? "Location-dependent", educationRequirements: row.careers.education_requirements ?? "Varies by pathway", requiredSkills: strings(row.careers.required_skills), dailyResponsibilities: strings(row.careers.daily_responsibilities), relatedCareers: strings(row.careers.related_careers) } }));
}
export async function replaceCareerMatches(userId: string, recommendations: CareerRecommendation[]) {
  validateCareerCatalogWrite(userId, recommendations);
  const stored = await syncSharedCareerCatalog(recommendations);
  const db = client();
  const remove = await db.from("career_matches").delete().eq("user_id", userId); check(remove.error);
  const insert = await db.from("career_matches").insert(stored.map(({ careerId, recommendation }, index) => ({ user_id: userId, career_id: careerId, rank: index + 1, match_score: Math.round(recommendation.matchScore), reasoning: recommendation.reasoning, strengths: recommendation.strengths, missing_skills: recommendation.missingSkills, reality_check: recommendation.realityCheck, next_steps: recommendation.nextSteps }))); check(insert.error);
  return getCareerMatches(userId);
}

export async function listGoals(userId: string) { const { data, error } = await client().from("goals").select("*").eq("user_id", userId).order("deadline", { nullsFirst: false }); check(error); return list(data as any[]).map(goal); }
export async function createGoal(userId: string, value: { title: string; description?: string; category: string; deadline?: Date; priority: "low" | "medium" | "high"; estimatedHours: number; resources?: ResourceLink[] }) { const { data, error } = await client().from("goals").insert({ user_id: userId, title: value.title, description: value.description ?? null, category: value.category, deadline: iso(value.deadline), priority: value.priority, estimated_hours: value.estimatedHours, resources: value.resources ?? [] }).select().single(); check(error); const saved = goal(data); if (saved) { const activity = goalActivity({ category: value.category, estimatedHours: value.estimatedHours, deadline: value.deadline }); await recordPlanningActivity(userId, activity.eventType, "goal", saved.id, activity.metadata); } return saved; }
export async function updateGoal(userId: string, goalId: string, update: { progress?: number; status?: GoalStatus; priority?: "low" | "medium" | "high"; title?: string; description?: string; deadline?: Date | null; resources?: ResourceLink[] }) { const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }; if (update.progress !== undefined) patch.progress = update.progress; if (update.status !== undefined) patch.status = update.status; if (update.priority !== undefined) patch.priority = update.priority; if (update.title !== undefined) patch.title = update.title; if (update.description !== undefined) patch.description = update.description; if (update.deadline !== undefined) patch.deadline = iso(update.deadline ?? undefined); if (update.resources !== undefined) patch.resources = update.resources; const { data, error } = await client().from("goals").update(patch).eq("id", goalId).eq("user_id", userId).select().maybeSingle(); check(error); if (!data) throw new Error("Goal not found."); const saved = goal(data)!; const fields = [update.title !== undefined && "title", update.description !== undefined && "description", update.priority !== undefined && "priority", update.deadline !== undefined && "deadline", update.resources !== undefined && "resources"].filter(Boolean) as string[]; const activity = goalActivity({ category: saved.category, estimatedHours: saved.estimatedHours, progress: update.progress, fields }); await recordPlanningActivity(userId, activity.eventType, "goal", saved.id, activity.metadata); return saved; }

export async function getActiveRoadmap(userId: string) { const { data: roadmap, error } = await client().from("roadmaps").select("*").eq("user_id", userId).eq("status", "active").order("updated_at", { ascending: false }).limit(1).maybeSingle(); check(error); if (!roadmap) return undefined; const { data: milestones, error: milestoneError } = await client().from("roadmap_milestones").select("*").eq("roadmap_id", (roadmap as any).id).order("year").order("sort_order"); check(milestoneError); return { id: (roadmap as any).id, userId: (roadmap as any).user_id, targetCareer: (roadmap as any).target_career, completionPercentage: (roadmap as any).completion_percentage, status: (roadmap as any).status, createdAt: new Date((roadmap as any).created_at), updatedAt: new Date((roadmap as any).updated_at), milestones: list(milestones as any[]).map(milestone) }; }
export async function createRoadmap(userId: string, targetCareer: string, items: RoadmapMilestoneInput[]) { const db = client(); const archive = await db.from("roadmaps").update({ status: "archived", updated_at: new Date().toISOString() }).eq("user_id", userId).eq("status", "active"); check(archive.error); const { data, error } = await db.from("roadmaps").insert({ user_id: userId, target_career: targetCareer }).select().single(); check(error); const inserted = await db.from("roadmap_milestones").insert(items.map(item => ({ roadmap_id: (data as any).id, year: item.year, title: item.title, description: item.description ?? null, category: item.category, deadline: iso(item.deadline), priority: item.priority, estimated_hours: item.estimatedHours, resources: item.resources, progress: item.progress ?? 0, status: item.status ?? "not_started", sort_order: item.sortOrder }))); check(inserted.error); return getActiveRoadmap(userId); }
export async function updateMilestoneProgress(userId: string, milestoneId: string, progress: number) { const db = client(); const { data: item, error } = await db.from("roadmap_milestones").select("*, roadmaps!inner(user_id)").eq("id", milestoneId).eq("roadmaps.user_id", userId).maybeSingle(); check(error); if (!item) throw new Error("Roadmap milestone not found."); const normalized = Math.max(0, Math.min(100, Math.round(progress))); const saved = await db.from("roadmap_milestones").update({ progress: normalized, status: normalized === 100 ? "completed" : normalized > 0 ? "in_progress" : "not_started" }).eq("id", milestoneId); check(saved.error); const { data: all, error: allError } = await db.from("roadmap_milestones").select("progress").eq("roadmap_id", (item as any).roadmap_id); check(allError); const entries = list(all as any[]); const completion = entries.length ? Math.round(entries.reduce((total, entry) => total + Number(entry.progress), 0) / entries.length) : 0; const update = await db.from("roadmaps").update({ completion_percentage: completion, updated_at: new Date().toISOString() }).eq("id", (item as any).roadmap_id).eq("user_id", userId); check(update.error); const activity = roadmapMilestoneActivity(normalized); await recordPlanningActivity(userId, activity.eventType, "roadmap_milestone", milestoneId, activity.metadata); return getActiveRoadmap(userId); }

export async function createSimulation(userId: string, value: { career: string; title: string; scenarios: unknown[] }) {
  const { data, error } = await client().from("simulations").insert({ user_id: userId, career: value.career, title: value.title, scenarios: value.scenarios, user_choices: [] }).select().single();
  check(error);
  const persisted = simulation(data);
  if (!persisted) throw new Error("Simulation could not be created.");
  return persisted;
}
export async function getSimulation(userId: string, simulationId: string) { const { data, error } = await client().from("simulations").select("*").eq("id", simulationId).eq("user_id", userId).maybeSingle(); check(error); return simulation(data); }
export async function completeSimulation(userId: string, simulationId: string, value: { userChoices: { scenarioId: string; choiceId: string }[]; technicalScore: number; leadershipScore: number; careerCompatibilityScore: number; score: number; feedback: string }) { const { error } = await client().from("simulations").update({ user_choices: value.userChoices, technical_score: value.technicalScore, leadership_score: value.leadershipScore, career_compatibility_score: value.careerCompatibilityScore, score: value.score, feedback: value.feedback, status: "completed", completed_at: new Date().toISOString() }).eq("id", simulationId).eq("user_id", userId); check(error); return getSimulation(userId, simulationId); }

export async function createAdaptiveSimulation(userId: string, career: string, responseTimingOptIn = false) {
  const graph = getSimulationGraph(career); const state = initialSimulationState(graph);
  const { data, error } = await client().from("simulations").insert({ user_id: userId, career, title: graph.title, scenarios: [], user_choices: [], engine_version: "adaptive-v2", scenario_graph_id: graph.id, current_node_id: state.currentNodeId, node_history: [], decision_history: [], simulation_state: state, behavioral_evidence: [], behavioral_events: [], response_timing_opt_in: responseTimingOptIn, response_timing_events: [] }).select().single();
  check(error); const saved = simulation(data); if (!saved) throw new Error("Simulation could not be created."); return saved;
}
export async function getAdaptiveSimulation(userId: string, simulationId: string) { const { data, error } = await client().from("simulations").select("*").eq("id", simulationId).eq("user_id", userId).eq("engine_version", "adaptive-v2").maybeSingle(); check(error); return simulation(data); }
export async function getResumableAdaptiveSimulation(userId: string) { const { data, error } = await client().from("simulations").select("*").eq("user_id", userId).eq("engine_version", "adaptive-v2").eq("status", "in_progress").order("updated_at", { ascending: false }).limit(1).maybeSingle(); check(error); return simulation(data); }
export async function getLatestCompletedAdaptiveSimulation(userId: string) { const { data, error } = await client().from("simulations").select("*").eq("user_id", userId).eq("engine_version", "adaptive-v2").eq("status", "completed").order("completed_at", { ascending: false }).limit(1).maybeSingle(); check(error); return simulation(data); }
export type SimulationResponseTimingEvent = { nodeId: string; decisionId: string; responseMs: number; scenarioPressureLabel: "time_sensitive" | "standard" };
export async function setSimulationTimingOptIn(userId: string, simulationId: string, optIn: boolean) {
  const { data, error } = await client().from("simulations").update({ response_timing_opt_in: optIn, updated_at: new Date().toISOString() }).eq("id", simulationId).eq("user_id", userId).eq("engine_version", "adaptive-v2").select("id, response_timing_opt_in").maybeSingle();
  check(error); if (!data) throw new Error("Simulation not found."); return { id: (data as any).id as string, responseTimingOptIn: Boolean((data as any).response_timing_opt_in) };
}
export async function recordSimulationTimingEvent(userId: string, simulationId: string, event: SimulationResponseTimingEvent) {
  const current = await getAdaptiveSimulation(userId, simulationId);
  if (!current || !current.responseTimingOptIn) return { recorded: false };
  const timingEvent: SimulationResponseTimingEvent = { nodeId: event.nodeId.slice(0, 80), decisionId: event.decisionId.slice(0, 80), responseMs: Math.max(0, Math.min(1_800_000, Math.round(event.responseMs))), scenarioPressureLabel: event.scenarioPressureLabel };
  const responseTimingEvents = [...current.responseTimingEvents.slice(-11), timingEvent];
  const { data, error } = await client().from("simulations").update({ response_timing_events: responseTimingEvents, updated_at: new Date().toISOString() }).eq("id", simulationId).eq("user_id", userId).eq("engine_version", "adaptive-v2").eq("response_timing_opt_in", true).select("id").maybeSingle();
  check(error); return { recorded: Boolean(data) };
}
export async function getBehaviorEvolution(userId: string) {
  const { data, error } = await client().from("simulations").select("*").eq("user_id", userId).eq("engine_version", "adaptive-v2").eq("status", "completed").order("completed_at", { ascending: false }).limit(5);
  check(error);
  return buildBehaviorEvolution(list(data as any[]).map(simulation).filter(Boolean) as any[]);
}
export function getAdaptivePublicScenario(value: NonNullable<Awaited<ReturnType<typeof getAdaptiveSimulation>>>) { if (!value.simulationState || !value.scenarioGraphId) throw new Error("Adaptive simulation state is unavailable."); const state = value.simulationState as SimulationState; const graph = getSimulationGraphById(value.scenarioGraphId) ?? getSimulationGraph(value.career); return { ...getPublicScenario(graph, state), hasTimePressure: hasTimePressurePresentation(state) }; }
export async function chooseAdaptiveSimulationDecision(userId: string, simulationId: string, decisionId: string, responseTimeMs?: number) {
  const current = await getAdaptiveSimulation(userId, simulationId); if (!current) throw new Error("Simulation not found."); if (current.status !== "in_progress") throw new Error("Simulation is already complete."); if (!current.simulationState) throw new Error("Adaptive simulation state is unavailable.");
  const graph = getSimulationGraphById(current.scenarioGraphId) ?? getSimulationGraph(current.career);
  const transition = chooseSimulationDecision(graph, current.simulationState as SimulationState, decisionId, current.behavioralEvidence as BehavioralEvidence[], current.decisionHistory as DecisionRecord[], current.behavioralEvents as any[]);
  const patch: Record<string, unknown> = { current_node_id: transition.state.currentNodeId, node_history: transition.state.previousNodeIds, decision_history: transition.history, simulation_state: transition.state, behavioral_evidence: transition.evidence, behavioral_events: transition.events, user_choices: transition.history.map(item => ({ scenarioId: item.nodeId, choiceId: item.decisionId })), updated_at: new Date().toISOString() };
  if (transition.completed) {
    const matches = await getCareerMatches(userId); const results = buildAdaptiveResults(transition.evidence, matches.map(match => ({ name: match.career.name, matchScore: match.matchScore })));
    const trait = (name: string) => results.behavioralProfile.traits.find(item => item.trait === name)?.score ?? 50;
    patch.status = "completed"; patch.completed_at = new Date().toISOString(); patch.behavioral_profile = results.behavioralProfile; patch.compatibility_results = results.compatibility; patch.result_summary = results.summary; patch.feedback = results.summary; patch.technical_score = Math.round((trait("analytical_thinking") + trait("problem_solving") + trait("systems_thinking") + trait("attention_to_detail")) / 4); patch.leadership_score = Math.round((trait("collaboration") + trait("communication") + trait("ownership")) / 3); patch.career_compatibility_score = results.compatibility[0]?.score ?? 0; patch.score = Math.round(((patch.technical_score as number) + (patch.leadership_score as number) + (patch.career_compatibility_score as number)) / 3);
  }
  const { data, error } = await client().from("simulations").update(patch).eq("id", simulationId).eq("user_id", userId).select().maybeSingle(); check(error); if (!data) throw new Error("Simulation not found."); const saved = simulation(data)!;
  if (current.responseTimingOptIn && typeof responseTimeMs === "number") { const state = current.simulationState as SimulationState; void recordSimulationTimingEvent(userId, simulationId, { nodeId: current.currentNodeId, decisionId, responseMs: responseTimeMs, scenarioPressureLabel: hasTimePressurePresentation(state) ? "time_sensitive" : "standard" }).catch(error => console.warn("[PathPilot] optional response time was not recorded", error)); }
  return saved;
}

export async function getOrCreateMentorConversation(userId: string) { const db = client(); const { data: existing, error } = await db.from("ai_conversations").select("*").eq("user_id", userId).order("updated_at", { ascending: false }).limit(1).maybeSingle(); check(error); if (existing) return existing as any; const { data, error: insertError } = await db.from("ai_conversations").insert({ user_id: userId, title: "Career mentor", context: {} }).select().single(); check(insertError); return data as any; }
export async function getConversationMessages(userId: string, conversationId: string) { const { data, error } = await client().from("ai_messages").select("*").eq("conversation_id", conversationId).eq("user_id", userId).order("created_at"); check(error); return list(data as any[]).map(row => ({ id: row.id, conversationId: row.conversation_id, userId: row.user_id, role: row.role as "user" | "assistant", content: row.content, createdAt: new Date(row.created_at) })); }
export async function addMentorMessage(userId: string, conversationId: string, role: "user" | "assistant", content: string) { const db = client(); const message = await db.from("ai_messages").insert({ user_id: userId, conversation_id: conversationId, role, content }); check(message.error); const conversation = await db.from("ai_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId).eq("user_id", userId); check(conversation.error); }
type ProjectStatus = "idea" | "in_progress" | "completed" | "archived";
type ProjectMilestoneStatus = "not_started" | "in_progress" | "completed";
type ProjectWorkspaceMilestoneInput = { title: string; details?: string | null; status?: ProjectMilestoneStatus; progress?: number; targetDate?: string | null; sortOrder?: number };
type ProjectWorkspaceUpdate = { name?: string; description?: string; scopeStatement?: string | null; projectNotes?: string | null; skills?: string[]; status?: ProjectStatus; progress?: number; githubLink?: string | null; liveUrl?: string | null; startDate?: string | null; completionDate?: string | null };

function projectWorkspaceMilestone(row: any) { return { id: row.id, projectId: row.project_id, userId: row.user_id, title: row.title, details: row.details ?? null, status: row.status as ProjectMilestoneStatus, progress: Number(row.progress ?? 0), targetDate: row.target_date ?? null, sortOrder: Number(row.sort_order ?? 0), createdAt: new Date(row.created_at), updatedAt: new Date(row.updated_at) }; }
function project(row: any) { return { id: row.id, userId: row.user_id, name: row.name, description: row.description, scopeStatement: row.scope_statement ?? null, projectNotes: row.project_notes ?? null, skills: strings(row.skills), githubLink: row.github_link, liveUrl: row.live_url, status: row.status as ProjectStatus, progress: Number(row.progress ?? 0), startDate: row.start_date, completionDate: row.completion_date, careerId: row.career_id, roadmapMilestoneId: row.roadmap_milestone_id ?? null, goalIds: list(row.project_goals).map((link: any) => link.goal_id), milestones: list(row.project_milestones).map(projectWorkspaceMilestone).sort((left, right) => left.sortOrder - right.sortOrder || left.createdAt.getTime() - right.createdAt.getTime()), createdAt: new Date(row.created_at), updatedAt: new Date(row.updated_at) }; }
export async function listProjects(userId: string) { const { data, error } = await client().from("projects").select("*, project_goals(goal_id), project_milestones(*)").eq("user_id", userId).order("updated_at", { ascending: false }); check(error); return list(data as any[]).map(project); }
export async function getProjectWorkspace(userId: string, projectId: string) { const { data, error } = await client().from("projects").select("*, project_goals(goal_id), project_milestones(*)").eq("id", projectId).eq("user_id", userId).maybeSingle(); check(error); return data ? project(data) : null; }
type PortfolioProfileInput = { handle: string; displayName: string; introduction?: string | null };
type PortfolioProjectInput = { title?: string; summary?: string; technologies?: string[]; repositoryUrl?: string | null; liveUrl?: string | null };
function portfolioProfile(row: any) { return { handle: row.handle as string, displayName: row.display_name as string, introduction: row.introduction ?? null, updatedAt: new Date(row.updated_at) }; }
function portfolioProject(row: any) { return { id: row.id as string, projectId: row.project_id as string, title: row.title as string, summary: row.summary as string, technologies: strings(row.technologies), repositoryUrl: row.repository_url ?? null, liveUrl: row.live_url ?? null, isPublished: Boolean(row.is_published), publishedAt: date(row.published_at), updatedAt: new Date(row.updated_at) }; }
function defaultPortfolioProfile(userId: string) { return { handle: `student-${userId.slice(0, 8)}`, display_name: "Student portfolio", introduction: null }; }
export async function getPortfolioWorkspace(userId: string) {
  const [profileResult, projectsResult] = await Promise.all([
    client().from("portfolio_profiles").select("handle, display_name, introduction, updated_at").eq("user_id", userId).maybeSingle(),
    client().from("portfolio_projects").select("*").eq("user_id", userId).order("updated_at", { ascending: false }),
  ]);
  check(profileResult.error); check(projectsResult.error);
  return { profile: profileResult.data ? portfolioProfile(profileResult.data) : null, projects: list(projectsResult.data as any[]).map(portfolioProject) };
}
export async function upsertPortfolioProfile(userId: string, value: PortfolioProfileInput) {
  const { data, error } = await client().from("portfolio_profiles").upsert({ user_id: userId, handle: value.handle, display_name: value.displayName, introduction: value.introduction ?? null, updated_at: new Date().toISOString() }, { onConflict: "user_id" }).select("handle, display_name, introduction, updated_at").single();
  check(error); return portfolioProfile(data);
}
export async function createPortfolioDraftFromProject(userId: string, projectId: string) {
  const source = await getProjectWorkspace(userId, projectId);
  if (!source) throw new Error("Project workspace not found.");
  const db = client();
  const { data: profile, error: profileError } = await db.from("portfolio_profiles").select("user_id").eq("user_id", userId).maybeSingle();
  check(profileError);
  if (!profile) { const created = await db.from("portfolio_profiles").insert({ user_id: userId, ...defaultPortfolioProfile(userId) }); check(created.error); }
  const { data: existing, error: existingError } = await db.from("portfolio_projects").select("*").eq("user_id", userId).eq("project_id", projectId).maybeSingle();
  check(existingError); if (existing) return portfolioProject(existing);
  const { data, error } = await db.from("portfolio_projects").insert({ user_id: userId, project_id: projectId, title: source.name, summary: source.description, technologies: source.skills, repository_url: source.githubLink, live_url: source.liveUrl }).select().single();
  check(error); return portfolioProject(data);
}
export async function updatePortfolioProject(userId: string, portfolioProjectId: string, value: PortfolioProjectInput) {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString(), is_published: false, published_at: null };
  if (value.title !== undefined) patch.title = value.title;
  if (value.summary !== undefined) patch.summary = value.summary;
  if (value.technologies !== undefined) patch.technologies = value.technologies;
  if (value.repositoryUrl !== undefined) patch.repository_url = value.repositoryUrl;
  if (value.liveUrl !== undefined) patch.live_url = value.liveUrl;
  const { data, error } = await client().from("portfolio_projects").update(patch).eq("id", portfolioProjectId).eq("user_id", userId).select().maybeSingle();
  check(error); if (!data) throw new Error("Portfolio project not found."); return portfolioProject(data);
}
export async function publishPortfolioProject(userId: string, portfolioProjectId: string) {
  const { data, error } = await client().from("portfolio_projects").update({ is_published: true, published_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", portfolioProjectId).eq("user_id", userId).select().maybeSingle();
  check(error); if (!data) throw new Error("Portfolio project not found."); return portfolioProject(data);
}
export async function unpublishPortfolioProject(userId: string, portfolioProjectId: string) {
  const { data, error } = await client().from("portfolio_projects").update({ is_published: false, published_at: null, updated_at: new Date().toISOString() }).eq("id", portfolioProjectId).eq("user_id", userId).select().maybeSingle();
  check(error); if (!data) throw new Error("Portfolio project not found."); return portfolioProject(data);
}
export async function getPublicPortfolio(handle: string) {
  const db = client(); const { data: profile, error: profileError } = await db.from("portfolio_profiles").select("user_id, handle, display_name, introduction, updated_at").eq("handle", handle).maybeSingle();
  check(profileError); if (!profile) return null;
  const { data: entries, error: entryError } = await db.from("portfolio_projects").select("id, project_id, title, summary, technologies, repository_url, live_url, is_published, published_at, updated_at").eq("user_id", (profile as any).user_id).eq("is_published", true).order("published_at", { ascending: false });
  check(entryError); const projects = list(entries as any[]).map(portfolioProject); return projects.length ? { profile: portfolioProfile(profile), projects } : null;
}
export async function getPlanningReview(userId: string) { const [goals, projects, roadmap, activity] = await Promise.all([listGoals(userId), listProjects(userId), getActiveRoadmap(userId), listPlanningActivity(userId)]); return buildPlanningReview({ goals, projects, roadmap, visibleActivityCount: activity.length }); }
export async function getCrossProductEvidenceSummary(userId: string) {
  const [simulations, activity] = await Promise.all([
    client().from("simulations").select("id").eq("user_id", userId).eq("engine_version", "adaptive-v2").eq("status", "completed").limit(5),
    client().from("behavioral_activity_events").select("id").eq("user_id", userId).limit(12),
  ]);
  check(simulations.error); check(activity.error);
  return buildCrossProductEvidenceSummary({ completedSimulationCount: list(simulations.data as any[]).length, planningActivityCount: list(activity.data as any[]).length });
}
export async function createPlanningReportShareLink(userId: string) {
  const token = createPlanningReportShareToken();
  const expiresAt = planningReportShareExpiresAt();
  const { data, error } = await client().from("planning_report_share_links").insert({ user_id: userId, token_hash: hashPlanningReportShareToken(token), expires_at: expiresAt.toISOString() }).select("id, expires_at").single();
  check(error);
  return { id: (data as any).id as string, token, expiresAt: new Date((data as any).expires_at) };
}
export async function listPlanningReportShareLinks(userId: string) {
  const { data, error } = await client().from("planning_report_share_links").select("id, expires_at, revoked_at, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(20);
  check(error);
  return list(data as any[]).map(row => ({ id: row.id as string, expiresAt: new Date(row.expires_at), revokedAt: date(row.revoked_at), createdAt: new Date(row.created_at) }));
}
export async function revokePlanningReportShareLink(userId: string, shareId: string) {
  const { data, error } = await client().from("planning_report_share_links").update({ revoked_at: new Date().toISOString() }).eq("id", shareId).eq("user_id", userId).select("id").maybeSingle();
  check(error);
  if (!data) throw new Error("Report link not found.");
  return { id: (data as any).id as string, revoked: true };
}
async function getPrivilegedPlanningReview(userId: string) {
  const admin = serviceClient();
  const [goalsResult, projectsResult, roadmapResult, activityResult] = await Promise.all([
    admin.from("goals").select("progress, status").eq("user_id", userId),
    admin.from("projects").select("progress, status").eq("user_id", userId),
    admin.from("roadmaps").select("id, completion_percentage").eq("user_id", userId).eq("status", "active").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    admin.from("behavioral_activity_events").select("id").eq("user_id", userId).order("created_at", { ascending: false }).limit(12),
  ]);
  check(goalsResult.error); check(projectsResult.error); check(roadmapResult.error); check(activityResult.error);
  let roadmap: { completionPercentage: number; milestones: Array<{ progress: number }> } | undefined;
  if (roadmapResult.data) {
    const { data: milestones, error: milestoneError } = await admin.from("roadmap_milestones").select("progress").eq("roadmap_id", (roadmapResult.data as any).id);
    check(milestoneError);
    roadmap = { completionPercentage: Number((roadmapResult.data as any).completion_percentage), milestones: list(milestones as any[]).map(item => ({ progress: Number(item.progress) })) };
  }
  return buildPlanningReview({ goals: list(goalsResult.data as any[]), projects: list(projectsResult.data as any[]), roadmap, visibleActivityCount: list(activityResult.data as any[]).length });
}
export async function getSharedPlanningReport(token: string) {
  if (!isPlanningReportShareToken(token)) return null;
  const admin = serviceClient();
  const { data, error } = await admin.from("planning_report_share_links").select("user_id, expires_at, revoked_at").eq("token_hash", hashPlanningReportShareToken(token)).maybeSingle();
  check(error);
  if (!data || (data as any).revoked_at || new Date((data as any).expires_at).getTime() <= Date.now()) return null;
  return toSharedPlanningReport(await getPrivilegedPlanningReview((data as any).user_id as string));
}
export async function createProject(userId: string, value: { name: string; description: string; scopeStatement?: string | null; projectNotes?: string | null; skills: string[]; githubLink?: string; liveUrl?: string; status: ProjectStatus; progress: number; startDate?: string; completionDate?: string; careerId?: string; roadmapMilestoneId?: string; goalIds?: string[] }) { const db = client(); const { data, error } = await db.from("projects").insert({ user_id: userId, name: value.name, description: value.description, scope_statement: value.scopeStatement ?? null, project_notes: value.projectNotes ?? null, skills: value.skills, github_link: value.githubLink ?? null, live_url: value.liveUrl ?? null, status: value.status, progress: value.progress, start_date: value.startDate ?? null, completion_date: value.completionDate ?? null, career_id: value.careerId ?? null, roadmap_milestone_id: value.roadmapMilestoneId ?? null }).select().single(); check(error); if (value.goalIds?.length) { const linked = await db.from("project_goals").insert(value.goalIds.map(goalId => ({ project_id: (data as any).id, goal_id: goalId }))); check(linked.error); } const activity = projectActivity({ status: value.status, progress: value.progress, hasRoadmapMilestone: Boolean(value.roadmapMilestoneId) }); await recordPlanningActivity(userId, activity.eventType, "project", (data as any).id, activity.metadata); return (await listProjects(userId)).find(project => project.id === (data as any).id); }
export async function createProjectFromRoadmapMilestone(userId: string, milestoneId: string) {
  const db = client();
  const { data: milestone, error: milestoneError } = await db.from("roadmap_milestones").select("*, roadmaps!inner(user_id, target_career)").eq("id", milestoneId).eq("roadmaps.user_id", userId).maybeSingle();
  check(milestoneError);
  if (!milestone) throw new Error("Roadmap milestone not found.");
  if ((milestone as any).category !== "project") throw new Error("Only project milestones can start a project workspace.");
  const { data: existing, error: existingError } = await db.from("projects").select("id").eq("user_id", userId).eq("roadmap_milestone_id", milestoneId).maybeSingle();
  check(existingError);
  if (existing) return { projectId: (existing as any).id, created: false };
  const roadmap = Array.isArray((milestone as any).roadmaps) ? (milestone as any).roadmaps[0] : (milestone as any).roadmaps;
  const description = (milestone as any).description ?? `A project action from the ${roadmap?.target_career ?? "current"} roadmap.`;
  const created = await createProject(userId, { name: (milestone as any).title, description, skills: [], status: "in_progress", progress: 0, roadmapMilestoneId: milestoneId });
  if (!created) throw new Error("Project workspace could not be created.");
  return { projectId: created.id, created: true };
}
export async function updateProject(userId: string, projectId: string, value: ProjectWorkspaceUpdate) {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (value.name !== undefined) patch.name = value.name;
  if (value.description !== undefined) patch.description = value.description;
  if (value.scopeStatement !== undefined) patch.scope_statement = value.scopeStatement;
  if (value.projectNotes !== undefined) patch.project_notes = value.projectNotes;
  if (value.skills !== undefined) patch.skills = value.skills;
  if (value.status !== undefined) patch.status = value.status;
  if (value.progress !== undefined) patch.progress = value.progress;
  if (value.liveUrl !== undefined) patch.live_url = value.liveUrl;
  if (value.githubLink !== undefined) patch.github_link = value.githubLink;
  if (value.startDate !== undefined) patch.start_date = value.startDate;
  if (value.completionDate !== undefined) patch.completion_date = value.completionDate;
  const { data, error } = await client().from("projects").update(patch).eq("id", projectId).eq("user_id", userId).select().maybeSingle();
  check(error); if (!data) throw new Error("Project not found.");
  if (value.progress !== undefined || value.status === "completed") { const activity = projectActivity({ progress: value.progress, status: value.status }); await recordPlanningActivity(userId, activity.eventType, "project", projectId, activity.metadata); }
  return project(data);
}
async function requireOwnedProject(userId: string, projectId: string) { const { data, error } = await client().from("projects").select("id").eq("id", projectId).eq("user_id", userId).maybeSingle(); check(error); if (!data) throw new Error("Project not found."); }
export async function createProjectWorkspaceMilestone(userId: string, projectId: string, value: ProjectWorkspaceMilestoneInput) {
  await requireOwnedProject(userId, projectId); const db = client();
  const { data, error } = await db.from("project_milestones").insert({ project_id: projectId, user_id: userId, title: value.title, details: value.details ?? null, status: value.status ?? "not_started", progress: value.progress ?? 0, target_date: value.targetDate ?? null, sort_order: value.sortOrder ?? 0 }).select().single();
  check(error); return projectWorkspaceMilestone(data);
}
export async function updateProjectWorkspaceMilestone(userId: string, projectId: string, milestoneId: string, value: Partial<ProjectWorkspaceMilestoneInput>) {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (value.title !== undefined) patch.title = value.title;
  if (value.details !== undefined) patch.details = value.details;
  if (value.targetDate !== undefined) patch.target_date = value.targetDate;
  if (value.sortOrder !== undefined) patch.sort_order = value.sortOrder;
  if (value.status !== undefined) patch.status = value.status;
  if (value.progress !== undefined) patch.progress = value.progress;
  if (value.status === "completed" && value.progress === undefined) patch.progress = 100;
  const { data, error } = await client().from("project_milestones").update(patch).eq("id", milestoneId).eq("project_id", projectId).eq("user_id", userId).select().maybeSingle();
  check(error); if (!data) throw new Error("Project milestone not found."); return projectWorkspaceMilestone(data);
}
export async function deleteProjectWorkspaceMilestone(userId: string, projectId: string, milestoneId: string) { const { data, error } = await client().from("project_milestones").delete().eq("id", milestoneId).eq("project_id", projectId).eq("user_id", userId).select("id").maybeSingle(); check(error); if (!data) throw new Error("Project milestone not found."); return { id: (data as any).id as string, deleted: true }; }
export async function getDashboardData(userId: string) { const [profileValue, matches, goals, roadmap, projects, recentSimulation, savedOpportunity] = await Promise.all([getStudentProfile(userId), getCareerMatches(userId), listGoals(userId), getActiveRoadmap(userId), listProjects(userId), getLatestCompletedAdaptiveSimulation(userId), getLatestSavedOpportunity(userId)]); const activeGoals = goals.filter(item => item.status !== "completed" && item.status !== "paused"); const completedGoals = goals.filter(item => item.status === "completed").length; const simulationSignal = recentSimulation ? Math.min(10, Math.round(recentSimulation.careerCompatibilityScore / 10)) : 0; const readiness = Math.round(Math.min(100, (roadmap?.completionPercentage ?? 0) * 0.45 + (goals.length ? (completedGoals / goals.length) * 20 : 0) + (matches[0]?.matchScore ?? 0) * 0.25 + simulationSignal)); const nextAction = buildDashboardNextAction({ matches, goals, roadmap, projects, savedOpportunity, hasCompletedSimulation: Boolean(recentSimulation) }); return { profile: profileValue, matches, goals, activeGoals, roadmap, projects, readiness, intelligence: { currentDirection: matches[0] ? { career: matches[0].career.name, matchScore: matches[0].matchScore } : null, nextAction }, recentSimulation: recentSimulation ? { id: recentSimulation.id, career: recentSimulation.career, resultSummary: recentSimulation.resultSummary, strongestTraits: recentSimulation.behavioralProfile?.strongestTraits ?? [], completedAt: recentSimulation.completedAt, compatibilityScore: recentSimulation.careerCompatibilityScore } : null }; }
