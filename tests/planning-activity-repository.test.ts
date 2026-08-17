import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ client: null as any }));
vi.mock("../server/supabase", () => ({ currentSupabaseClient: () => mocks.client, getSupabaseConfig: () => ({ url: "https://example.supabase.co" }) }));

import { listPlanningActivity } from "../server/db";

describe("planning activity repository", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reads a bounded activity projection only for the authenticated student", async () => {
    const query = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn() };
    query.select.mockReturnValue(query); query.eq.mockReturnValue(query); query.order.mockReturnValue(query); query.limit.mockResolvedValue({ data: [{ id: "11111111-1111-4111-8111-111111111111", event_type: "goal_completed", subject_type: "goal", created_at: "2026-08-17T00:00:00Z", metadata: { ignored: true } }], error: null });
    mocks.client = { from: vi.fn(() => query) };

    const result = await listPlanningActivity("22222222-2222-4222-8222-222222222222");
    expect(query.select).toHaveBeenCalledWith("id, event_type, subject_type, created_at");
    expect(query.eq).toHaveBeenCalledWith("user_id", "22222222-2222-4222-8222-222222222222");
    expect(query.limit).toHaveBeenCalledWith(12);
    expect(result).toMatchObject([{ title: "Completed a goal", detail: "You marked a commitment complete." }]);
    expect(JSON.stringify(result)).not.toContain("ignored");
  });
});
