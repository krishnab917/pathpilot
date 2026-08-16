import { buildBehavioralProfile } from "../server/simulation/behavioral";
import { buildAdaptiveResults, chooseSimulationDecision, getPublicScenario, getSimulationGraph, initialSimulationState } from "../server/simulation/engine";
import type { BehavioralEvidence, DecisionRecord } from "../server/simulation/contracts";
import { describe, expect, it } from "vitest";

const advance = (decisionId: string, state = initialSimulationState(getSimulationGraph("Software Engineer")), evidence: BehavioralEvidence[] = [], history: DecisionRecord[] = []) => chooseSimulationDecision(getSimulationGraph("Software Engineer"), state, decisionId, evidence, history);

describe("adaptive simulation engine", () => {
  it("starts at a public node without exposing hidden decision metadata", () => {
    const graph = getSimulationGraph("Software Engineer");
    const scenario = getPublicScenario(graph, initialSimulationState(graph));
    expect(scenario.id).toBe("model-alert");
    expect(scenario.decisions).toHaveLength(4);
    expect(scenario.decisions[0]).toEqual({ id: "investigate-data", label: expect.any(String) });
    expect(JSON.stringify(scenario)).not.toContain("signals");
    expect(JSON.stringify(scenario)).not.toContain("statePatch");
  });

  it("branches to meaningfully different scenarios from different starting decisions", () => {
    const dataPath = advance("investigate-data");
    const peerPath = advance("ask-peer");
    expect(dataPath.state.currentNodeId).toBe("data-audit");
    expect(peerPath.state.currentNodeId).toBe("peer-review");
    expect(dataPath.state.discoveredInformation).toContain("input-distribution-shift");
    expect(peerPath.state.teamTrust).toBeGreaterThan(initialSimulationState(getSimulationGraph("Software Engineer")).teamTrust);
  });

  it("selects distinct health, design, and business work situations from the requested career", () => {
    expect(getSimulationGraph("Registered Nurse").id).toBe("health-care-team-v1");
    expect(getSimulationGraph("UX Designer").id).toBe("design-feedback-v1");
    expect(getSimulationGraph("Entrepreneur").id).toBe("business-decision-v1");
    expect(getSimulationGraph("Software Engineer").id).toBe("software-systems-v1");
  });

  it("records a student-visible consequence event for each decision without exposing signals publicly", () => {
    const graph = getSimulationGraph("UX Designer");
    const response = chooseSimulationDecision(graph, initialSimulationState(graph), "gather-evidence", [], []);
    expect(response.events).toHaveLength(1);
    expect(response.consequence).toMatchObject({ kind: "learning", message: expect.stringContaining("evidence") });
    expect(JSON.stringify(getPublicScenario(graph, response.state))).not.toContain("consequence");
  });

  it("persists sequential decision history and completes a multi-node evidence path", () => {
    let state = initialSimulationState(getSimulationGraph("Software Engineer")); let evidence: BehavioralEvidence[] = []; let history: DecisionRecord[] = []; let result;
    for (const decisionId of ["investigate-data", "document-and-test", "pause-and-analyze", "protect-validation", "run-experiment", "present-options", "capture-learning", "practice-skill"]) {
      result = advance(decisionId, state, evidence, history); state = result.state; evidence = result.evidence; history = result.history;
    }
    expect(result?.completed).toBe(true);
    expect(state.currentNodeId).toBe("debrief");
    expect(history).toHaveLength(8);
    expect(evidence.length).toBeGreaterThan(9);
    expect(new Set(history.map(item => item.nodeId)).size).toBeGreaterThan(6);
  });

  it("rejects a decision that is not available from the current node", () => {
    expect(() => advance("not-in-this-node")).toThrow("not available");
  });

  it("restores a serialized interrupted session at the same next public scenario", () => {
    const first = advance("ask-peer");
    const second = advance("split-work", first.state, first.evidence, first.history);
    const restoredState = JSON.parse(JSON.stringify(second.state));
    const restoredEvidence = JSON.parse(JSON.stringify(second.evidence));
    const restoredHistory = JSON.parse(JSON.stringify(second.history));
    const graph = getSimulationGraph("Software Engineer");
    expect(getPublicScenario(graph, restoredState).id).toBe("deadline-call");
    const continued = chooseSimulationDecision(graph, restoredState, "protect-core", restoredEvidence, restoredHistory);
    expect(continued.history).toHaveLength(3);
    expect(continued.state.currentNodeId).toBe("stakeholder-review");
  });

  it("does not allow an already completed graph state to accept another decision", () => {
    const graph = getSimulationGraph("Software Engineer");
    const completeState = { ...initialSimulationState(graph), currentNodeId: "debrief" };
    expect(() => chooseSimulationDecision(graph, completeState, "anything", [], [])).toThrow("not waiting for a decision");
  });

  it("derives confidence from repeated contextual evidence and preserves contradictions", () => {
    const evidence: BehavioralEvidence[] = [
      { trait: "analytical_thinking", direction: 1, weight: 2, context: "uncertainty", difficulty: 2, nodeId: "one", decisionId: "one" },
      { trait: "analytical_thinking", direction: 1, weight: 2, context: "technical", difficulty: 3, nodeId: "two", decisionId: "two" },
      { trait: "analytical_thinking", direction: 1, weight: 1, context: "planning", difficulty: 2, nodeId: "three", decisionId: "three" },
      { trait: "communication", direction: 1, weight: 2, context: "interpersonal", difficulty: 2, nodeId: "four", decisionId: "four" },
      { trait: "communication", direction: -1, weight: 3, context: "time_pressure", difficulty: 3, nodeId: "five", decisionId: "five" },
    ];
    const profile = buildBehavioralProfile(evidence);
    expect(profile.traits.find(item => item.trait === "analytical_thinking")).toMatchObject({ confidence: "high", evidenceCount: 3 });
    expect(profile.contradictions.some(item => item.includes("communication"))).toBe(true);
    expect(profile.patterns.some(item => item.includes("gather evidence"))).toBe(true);
  });

  it("produces different compatible-career ordering from different observed evidence", () => {
    const analyticalEvidence: BehavioralEvidence[] = ["analytical_thinking", "problem_solving", "systems_thinking", "attention_to_detail"].flatMap((trait, index) => [
      { trait: trait as BehavioralEvidence["trait"], direction: 1 as const, weight: 2 as const, context: "technical" as const, difficulty: 2, nodeId: `a${index}`, decisionId: `a${index}` },
      { trait: trait as BehavioralEvidence["trait"], direction: 1 as const, weight: 1 as const, context: "uncertainty" as const, difficulty: 2, nodeId: `b${index}`, decisionId: `b${index}` },
    ]);
    const collaborativeEvidence: BehavioralEvidence[] = ["communication", "collaboration", "ownership", "long_term_thinking"].flatMap((trait, index) => [
      { trait: trait as BehavioralEvidence["trait"], direction: 1 as const, weight: 2 as const, context: "interpersonal" as const, difficulty: 2, nodeId: `c${index}`, decisionId: `c${index}` },
      { trait: trait as BehavioralEvidence["trait"], direction: 1 as const, weight: 1 as const, context: "planning" as const, difficulty: 2, nodeId: `d${index}`, decisionId: `d${index}` },
    ]);
    const careers = [{ name: "Software Engineer", matchScore: 80 }, { name: "IT Project Manager", matchScore: 80 }];
    const analytical = buildAdaptiveResults(analyticalEvidence, careers).compatibility;
    const collaborative = buildAdaptiveResults(collaborativeEvidence, careers).compatibility;
    expect(analytical[0]?.careerName).toBe("Software Engineer");
    expect(collaborative[0]?.careerName).toBe("IT Project Manager");
  });
});
