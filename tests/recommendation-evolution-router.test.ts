import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../server/_core/context";

const mocks = vi.hoisted(() => ({ preview: vi.fn(), add: vi.fn() }));
vi.mock("../server/roadmap/recommendation-repository", async importOriginal => ({
  ...(await importOriginal<typeof import("../server/roadmap/recommendation-repository")>()),
  getRoadmapRecommendationEvolutionPreview: mocks.preview,
  addEvolvedRoadmapRecommendations: mocks.add,
}));

import { appRouter } from "../server/routers";

const userId = "11111111-1111-4111-8111-111111111111";
const simulationId = "22222222-2222-4222-8222-222222222222";
const context: TrpcContext = { user: { id: userId, email: "student@example.com", name: "Student", role: "user" }, supabase: {} as NonNullable<TrpcContext["supabase"]>, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };

describe("recommendation evolution router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.preview.mockResolvedValue({ state: "ready", title: "Optional", detail: "Read only", includedSimulationCount: 3, completedSimulationCount: 3, mostRecentCompletedAt: null, focus, consideredInputs: [], exclusions: [], preserves: [], recommendationCount: 4 });
    mocks.add.mockResolvedValue({ recommendations: [] });
  });
  const focus = { title: "Practice collaboration", description: "Test it.", rationale: "Based on completed simulations." };

  it("keeps preview read-only and forwards only the authenticated student identity", async () => {
    await appRouter.createCaller(context).pathpilot.roadmap.recommendations.evolutionPreview({ simulationId });
    expect(mocks.preview).toHaveBeenCalledWith(userId, simulationId);
    expect(mocks.add).not.toHaveBeenCalled();
  });

  it("requires explicit confirmation before adding a separate optional set", async () => {
    await expect(appRouter.createCaller(context).pathpilot.roadmap.recommendations.addEvolved({ simulationId, confirmed: false as true })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mocks.add).not.toHaveBeenCalled();
    await appRouter.createCaller(context).pathpilot.roadmap.recommendations.addEvolved({ simulationId, confirmed: true });
    expect(mocks.add).toHaveBeenCalledWith(userId, simulationId);
  });
});
