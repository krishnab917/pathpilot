import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  client: null as any,
  getStudentProfile: vi.fn(), getLatestCompletedAdaptiveSimulation: vi.fn(), getBehaviorEvolution: vi.fn(),
  listGoals: vi.fn(), listProjects: vi.fn(), getActiveRoadmap: vi.fn(), createGoal: vi.fn(), createRoadmap: vi.fn(),
}));
vi.mock("../server/supabase", () => ({ currentSupabaseClient: () => mocks.client }));
vi.mock("../server/db", () => ({
  getStudentProfile: mocks.getStudentProfile, getLatestCompletedAdaptiveSimulation: mocks.getLatestCompletedAdaptiveSimulation,
  getBehaviorEvolution: mocks.getBehaviorEvolution, listGoals: mocks.listGoals, listProjects: mocks.listProjects,
  getActiveRoadmap: mocks.getActiveRoadmap, createGoal: mocks.createGoal, createRoadmap: mocks.createRoadmap,
}));

import { generateRoadmapRecommendations } from "../server/roadmap/recommendation-repository";

const userId = "11111111-1111-4111-8111-111111111111";

describe("recommendation evolution persistence boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getStudentProfile.mockResolvedValue({ countryCode: "US", grade: "Grade 10", skills: [], activities: [] });
    mocks.getLatestCompletedAdaptiveSimulation.mockResolvedValue({ id: "sim-1", career: "Software Engineer", behavioralProfile: { strongestTraits: [] } });
    mocks.getBehaviorEvolution.mockResolvedValue(null); mocks.listGoals.mockResolvedValue([]); mocks.listProjects.mockResolvedValue([]); mocks.getActiveRoadmap.mockResolvedValue(null);
  });

  it("does not dismiss opted-in evolution suggestions during an explicit baseline refresh", async () => {
    let mode = "";
    const chain: any = {
      select: vi.fn(() => { mode = "select"; return chain; }), update: vi.fn(() => { mode = "update"; return chain; }), insert: vi.fn(() => { mode = "insert"; return chain; }),
      eq: vi.fn(() => chain), neq: vi.fn(() => chain), order: vi.fn(() => chain), maybeSingle: vi.fn(() => chain),
      then: (resolve: any) => resolve(mode === "select" ? { data: [{ id: "baseline", status: "pending", context_version: "baseline-v1" }], error: null } : { data: [], error: null }),
    };
    mocks.client = { from: vi.fn(() => chain) };

    await generateRoadmapRecommendations(userId, undefined, true);

    expect(chain.neq).toHaveBeenCalledWith("context_version", "evolution-v1");
    expect(mocks.createGoal).not.toHaveBeenCalled();
    expect(mocks.createRoadmap).not.toHaveBeenCalled();
  });
});
