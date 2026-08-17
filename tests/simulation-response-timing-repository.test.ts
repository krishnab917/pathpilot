import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ client: null as any }));
vi.mock("../server/supabase", () => ({ currentSupabaseClient: () => mocks.client, getSupabaseConfig: () => ({ url: "https://example.supabase.co" }) }));

import { getAdaptiveSimulation, recordSimulationTimingEvent, setSimulationTimingOptIn } from "../server/db";

const userId = "11111111-1111-4111-8111-111111111111";
const simulationId = "22222222-2222-4222-8222-222222222222";
const row = (responseTimingOptIn = true) => ({ id: simulationId, user_id: userId, career: "Software Engineer", title: "Software work situations", status: "in_progress", created_at: "2026-08-17T00:00:00Z", updated_at: "2026-08-17T00:00:00Z", engine_version: "adaptive-v2", scenario_graph_id: "software-systems-v1", current_node_id: "model-alert", node_history: [], decision_history: [], simulation_state: { currentNodeId: "model-alert", previousNodeIds: [], decisionCount: 0, timePressure: 1, projectHealth: 5, teamTrust: 3, riskExposure: 1, discoveredInformation: [], unresolvedEvents: [] }, behavioral_evidence: [], behavioral_events: [], response_timing_opt_in: responseTimingOptIn, response_timing_events: [] });

describe("simulation response timing repository", () => {
  beforeEach(() => vi.clearAllMocks());

  it("maps absent timing consent to false", async () => {
    const query = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() };
    query.select.mockReturnValue(query); query.eq.mockReturnValue(query); query.maybeSingle.mockResolvedValue({ data: { ...row(), response_timing_opt_in: undefined }, error: null });
    mocks.client = { from: vi.fn(() => query) };

    await expect(getAdaptiveSimulation(userId, simulationId)).resolves.toMatchObject({ responseTimingOptIn: false, responseTimingEvents: [] });
  });

  it("updates consent only for the authenticated simulation owner", async () => {
    const command = { update: vi.fn(), eq: vi.fn(), select: vi.fn(), maybeSingle: vi.fn() };
    command.update.mockReturnValue(command); command.eq.mockReturnValue(command); command.select.mockReturnValue(command); command.maybeSingle.mockResolvedValue({ data: { id: simulationId, response_timing_opt_in: true }, error: null });
    mocks.client = { from: vi.fn(() => command) };

    await expect(setSimulationTimingOptIn(userId, simulationId, true)).resolves.toEqual({ id: simulationId, responseTimingOptIn: true });
    expect(mocks.client.from).toHaveBeenCalledWith("simulations");
    expect(command.eq).toHaveBeenCalledWith("id", simulationId);
    expect(command.eq).toHaveBeenCalledWith("user_id", userId);
    expect(command.eq).toHaveBeenCalledWith("engine_version", "adaptive-v2");
  });

  it("stores only bounded private timing metadata separately after opt-in", async () => {
    const read = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() };
    read.select.mockReturnValue(read); read.eq.mockReturnValue(read); read.maybeSingle.mockResolvedValue({ data: row(true), error: null });
    const write = { update: vi.fn(), eq: vi.fn(), select: vi.fn(), maybeSingle: vi.fn() };
    write.update.mockReturnValue(write); write.eq.mockReturnValue(write); write.select.mockReturnValue(write); write.maybeSingle.mockResolvedValue({ data: { id: simulationId }, error: null });
    mocks.client = { from: vi.fn().mockReturnValueOnce(read).mockReturnValueOnce(write) };

    await expect(recordSimulationTimingEvent(userId, simulationId, { nodeId: "model-alert", decisionId: "ask-peer", responseMs: 1_900_000, scenarioPressureLabel: "time_sensitive" })).resolves.toEqual({ recorded: true });
    expect(write.update).toHaveBeenCalledWith(expect.objectContaining({ response_timing_events: [{ nodeId: "model-alert", decisionId: "ask-peer", responseMs: 1_800_000, scenarioPressureLabel: "time_sensitive" }] }));
    const patch = write.update.mock.calls[0][0];
    expect(patch).not.toHaveProperty("behavioral_evidence");
    expect(patch).not.toHaveProperty("decision_history");
    expect(patch).not.toHaveProperty("result_summary");
    expect(write.eq).toHaveBeenCalledWith("user_id", userId);
    expect(write.eq).toHaveBeenCalledWith("response_timing_opt_in", true);
  });

  it("does not create a timing write without consent", async () => {
    const read = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() };
    read.select.mockReturnValue(read); read.eq.mockReturnValue(read); read.maybeSingle.mockResolvedValue({ data: row(false), error: null });
    mocks.client = { from: vi.fn(() => read) };

    await expect(recordSimulationTimingEvent(userId, simulationId, { nodeId: "model-alert", decisionId: "ask-peer", responseMs: 600, scenarioPressureLabel: "time_sensitive" })).resolves.toEqual({ recorded: false });
    expect(mocks.client.from).toHaveBeenCalledTimes(1);
  });
});
