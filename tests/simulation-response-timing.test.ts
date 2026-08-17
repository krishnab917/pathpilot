import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../server/_core/context";
import { chooseSimulationDecision, getPublicScenario, getSimulationGraphById, initialSimulationState } from "../server/simulation/engine";
import { hasTimePressurePresentation } from "../server/simulation/time-pressure-presentation";

const mocks = vi.hoisted(() => ({ getStudentProfile: vi.fn(), getResumableAdaptiveSimulation: vi.fn(), createAdaptiveSimulation: vi.fn(), chooseAdaptiveSimulationDecision: vi.fn(), setSimulationTimingOptIn: vi.fn() }));

vi.mock("../server/db", async importOriginal => {
  const actual = await importOriginal<typeof import("../server/db")>();
  return {
    ...actual,
    getStudentProfile: mocks.getStudentProfile,
    getResumableAdaptiveSimulation: mocks.getResumableAdaptiveSimulation,
    createAdaptiveSimulation: mocks.createAdaptiveSimulation,
    chooseAdaptiveSimulationDecision: mocks.chooseAdaptiveSimulationDecision,
    setSimulationTimingOptIn: mocks.setSimulationTimingOptIn,
  };
});

import { appRouter } from "../server/routers";

const userId = "11111111-1111-4111-8111-111111111111";
const simulationId = "22222222-2222-4222-8222-222222222222";
const context: TrpcContext = { user: { id: userId, email: "student@example.com", name: "Student", role: "user" }, supabase: {} as NonNullable<TrpcContext["supabase"]>, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
const completedSimulation = { id: simulationId, userId, career: "Software Engineer", title: "Software work situations", status: "completed", createdAt: new Date(), updatedAt: new Date(), completedAt: new Date(), scenarioGraphId: "software-systems-v1", decisionHistory: [], behavioralEvents: [], responseTimingOptIn: true, responseTimingEvents: [{ nodeId: "model-alert", decisionId: "ask-peer", responseMs: 1200, scenarioPressureLabel: "time_sensitive" }], resultSummary: "A learning summary.", behavioralProfile: null, compatibilityResults: [], technicalScore: 0, leadershipScore: 0, careerCompatibilityScore: 0, score: 0 };

describe("optional simulation response timing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getStudentProfile.mockResolvedValue({ userId });
    mocks.getResumableAdaptiveSimulation.mockResolvedValue(null);
    mocks.createAdaptiveSimulation.mockResolvedValue(completedSimulation);
    mocks.chooseAdaptiveSimulationDecision.mockResolvedValue(completedSimulation);
    mocks.setSimulationTimingOptIn.mockResolvedValue({ id: simulationId, responseTimingOptIn: false });
  });

  it("defaults timing consent off and forwards opt-in only when the student selects it", async () => {
    await appRouter.createCaller(context).pathpilot.simulations.adaptive.start({ career: "Software Engineer" });
    expect(mocks.createAdaptiveSimulation).toHaveBeenLastCalledWith(userId, "Software Engineer", false);

    await appRouter.createCaller(context).pathpilot.simulations.adaptive.start({ career: "Software Engineer", responseTimingOptIn: true });
    expect(mocks.createAdaptiveSimulation).toHaveBeenLastCalledWith(userId, "Software Engineer", true);
  });

  it("uses the authenticated student identity for consent changes and optional response-time forwarding", async () => {
    await appRouter.createCaller(context).pathpilot.simulations.adaptive.setTimingOptIn({ id: simulationId, optIn: false });
    expect(mocks.setSimulationTimingOptIn).toHaveBeenCalledWith(userId, simulationId, false);

    await appRouter.createCaller(context).pathpilot.simulations.adaptive.choose({ id: simulationId, decisionId: "ask-peer", responseTimeMs: 1200 });
    expect(mocks.chooseAdaptiveSimulationDecision).toHaveBeenCalledWith(userId, simulationId, "ask-peer", 1200);
  });

  it("never returns private timing events in the public simulation projection", async () => {
    const response = await appRouter.createCaller(context).pathpilot.simulations.adaptive.choose({ id: simulationId, decisionId: "ask-peer", responseTimeMs: 1200 });
    expect(response.simulation.responseTimingOptIn).toBe(true);
    expect(JSON.stringify(response.simulation)).not.toContain("responseTimingEvents");
    expect(JSON.stringify(response.simulation)).not.toContain("responseMs");
    expect(JSON.stringify(response.simulation)).not.toContain("scenarioPressureLabel");
  });

  it("derives only a cosmetic time-pressure cue from state, never source contexts or a deadline", () => {
    const graph = getSimulationGraphById("software-systems-v1")!;
    const initialState = initialSimulationState(graph);
    const scenario = getPublicScenario(graph, initialState);
    const transition = chooseSimulationDecision(graph, initialState, "investigate-data", [], []);
    expect(hasTimePressurePresentation(initialState)).toBe(false);
    expect(hasTimePressurePresentation(transition.state)).toBe(true);
    expect(scenario).not.toHaveProperty("contexts");
    expect(JSON.stringify(scenario)).not.toContain("countdown");
    expect(JSON.stringify(scenario)).not.toContain("deadline");
  });
});
