import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../server/_core/context";
import { getAdaptivePublicScenario } from "../server/db";
import { appRouter } from "../server/routers";
import { simulationCareerCatalog } from "../server/simulation/catalog";
import { getSimulationGraph, initialSimulationState } from "../server/simulation/engine";

const mocks = vi.hoisted(() => ({
  getStudentProfile: vi.fn(),
  getResumableAdaptiveSimulation: vi.fn(),
  createAdaptiveSimulation: vi.fn(),
}));

vi.mock("../server/db", async importOriginal => {
  const actual = await importOriginal<typeof import("../server/db")>();
  return {
    ...actual,
    getStudentProfile: mocks.getStudentProfile,
    getResumableAdaptiveSimulation: mocks.getResumableAdaptiveSimulation,
    createAdaptiveSimulation: mocks.createAdaptiveSimulation,
  };
});

const userId = "11111111-1111-4111-8111-111111111111";
const context: TrpcContext = {
  user: { id: userId, email: "student@example.com", name: "Student", role: "user" },
  supabase: {} as NonNullable<TrpcContext["supabase"]>,
  req: {} as TrpcContext["req"],
  res: {} as TrpcContext["res"],
};

function savedSimulation(careerId: string, id = "22222222-2222-4222-8222-222222222222") {
  const career = simulationCareerCatalog.find(item => item.id === careerId)!;
  const graph = getSimulationGraph(careerId);
  const state = initialSimulationState(graph);
  return {
    id,
    userId,
    career: career.name,
    title: graph.title,
    status: "in_progress" as const,
    createdAt: new Date("2026-08-18T00:00:00.000Z"),
    updatedAt: new Date("2026-08-18T00:00:00.000Z"),
    completedAt: null,
    scenarioGraphId: graph.id,
    currentNodeId: state.currentNodeId,
    nodeHistory: [],
    decisionHistory: [],
    simulationState: state,
    behavioralEvidence: [],
    behavioralEvents: [],
    responseTimingOptIn: false,
    responseTimingEvents: [],
    resultSummary: null,
    behavioralProfile: null,
    compatibilityResults: [],
    technicalScore: null,
    leadershipScore: null,
    careerCompatibilityScore: null,
    score: null,
  };
}

describe("curated simulation catalog launch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getStudentProfile.mockResolvedValue({ userId });
    mocks.getResumableAdaptiveSimulation.mockResolvedValue(null);
    mocks.createAdaptiveSimulation.mockImplementation(async (_userId: string, careerId: string) => savedSimulation(careerId));
  });

  it("returns exactly the fifteen supported careers through the protected catalog", async () => {
    const catalog = await appRouter.createCaller(context).pathpilot.simulations.adaptive.catalog();

    expect(catalog).toHaveLength(15);
    expect(catalog.map(item => item.id)).toEqual(simulationCareerCatalog.map(item => item.id));
  });

  it("rejects an unsupported career before a simulation can be created", async () => {
    await expect(appRouter.createCaller(context).pathpilot.simulations.adaptive.start({ careerId: "unlisted-career" }))
      .rejects.toMatchObject({ message: "That career simulation is not currently available. Choose one from the supported simulation catalog." });

    expect(mocks.createAdaptiveSimulation).not.toHaveBeenCalled();
  });

  it("launches every supported ID with its own dedicated graph rather than a substituted environment", async () => {
    const caller = appRouter.createCaller(context);

    for (const [index, career] of simulationCareerCatalog.entries()) {
      const response = await caller.pathpilot.simulations.adaptive.start({ careerId: career.id });
      const graph = getSimulationGraph(career.id);

      expect(mocks.createAdaptiveSimulation).toHaveBeenCalledWith(userId, career.id, false);
      expect(response.simulation.career).toBe(career.name);
      expect(response.scenario?.id).toBe(graph.startNodeId);
      expect(response.scenario?.title).toBe(graph.nodes[graph.startNodeId]?.title);
      expect(graph.id).toBe(index === 0 ? "software-systems-v1" : `${career.id}-v1`);
    }
  });

  it("replays saved sessions using each session's graph ID, preserving distinct career environments", () => {
    const software = savedSimulation("software-engineer", "22222222-2222-4222-8222-222222222222");
    const doctor = savedSimulation("doctor-physician", "33333333-3333-4333-8333-333333333333");

    expect(software.scenarioGraphId).not.toBe(doctor.scenarioGraphId);
    expect(getAdaptivePublicScenario(software).id).toBe(getSimulationGraph("software-engineer").startNodeId);
    expect(getAdaptivePublicScenario(doctor).id).toBe(getSimulationGraph("doctor-physician").startNodeId);
  });
});
