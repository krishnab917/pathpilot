import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildCrossProductEvidenceSummary, crossProductEvidencePolicy } from "../server/cross-product-evidence-policy";

const mocks = vi.hoisted(() => ({ client: null as any }));
vi.mock("../server/supabase", () => ({ currentSupabaseClient: () => mocks.client, getSupabaseConfig: () => ({ url: "https://example.supabase.co" }) }));

import { getCrossProductEvidenceSummary } from "../server/db";

const userId = "11111111-1111-4111-8111-111111111111";

describe("cross-product evidence policy", () => {
  beforeEach(() => vi.clearAllMocks());

  it("derives only bounded availability indicators and discloses its prohibited sources", () => {
    const summary = buildCrossProductEvidenceSummary({ completedSimulationCount: 12, planningActivityCount: 40 });
    expect(summary.availability).toEqual({ completedSimulationCount: 5, planningActivityCount: 12, reflectionContextAvailable: true });
    expect(summary.policy).toBe(crossProductEvidencePolicy);
    expect(summary.policy.prohibitedSources.join(" ")).toContain("response-time metadata");
    expect(summary.policy.guardrails.join(" ")).toContain("no automatic recommendation");
    expect(summary).not.toHaveProperty("score");
    expect(summary).not.toHaveProperty("traits");
    expect(summary).not.toHaveProperty("decisionHistory");
  });

  it("reads only identifier counts under the authenticated owner scope", async () => {
    const simulations = { select: vi.fn(), eq: vi.fn(), limit: vi.fn() };
    simulations.select.mockReturnValue(simulations); simulations.eq.mockReturnValue(simulations); simulations.limit.mockResolvedValue({ data: [{ id: "s1" }, { id: "s2" }], error: null });
    const activity = { select: vi.fn(), eq: vi.fn(), limit: vi.fn() };
    activity.select.mockReturnValue(activity); activity.eq.mockReturnValue(activity); activity.limit.mockResolvedValue({ data: [{ id: "a1" }], error: null });
    mocks.client = { from: vi.fn((table: string) => table === "simulations" ? simulations : activity) };

    const summary = await getCrossProductEvidenceSummary(userId);
    expect(simulations.select).toHaveBeenCalledWith("id");
    expect(simulations.eq).toHaveBeenCalledWith("user_id", userId);
    expect(simulations.eq).toHaveBeenCalledWith("engine_version", "adaptive-v2");
    expect(simulations.eq).toHaveBeenCalledWith("status", "completed");
    expect(simulations.limit).toHaveBeenCalledWith(5);
    expect(activity.select).toHaveBeenCalledWith("id");
    expect(activity.eq).toHaveBeenCalledWith("user_id", userId);
    expect(activity.limit).toHaveBeenCalledWith(12);
    expect(summary.availability).toEqual({ completedSimulationCount: 2, planningActivityCount: 1, reflectionContextAvailable: true });
    expect(JSON.stringify(summary)).not.toContain("s1");
    expect(JSON.stringify(summary)).not.toContain("a1");
  });
});
