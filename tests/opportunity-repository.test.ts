import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ client: null as any }));

vi.mock("../server/supabase", () => ({
  currentSupabaseClient: () => mocks.client,
  getSupabaseConfig: () => ({ url: "https://example.supabase.co" }),
}));

import { listVerifiedOpportunities, setStudentOpportunityState } from "../server/db";

const userId = "11111111-1111-4111-8111-111111111111";
const opportunityId = "22222222-2222-4222-8222-222222222222";

function listQuery(data: unknown[]) {
  const chain = { select: vi.fn(), eq: vi.fn(), gte: vi.fn(), order: vi.fn() };
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.gte.mockReturnValue(chain);
  chain.order.mockResolvedValue({ data, error: null });
  return chain;
}

describe("verified opportunity repository", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns source-attributed active opportunities and hides a student-dismissed record", async () => {
    const query = listQuery([
      { id: opportunityId, title: "Verified event", summary: "A source-attributed opportunity.", category: "event", participation_mode: "hybrid", location_label: "Global", country_codes: [], start_at: "2026-11-14T00:00:00Z", end_at: "2026-11-15T23:59:59Z", registration_opens_at: null, eligibility_summary: "Review the official requirements.", application_url: "https://example.org/apply", source_url: "https://example.org", verified_at: "2026-08-16T00:00:00Z", opportunity_sources: { name: "Official organizer" }, student_opportunity_states: [] },
      { id: "33333333-3333-4333-8333-333333333333", title: "Dismissed event", summary: "A prior record.", category: "event", participation_mode: "digital", location_label: "Online", country_codes: [], start_at: "2026-11-14T00:00:00Z", end_at: "2026-11-15T23:59:59Z", registration_opens_at: null, eligibility_summary: "Review the official requirements.", application_url: "https://example.org/apply", source_url: "https://example.org", verified_at: "2026-08-16T00:00:00Z", opportunity_sources: { name: "Official organizer" }, student_opportunity_states: [{ status: "dismissed" }] },
    ]);
    mocks.client = { from: vi.fn(() => query) };

    const result = await listVerifiedOpportunities(userId);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: opportunityId, sourceName: "Official organizer", savedStatus: null });
    expect(result[0].startAt).toBeInstanceOf(Date);
    expect(query.gte).toHaveBeenCalledWith("end_at", expect.any(String));
  });

  it("checks availability then writes a status only under the authenticated student identity", async () => {
    const available = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() };
    available.select.mockReturnValue(available); available.eq.mockReturnValue(available); available.maybeSingle.mockResolvedValue({ data: { id: opportunityId }, error: null });
    const state = { upsert: vi.fn(), select: vi.fn(), single: vi.fn() };
    state.upsert.mockReturnValue(state); state.select.mockReturnValue(state); state.single.mockResolvedValue({ data: { opportunity_id: opportunityId, status: "saved" }, error: null });
    mocks.client = { from: vi.fn((table: string) => table === "opportunities" ? available : state) };

    await expect(setStudentOpportunityState(userId, opportunityId, "saved")).resolves.toEqual({ opportunityId, status: "saved" });
    expect(state.upsert).toHaveBeenCalledWith(expect.objectContaining({ user_id: userId, opportunity_id: opportunityId, status: "saved" }), { onConflict: "user_id,opportunity_id" });
  });
});
