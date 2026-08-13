import { createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY!;
const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const suffix = crypto.randomUUID();
const password = `PathPilot-${suffix}-safe`;
const accountA = `pathpilot.rls.a.${suffix}@example.test`;
const accountB = `pathpilot.rls.b.${suffix}@example.test`;
let userA = "";
let userB = "";
let careerId = "";
let aClient: ReturnType<typeof createClient>;
let bClient: ReturnType<typeof createClient>;

async function signIn(email: string) {
  const client = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw error ?? new Error("Test user has no session.");
  return createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false }, global: { headers: { Authorization: `Bearer ${data.session.access_token}` } } });
}

describe("Supabase row-level security", () => {
  beforeAll(async () => {
    expect(serviceKey).toBeTruthy();
    const first = await admin.auth.admin.createUser({ email: accountA, password, email_confirm: true });
    const second = await admin.auth.admin.createUser({ email: accountB, password, email_confirm: true });
    if (first.error || second.error || !first.data.user || !second.data.user) throw first.error ?? second.error ?? new Error("Unable to create temporary test users.");
    userA = first.data.user.id; userB = second.data.user.id;
    aClient = await signIn(accountA); bClient = await signIn(accountB);

    const profile = await aClient.from("student_profiles").insert({ user_id: userA, grade: "Grade 11", location: "Test city", country_code: "US", education_system: "US high school and institution-specific admissions context", interests: ["Technology"], skills: ["Writing"], activities: ["Clubs"], career_preferences: ["Creating things"] });
    if (profile.error) throw profile.error;
    const onboardingDraft = await aClient.from("onboarding_drafts").insert({ user_id: userA, current_step: 3, payload: { grade: "Grade 11", location: "Test city" } });
    if (onboardingDraft.error) throw onboardingDraft.error;
    const career = await admin.from("careers").insert({ slug: `test-career-${suffix}`, name: "Private test career", description: "A temporary persistence test career." }).select("id").single();
    if (career.error) throw career.error;
    careerId = career.data.id;
    const match = await aClient.from("career_matches").insert({ user_id: userA, career_id: careerId, rank: 1, match_score: 91, reasoning: "Private match reasoning", strengths: ["Writing"], missing_skills: ["Research"], reality_check: "Private reality check", next_steps: ["Explore the work"] });
    if (match.error) throw match.error;
    const goal = await aClient.from("goals").insert({ user_id: userA, title: "Private test goal", category: "test", priority: "medium", estimated_hours: 1, resources: [] });
    if (goal.error) throw goal.error;
    const roadmap = await aClient.from("roadmaps").insert({ user_id: userA, target_career: "Private test career" }).select().single();
    if (roadmap.error) throw roadmap.error;
    const simulation = await aClient.from("simulations").insert({ user_id: userA, career: "Private test career", title: "Private test simulation", scenarios: [], user_choices: [], engine_version: "adaptive-v2", scenario_graph_id: "software-systems-v1", current_node_id: "debrief", node_history: ["model-alert", "data-audit"], decision_history: [{ nodeId: "model-alert", decisionId: "investigate-data" }], simulation_state: { currentNodeId: "debrief" }, behavioral_evidence: [{ trait: "analytical_thinking", direction: 1 }], behavioral_profile: { strongestTraits: ["analytical_thinking"] }, compatibility_results: [{ careerName: "Private test career", score: 91 }], result_summary: "Private observed simulation result.", status: "completed", completed_at: new Date().toISOString() }).select("id").single();
    if (simulation.error) throw simulation.error;
    const conversation = await aClient.from("ai_conversations").insert({ user_id: userA, title: "Private test conversation", context: {} }).select().single();
    if (conversation.error) throw conversation.error;
    const message = await aClient.from("ai_messages").insert({ user_id: userA, conversation_id: conversation.data.id, role: "user", content: "Private context" });
    if (message.error) throw message.error;
    const project = await aClient.from("projects").insert({ user_id: userA, name: "Private test project", description: "Private test description", skills: [], status: "idea", progress: 0 });
    if (project.error) throw project.error;
    const recommendation = await aClient.from("roadmap_recommendations").insert({ user_id: userA, source_simulation_id: simulation.data.id, roadmap_id: roadmap.data.id, target_career: "Private test career", country_snapshot: "US", education_system_snapshot: "US high school and institution-specific admissions context", phase: "Foundation", title: "Private test recommendation", description: "Private recommendation description", rationale: "Private recommendation rationale", category: "skill", priority: "medium", estimated_hours: 4, sort_order: 0 });
    if (recommendation.error) throw recommendation.error;
  }, 30_000);

  it("prevents User B from reading User A's profile, plans, work, and conversations", async () => {
    const checks = await Promise.all([
      bClient.from("student_profiles").select("id").eq("user_id", userA),
      bClient.from("goals").select("id").eq("user_id", userA),
      bClient.from("roadmaps").select("id").eq("user_id", userA),
      bClient.from("simulations").select("id").eq("user_id", userA),
      bClient.from("ai_conversations").select("id").eq("user_id", userA),
      bClient.from("ai_messages").select("id").eq("user_id", userA),
      bClient.from("projects").select("id").eq("user_id", userA),
      bClient.from("roadmap_recommendations").select("id").eq("user_id", userA),
    ]);
    for (const result of checks) { expect(result.error).toBeNull(); expect(result.data).toEqual([]); }
  });

  it("restores persisted student workspace records in a fresh authenticated session", async () => {
    const resumedClient = await signIn(accountA);
    const records = await Promise.all([
      resumedClient.from("student_profiles").select("grade, location, country_code, education_system").eq("user_id", userA).single(),
      resumedClient.from("onboarding_drafts").select("current_step, payload").eq("user_id", userA).single(),
      resumedClient.from("career_matches").select("rank, match_score, careers(name)").eq("user_id", userA).single(),
      resumedClient.from("goals").select("title").eq("user_id", userA).single(),
      resumedClient.from("roadmaps").select("target_career").eq("user_id", userA).single(),
      resumedClient.from("simulations").select("title, engine_version, current_node_id, decision_history, behavioral_profile, compatibility_results, result_summary").eq("user_id", userA).single(),
      resumedClient.from("ai_conversations").select("title").eq("user_id", userA).single(),
      resumedClient.from("ai_messages").select("content").eq("user_id", userA).single(),
      resumedClient.from("projects").select("name, description").eq("user_id", userA).single(),
      resumedClient.from("roadmap_recommendations").select("title, country_snapshot, status, source_simulation_id").eq("user_id", userA).single(),
    ]);
    for (const result of records) expect(result.error).toBeNull();
    expect(records[0].data).toMatchObject({ grade: "Grade 11", location: "Test city", country_code: "US", education_system: "US high school and institution-specific admissions context" });
    expect(records[1].data).toMatchObject({ current_step: 3, payload: { grade: "Grade 11", location: "Test city" } });
    expect(records[2].data).toMatchObject({ rank: 1, match_score: 91, careers: { name: "Private test career" } });
    expect(records[3].data).toMatchObject({ title: "Private test goal" });
    expect(records[4].data).toMatchObject({ target_career: "Private test career" });
    expect(records[5].data).toMatchObject({ title: "Private test simulation", engine_version: "adaptive-v2", current_node_id: "debrief", behavioral_profile: { strongestTraits: ["analytical_thinking"] }, compatibility_results: [{ careerName: "Private test career", score: 91 }], result_summary: "Private observed simulation result." });
    expect(records[6].data).toMatchObject({ title: "Private test conversation" });
    expect(records[7].data).toMatchObject({ content: "Private context" });
    expect(records[8].data).toMatchObject({ name: "Private test project", description: "Private test description" });
    expect(records[9].data).toMatchObject({ title: "Private test recommendation", country_snapshot: "US", status: "pending" });
  });

  afterAll(async () => {
    if (userA) await admin.auth.admin.deleteUser(userA);
    if (userB) await admin.auth.admin.deleteUser(userB);
    if (careerId) await admin.from("careers").delete().eq("id", careerId);
  });
});
