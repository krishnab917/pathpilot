import { describe, expect, it } from "vitest";
import { chooseSimulationDecision, getSimulationGraph, initialSimulationState, simulationGraphCatalog } from "../server/simulation/engine";
import { terminalOutcomeCategories } from "../server/simulation/contracts";
import { presentTerminalOutcome } from "../server/simulation/presentation";

const graph = getSimulationGraph("Software Engineer");
const choicesBeforeClose = ["investigate-data", "document-and-test", "pause-and-analyze", "protect-validation", "run-experiment", "present-options", "capture-learning"];

function reachFinalLearningChoice(finalDecisionId: string) {
  let state = initialSimulationState(graph); let evidence: any[] = []; let history: any[] = [];
  for (const decisionId of [...choicesBeforeClose, finalDecisionId]) {
    const transition = chooseSimulationDecision(graph, state, decisionId, evidence, history);
    state = transition.state; evidence = transition.evidence; history = transition.history;
  }
  return state;
}

describe("safe simulation terminal outcomes", () => {
  it("provides the same three safe close categories in every career graph", () => {
    for (const catalogGraph of simulationGraphCatalog) {
      const categories = Object.values(catalogGraph.nodes).filter(node => node.terminal).map(node => node.terminalOutcome);
      expect(categories.sort()).toEqual([...terminalOutcomeCategories].sort());
    }
  });

  it.each([
    ["practice-skill", "practice_next_step"],
    ["review-outcome", "evidence_review"],
    ["seek-feedback", "feedback_conversation"],
  ] as const)("ends the %s path in the %s scenario close", (decisionId, category) => {
    const state = reachFinalLearningChoice(decisionId);
    const outcome = presentTerminalOutcome(graph, state.currentNodeId);
    expect(graph.nodes[state.currentNodeId]?.terminal).toBe(true);
    expect(outcome).toMatchObject({ category, note: expect.stringContaining("not a rating") });
    expect(outcome).not.toHaveProperty("score");
    expect(outcome).not.toHaveProperty("traits");
    expect(outcome).not.toHaveProperty("behavioralEvidence");
    expect(outcome?.note).toContain("personality label");
    expect(outcome?.note).toContain("prediction");
  });

  it("keeps a missing or legacy terminal node neutral rather than assigning an inferred outcome", () => {
    expect(presentTerminalOutcome(graph, "debrief")).toBeNull();
    expect(presentTerminalOutcome(graph, undefined)).toBeNull();
  });
});
