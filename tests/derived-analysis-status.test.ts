import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

const sourceRows = [{ id: "simulation-1", career: "Engineering", completed_at: "2026-08-18T00:00:00.000Z", updated_at: "2026-08-18T00:00:00.000Z", behavioral_profile: { traits: [{ trait: "analytical_thinking", score: 70 }] } }];
const expectedHash = createHash("sha256").update(JSON.stringify([{ id: "simulation-1", completedAt: sourceRows[0].completed_at, updatedAt: sourceRows[0].updated_at }])).digest("hex");
const mocks = vi.hoisted(() => ({ currentSupabaseClient: vi.fn() }));
vi.mock("../server/supabase", () => ({ currentSupabaseClient: mocks.currentSupabaseClient }));

import { getDerivedAnalysisStatus, processNextDerivedAnalysis } from "../server/derived-analysis";

function clientWithJob(sourceHash: string) {
  const jobResult = { maybeSingle: vi.fn().mockResolvedValue({ data: { id: "job-1", status: "completed", attempt_count: 1, requested_at: "2026-08-18T00:00:00.000Z", started_at: null, completed_at: "2026-08-18T00:01:00.000Z", cancelled_at: null, error_code: null, snapshot: { version: "simulation-evolution-v1", includedSimulationCount: 1 }, source_hash: sourceHash }, error: null }) };
  const jobLimit = { limit: vi.fn().mockReturnValue(jobResult) };
  const jobOrder = { order: vi.fn().mockReturnValue(jobLimit) };
  const jobSecondScope = { eq: vi.fn().mockReturnValue(jobOrder) };
  const jobFirstScope = { eq: vi.fn().mockReturnValue(jobSecondScope) };
  const simulationResult = { limit: vi.fn().mockResolvedValue({ data: sourceRows, error: null }) };
  const simulationOrder = { order: vi.fn().mockReturnValue(simulationResult) };
  const simulationThirdScope = { eq: vi.fn().mockReturnValue(simulationOrder) };
  const simulationSecondScope = { eq: vi.fn().mockReturnValue(simulationThirdScope) };
  const simulationFirstScope = { eq: vi.fn().mockReturnValue(simulationSecondScope) };
  return {
    from: vi.fn((table: string) => table === "derived_analysis_jobs" ? { select: vi.fn().mockReturnValue(jobFirstScope) } : { select: vi.fn().mockReturnValue(simulationFirstScope) })
  };
}

describe("derived analysis status", () => {
  it("marks a completed snapshot stale when bounded simulation source data changes and excludes raw source fields", async () => {
    mocks.currentSupabaseClient.mockReturnValue(clientWithJob("a".repeat(64)));
    const status = await getDerivedAnalysisStatus("student-1");
    expect(status.job).toMatchObject({ id: "job-1", status: "completed", isCurrent: false });
    expect(JSON.stringify(status)).not.toContain("behavioral_profile");
  });

  it("marks a matching minimized snapshot current and rejects malformed worker tokens before any database call", async () => {
    mocks.currentSupabaseClient.mockReturnValue(clientWithJob(expectedHash));
    const status = await getDerivedAnalysisStatus("student-1");
    expect(status.job).toMatchObject({ isCurrent: true });
    await expect(processNextDerivedAnalysis("not-a-valid-token")).resolves.toEqual({ authorized: false });
  });
});
