import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ client: null as any }));

vi.mock("../server/supabase", () => ({
  currentSupabaseClient: () => mocks.client,
  getSupabaseConfig: () => ({ url: "https://example.supabase.co" }),
}));

import { createGoalFromVerifiedOpportunity, listVerifiedOpportunities, setStudentOpportunityState, updateGoal } from "../server/db";

const userId = "11111111-1111-4111-8111-111111111111";
const opportunityId = "22222222-2222-4222-8222-222222222222";

function listQuery(data: unknown[]) {
  const chain = { select: vi.fn(), eq: vi.fn(), gte: vi.fn(), order: vi.fn(), limit: vi.fn() };
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.gte.mockReturnValue(chain);
  chain.order.mockReturnValue(chain);
  chain.limit.mockResolvedValue({ data, error: null });
  return chain;
}

describe("verified opportunity repository", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns source-attributed active opportunities and hides a student-dismissed record", async () => {
    const query = listQuery([
      { id: opportunityId, title: "Verified event", summary: "A source-attributed opportunity.", category: "competition", participation_mode: "hybrid", location_label: "Global", country_codes: [], start_at: "2026-11-14T00:00:00Z", end_at: "2026-11-15T23:59:59Z", registration_opens_at: null, eligibility_summary: "Review the official requirements.", application_url: "https://example.org/apply", source_url: "https://example.org", verified_at: "2026-08-16T00:00:00Z", opportunity_sources: { name: "Official organizer" }, student_opportunity_states: [] },
      { id: "33333333-3333-4333-8333-333333333333", title: "Dismissed event", summary: "A prior record.", category: "competition", participation_mode: "digital", location_label: "Online", country_codes: [], start_at: "2026-11-14T00:00:00Z", end_at: "2026-11-15T23:59:59Z", registration_opens_at: null, eligibility_summary: "Review the official requirements.", application_url: "https://example.org/apply", source_url: "https://example.org", verified_at: "2026-08-16T00:00:00Z", opportunity_sources: { name: "Official organizer" }, student_opportunity_states: [{ status: "dismissed" }] },
    ]);
    mocks.client = { from: vi.fn(() => query) };

    const result = await listVerifiedOpportunities(userId);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: opportunityId, sourceName: "Official organizer", savedStatus: null });
    expect(result[0].startAt).toBeInstanceOf(Date);
    expect(query.limit).toHaveBeenCalledWith(250);
  });

  it("checks availability then writes a status only under the authenticated student identity", async () => {
    const available = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() };
    available.select.mockReturnValue(available); available.eq.mockReturnValue(available); available.maybeSingle.mockResolvedValue({ data: { id: opportunityId }, error: null });
    const state = { upsert: vi.fn(), select: vi.fn(), single: vi.fn() };
    state.upsert.mockReturnValue(state); state.select.mockReturnValue(state); state.single.mockResolvedValue({ data: { opportunity_id: opportunityId, status: "saved" }, error: null });
    const activity = { insert: vi.fn().mockResolvedValue({ error: null }) };
    mocks.client = { from: vi.fn((table: string) => table === "opportunities" ? available : table === "student_opportunity_states" ? state : activity) };

    await expect(setStudentOpportunityState(userId, opportunityId, "saved")).resolves.toEqual({ opportunityId, status: "saved" });
    expect(state.upsert).toHaveBeenCalledWith(expect.objectContaining({ user_id: userId, opportunity_id: opportunityId, status: "saved" }), { onConflict: "user_id,opportunity_id" });
    expect(activity.insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: userId, event_type: "opportunity_saved", subject_type: "opportunity", subject_id: opportunityId, metadata: {} }));
  });

  it("creates one editable goal from a verified active opportunity without inferring a deadline", async () => {
    const verified = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() };
    verified.select.mockReturnValue(verified); verified.eq.mockReturnValue(verified); verified.maybeSingle.mockResolvedValue({ data: { id: opportunityId, title: "Verified research program", summary: "A source-attributed research opportunity.", eligibility_summary: "Confirm grade and location requirements.", application_url: "https://example.org/apply", source_url: "https://example.org", status: "active" }, error: null });
    const goalLookup = { select: vi.fn(), eq: vi.fn() };
    goalLookup.select.mockReturnValue(goalLookup); goalLookup.eq.mockResolvedValue({ data: [], error: null });
    const insert = { insert: vi.fn(), select: vi.fn(), single: vi.fn() };
    insert.insert.mockReturnValue(insert); insert.select.mockReturnValue(insert); insert.single.mockResolvedValue({ data: { id: "44444444-4444-4444-8444-444444444444", user_id: userId, title: "Prepare for Verified research program", description: "Created goal", category: "opportunity", deadline: null, priority: "medium", estimated_hours: 2, resources: [], progress: 0, status: "not_started", created_at: "2026-08-17T00:00:00Z", updated_at: "2026-08-17T00:00:00Z" }, error: null });
    const activity = { insert: vi.fn().mockResolvedValue({ error: null }) };
    let goalCalls = 0;
    mocks.client = { from: vi.fn((table: string) => table === "opportunities" ? verified : table === "goals" ? (++goalCalls === 1 ? goalLookup : insert) : activity) };

    await expect(createGoalFromVerifiedOpportunity(userId, opportunityId)).resolves.toEqual({ goalId: "44444444-4444-4444-8444-444444444444", created: true });
    expect(insert.insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: userId, deadline: null, category: "opportunity", resources: expect.arrayContaining([expect.objectContaining({ label: `PathPilot opportunity: ${opportunityId}` })]) }));
    expect(activity.insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: userId, event_type: "opportunity_goal_created", subject_type: "opportunity", subject_id: opportunityId, metadata: {} }));
  });

  it("returns an existing student-owned opportunity goal instead of creating a duplicate", async () => {
    const verified = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() };
    verified.select.mockReturnValue(verified); verified.eq.mockReturnValue(verified); verified.maybeSingle.mockResolvedValue({ data: { id: opportunityId, title: "Verified event", summary: "Summary", eligibility_summary: "Review source", application_url: "https://example.org/apply", source_url: "https://example.org", status: "active" }, error: null });
    const goalLookup = { select: vi.fn(), eq: vi.fn() };
    goalLookup.select.mockReturnValue(goalLookup); goalLookup.eq.mockResolvedValue({ data: [{ id: "55555555-5555-4555-8555-555555555555", resources: [{ label: `PathPilot opportunity: ${opportunityId}`, url: "https://example.org/apply" }] }], error: null });
    mocks.client = { from: vi.fn((table: string) => table === "opportunities" ? verified : goalLookup) };

    await expect(createGoalFromVerifiedOpportunity(userId, opportunityId)).resolves.toEqual({ goalId: "55555555-5555-4555-8555-555555555555", created: false });
  });

  it("lets the student edit an opportunity-created goal without inventing a deadline", async () => {
    const edited = { update: vi.fn(), eq: vi.fn(), select: vi.fn(), maybeSingle: vi.fn() };
    edited.update.mockReturnValue(edited); edited.eq.mockReturnValue(edited); edited.select.mockReturnValue(edited); edited.maybeSingle.mockResolvedValue({ data: { id: "66666666-6666-4666-8666-666666666666", user_id: userId, title: "Prepare application outline", description: "Student-adjusted plan", category: "opportunity", deadline: null, priority: "high", estimated_hours: 2, resources: [{ label: "Organizer source page", url: "https://example.org" }], progress: 0, status: "not_started", created_at: "2026-08-17T00:00:00Z", updated_at: "2026-08-17T00:00:00Z" }, error: null });
    const activity = { insert: vi.fn().mockResolvedValue({ error: null }) };
    mocks.client = { from: vi.fn((table: string) => table === "goals" ? edited : activity) };

    await expect(updateGoal(userId, "66666666-6666-4666-8666-666666666666", { title: "Prepare application outline", description: "Student-adjusted plan", priority: "high", deadline: null, resources: [{ label: "Organizer source page", url: "https://example.org" }] })).resolves.toMatchObject({ title: "Prepare application outline", deadline: null, priority: "high" });
    expect(edited.update).toHaveBeenCalledWith(expect.objectContaining({ title: "Prepare application outline", deadline: null, resources: [{ label: "Organizer source page", url: "https://example.org" }] }));
    expect(edited.eq).toHaveBeenCalledWith("user_id", userId);
    expect(activity.insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: userId, event_type: "goal_updated", subject_type: "goal", subject_id: "66666666-6666-4666-8666-666666666666", metadata: { fields: ["title", "description", "priority", "deadline", "resources"] } }));
  });
});
