import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ client: null as any }));
vi.mock("../server/supabase", () => ({ currentSupabaseClient: () => mocks.client, getSupabaseConfig: () => ({ url: "https://example.supabase.co" }) }));
import { chooseAdaptiveSimulationDecision, createAdaptiveSimulation } from "../server/db";
import { chooseSimulationDecision, getWorkSimulationGraph, initialSimulationState } from "../server/simulation/engine";

const userId = "11111111-1111-4111-8111-111111111111";
const id = "22222222-2222-4222-8222-222222222222";
const graph = getWorkSimulationGraph("software-engineer");
const row = () => ({ id, user_id: userId, career: "Software Engineer", title: graph.title, status: "in_progress", created_at: "2026-10-11T00:00:00Z", updated_at: "2026-10-11T00:00:00Z", engine_version: "adaptive-v2", scenario_graph_id: graph.id, current_node_id: "work-1", decision_history: [], behavioral_evidence: [], behavioral_events: [], simulation_state: initialSimulationState(graph) });
const work = () => ({ nodeId: "work-1", inspected: ["brief"], values: Object.fromEntries(graph.nodes["work-1"].work!.fields.map(field => [field.id, field.expected])), trials: [] });
function query(data: unknown) {
  const chain: any = {};
  for (const method of ["select", "eq", "insert", "update"]) chain[method] = vi.fn(() => chain);
  chain.maybeSingle = vi.fn(async () => ({ data, error: null }));
  chain.single = vi.fn(async () => ({ data, error: null }));
  return chain;
}
describe("work simulation persistence boundaries (mock database only)", () => {
  beforeEach(() => vi.clearAllMocks());
  it("creates a new versioned graph through existing JSON columns, with timing off", async () => {
    const q = query(row()); mocks.client = { from: vi.fn(() => q) };
    await createAdaptiveSimulation(userId, "software-engineer");
    expect(q.insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: userId, engine_version: "adaptive-v2", scenario_graph_id: "software-engineer-work-v1", response_timing_opt_in: false }));
  });
  it("saves bounded receipts, keeps user scoping, and guards the current node atomically", async () => {
    const read = query(row()), write = query(row());
    mocks.client = { from: vi.fn().mockReturnValueOnce(read).mockReturnValueOnce(write) };
    await chooseAdaptiveSimulationDecision(userId, id, "submit-work", undefined, work());
    expect(read.eq).toHaveBeenCalledWith("user_id", userId);
    expect(write.eq).toHaveBeenCalledWith("user_id", userId);
    expect(write.eq).toHaveBeenCalledWith("current_node_id", "work-1");
    expect(write.eq).toHaveBeenCalledWith("status", "in_progress");
    const patch = write.update.mock.calls[0][0];
    expect(patch.current_node_id).toBe("work-2");
    expect(patch.decision_history[0].work.artifact).toHaveLength(3);
    expect(patch).not.toHaveProperty("response_timing_events");
    expect(patch).not.toHaveProperty("status");
  });
  it("does not treat a lost compare-and-swap as a saved advancement", async () => {
    const read = query(row()), write = query(null);
    mocks.client = { from: vi.fn().mockReturnValueOnce(read).mockReturnValueOnce(write) };
    await expect(chooseAdaptiveSimulationDecision(userId, id, "submit-work", undefined, work())).rejects.toThrow("another window");
    expect(write.update).toHaveBeenCalledTimes(1);
  });
  it("rejects completed runs and stale work before a write", async () => {
    const q = query({ ...row(), status: "completed" }); mocks.client = { from: vi.fn(() => q) };
    await expect(chooseAdaptiveSimulationDecision(userId, id, "submit-work", undefined, work())).rejects.toThrow("already complete");
    expect(q.update).not.toHaveBeenCalled();
    q.maybeSingle.mockResolvedValue({ data: { ...row(), current_node_id: "work-2", simulation_state: { ...initialSimulationState(graph), currentNodeId: "work-2" } }, error: null });
    await expect(chooseAdaptiveSimulationDecision(userId, id, "submit-work", undefined, work())).rejects.toThrow("current assignment");
    expect(q.update).not.toHaveBeenCalled();
  });

  it("persists completion, observations, and the existing score contract in one guarded write", async () => {
    const first = chooseSimulationDecision(graph, initialSimulationState(graph), "submit-work", [], [], [], work());
    const secondWork = { ...work(), nodeId: "work-2", values: Object.fromEntries(graph.nodes["work-2"].work!.fields.map(field => [field.id, field.expected])) };
    const second = chooseSimulationDecision(graph, first.state, "submit-work", first.evidence, first.history, first.events, secondWork);
    const read = query({ ...row(), current_node_id: "handoff", simulation_state: second.state, decision_history: second.history, behavioral_evidence: second.evidence, behavioral_events: second.events });
    const matches: any = { select: vi.fn(), eq: vi.fn(), order: vi.fn(async () => ({ data: [], error: null })) };
    matches.select.mockReturnValue(matches); matches.eq.mockReturnValue(matches);
    const write = query({ ...row(), status: "completed" });
    mocks.client = { from: vi.fn().mockReturnValueOnce(read).mockReturnValueOnce(matches).mockReturnValueOnce(write) };
    await chooseAdaptiveSimulationDecision(userId, id, "handoff-reviewed");
    const patch = write.update.mock.calls[0][0];
    expect(patch.status).toBe("completed");
    expect(patch.decision_history).toHaveLength(3);
    expect(patch.decision_history.filter((item: any) => item.work)).toHaveLength(2);
    expect(patch.behavioral_profile.traits.length).toBeGreaterThan(0);
    expect(patch.compatibility_results).toHaveLength(25);
    expect(patch.score).toEqual(expect.any(Number));
    expect(write.eq).toHaveBeenCalledWith("current_node_id", "handoff");
    expect(write.update).toHaveBeenCalledTimes(1);
  });
});
