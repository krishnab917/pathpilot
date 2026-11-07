import { describe, expect, it } from "vitest";
import { checkWork, reviewWork, workSubmissionSchema, type WorkSubmission } from "../shared/simulation-work";
import { simulationCareerCatalog } from "../server/simulation/catalog";
import { workAssignments } from "../server/simulation/work-assignments";
import { workDebrief, workGraphs } from "../server/simulation/work-graphs";
import { chooseSimulationDecision, getPublicScenario, getSimulationGraphById, getWorkSimulationGraph, initialSimulationState } from "../server/simulation/engine";
import type { BehavioralEvent, BehavioralEvidence, DecisionRecord } from "../server/simulation/contracts";

function submission(graph: typeof workGraphs[number], nodeId: string): WorkSubmission {
  const task = graph.nodes[nodeId].work!;
  return { nodeId, inspected: task.evidence.map(item => item.id), values: Object.fromEntries(task.fields.map(field => [field.id, field.expected])), trials: [] };
}

describe("authored work assignment integrity", () => {
  it("retains the original fifteen and adds exactly ten distinct launchable careers", () => {
    const original = ["software-engineer", "ai-machine-learning-engineer", "doctor-physician", "lawyer", "entrepreneur-startup-founder", "product-manager", "cybersecurity-analyst", "data-scientist", "aerospace-engineer-astronaut", "mechanical-engineer", "architect", "ux-product-designer", "financial-analyst", "environmental-scientist", "research-scientist"];
    expect(simulationCareerCatalog.slice(0, 15).map(career => career.id)).toEqual(original);
    expect(workAssignments).toHaveLength(25);
    expect(new Set(workAssignments.map(item => item.careerId)).size).toBe(25);
    expect(new Set(workAssignments.map(item => item.title)).size).toBe(25);
    expect(new Set(workAssignments.flatMap(item => item.tasks.map(task => task.kind)))).toEqual(new Set(["classify", "sequence", "calculate", "allocate"]));
    for (const career of simulationCareerCatalog) expect(getWorkSimulationGraph(career.id).id).toBe(`${career.id}-work-v1`);
    for (const career of original) expect(getSimulationGraphById(career === "software-engineer" ? "software-systems-v1" : `${career}-v1`)).not.toBeNull();
  });

  it.each(workAssignments)("validates and completes $careerId with real work receipts", assignment => {
    const graph = getWorkSimulationGraph(assignment.careerId);
    let state = initialSimulationState(graph);
    let evidence: BehavioralEvidence[] = [], history: DecisionRecord[] = [], events: BehavioralEvent[] = [];
    for (const task of assignment.tasks) {
      expect(task.evidence.length).toBeGreaterThan(0);
      expect(new Set(task.fields.map(field => field.id)).size).toBe(task.fields.length);
      expect(task.fields.length).toBeGreaterThanOrEqual(3);
      const draft = submission(graph, state.currentNodeId);
      expect(workSubmissionSchema.safeParse(draft).success).toBe(true);
      expect(checkWork(task, draft.values).every(check => check.passed)).toBe(true);
      const result = chooseSimulationDecision(graph, state, "submit-work", evidence, history, events, { ...draft, trials: [draft.values] });
      expect(result.completed).toBe(false);
      expect(result.history.at(-1)?.work?.artifact).toHaveLength(task.fields.length);
      expect(result.events.some(event => event.message.startsWith("Opened resource:"))).toBe(true);
      ({ state, evidence, history, events } = result);
    }
    expect(state.currentNodeId).toBe("handoff");
    const result = chooseSimulationDecision(graph, state, "handoff-reviewed", evidence, history, events);
    expect(result.completed).toBe(true);
    expect(result.history).toHaveLength(3);
    expect(workDebrief(graph, result.history)?.receipts).toHaveLength(2);
    expect(() => chooseSimulationDecision(graph, result.state, "handoff-reviewed", result.evidence, result.history)).toThrow();
    const restarted = initialSimulationState(graph);
    expect(restarted.decisionCount).toBe(0);
    expect(restarted.discoveredInformation).toEqual([]);
    expect(result.history).toHaveLength(3);
  });

  it.each(workAssignments)("allows recovery and records consequences for $careerId", assignment => {
    const graph = getWorkSimulationGraph(assignment.careerId);
    const draft = submission(graph, "work-1");
    const field = assignment.tasks[0].fields[0];
    if (assignment.tasks[0].kind === "sequence") {
      [draft.values.f0, draft.values.f1] = [draft.values.f1, draft.values.f0];
    } else draft.values.f0 = field.options ? field.options.find(option => option !== field.expected)! : field.expected === "0" ? "1" : "0";
    const first = chooseSimulationDecision(graph, initialSimulationState(graph), "submit-work", [], [], [], draft);
    expect(first.state.discoveredInformation).toContain("work-1:review");
    expect(getPublicScenario(graph, first.state).work?.previousOutcome).toContain("open checks");
    const second = chooseSimulationDecision(graph, first.state, "submit-work", first.evidence, first.history, first.events, submission(graph, "work-2"));
    expect(second.state.discoveredInformation).toContain("work-2:verified");
    expect(second.history[0].work?.checks.some(check => !check.passed)).toBe(true);
    const reviewed = chooseSimulationDecision(graph, second.state, "handoff-reviewed", second.evidence, second.history, second.events);
    const released = chooseSimulationDecision(graph, second.state, "handoff-release", second.evidence, second.history, second.events);
    expect(reviewed.state.currentNodeId).not.toBe(released.state.currentNodeId);
    expect(reviewed.consequence?.message).not.toBe(released.consequence?.message);
  });

  it("rejects skipped work, stale nodes, invalid evidence, extra fields, budgets, and duplicate positions", () => {
    const graph = workGraphs[0]; const state = initialSimulationState(graph);
    expect(() => chooseSimulationDecision(graph, state, "handoff-reviewed", [], [])).toThrow("Work incomplete");
    const valid = submission(graph, state.currentNodeId);
    for (const invalid of [{ ...valid, nodeId: "work-2" }, { ...valid, inspected: [] }, { ...valid, inspected: ["invented"] }, { ...valid, values: {} }, { ...valid, values: { ...valid.values, injected: "value" } }]) expect(() => chooseSimulationDecision(graph, state, "submit-work", [], [], [], invalid)).toThrow();
    const budget = workAssignments.find(item => item.tasks[0].kind === "allocate")!.tasks[0];
    expect(() => checkWork(budget, Object.fromEntries(budget.fields.map(field => [field.id, "100"])))).toThrow("stay within");
    const order = workAssignments[0].tasks[1];
    expect(() => checkWork(order, Object.fromEntries(order.fields.map(field => [field.id, "1"])))).toThrow("each position");
  });

  it("derives revision observations from different artifacts, not a claimed boolean", () => {
    const graph = workGraphs[0]; const valid = submission(graph, "work-1");
    const receipt = reviewWork(graph.nodes["work-1"].work!, { ...valid, trials: [{ ...valid.values, f0: "After insert" }] });
    expect(receipt.revised).toBe(true);
    expect(receipt.tests).toBe(1);
    expect(reviewWork(graph.nodes["work-1"].work!, valid).revised).toBe(false);
    expect(workSubmissionSchema.safeParse({ ...valid, secret: "not accepted" }).success).toBe(false);
  });
});
