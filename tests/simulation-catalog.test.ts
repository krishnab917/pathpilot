import { describe, expect, it } from "vitest";
import { getAdaptivePublicScenario } from "../server/db";
import { chooseSimulationDecision, getPublicScenario, getSimulationGraph, getSimulationGraphById, initialSimulationState, simulationGraphCatalog } from "../server/simulation/engine";
import { simulationCareerCatalog } from "../server/simulation/catalog";

describe("expanded adaptive simulation catalog", () => {
  it("maps every supported career to its dedicated graph and never substitutes an unsupported input", () => {
    expect(simulationCareerCatalog).toHaveLength(15);
    for (const career of simulationCareerCatalog) {
      expect(getSimulationGraph(career.id).id).toBe(career.id === "software-engineer" ? "software-systems-v1" : `${career.id}-v1`);
      expect(getSimulationGraph(career.name).id).toBe(getSimulationGraph(career.id).id);
    }
    expect(() => getSimulationGraph("Civil Engineer")).toThrow("supported simulation catalog");
  });

  it("keeps every catalog graph internally connected and safe for the shared public scenario shell", () => {
    expect(new Set(simulationGraphCatalog.map(graph => graph.id)).size).toBe(simulationGraphCatalog.length);
    for (const graph of simulationGraphCatalog) {
      expect(graph.nodes[graph.startNodeId]).toBeDefined();
      for (const node of Object.values(graph.nodes)) {
        for (const choice of node.decisions) if (typeof choice.next === "string") expect(graph.nodes[choice.next]).toBeDefined();
      }
      expect(Object.values(graph.nodes).some(node => node.terminal)).toBe(true);
      const publicScenario = getPublicScenario(graph, initialSimulationState(graph));
      expect(publicScenario.decisions.length).toBeGreaterThanOrEqual(3);
      expect(JSON.stringify(publicScenario)).not.toContain("signals");
      expect(JSON.stringify(publicScenario)).not.toContain("statePatch");
    }
  });

  it("replays saved simulations from scenario_graph_id rather than remapping their career text", () => {
    const graph = getSimulationGraphById("engineering-design-v1")!;
    expect(getSimulationGraphById(graph.id)).toBe(graph);
    const saved = { career: "Software Engineer", scenarioGraphId: graph.id, simulationState: initialSimulationState(graph) } as any;
    expect(getAdaptivePublicScenario(saved).id).toBe("engineering-brief");
  });

  it("provides an eight-decision path for each new career-family graph without changing the common engine", () => {
    for (const graph of simulationGraphCatalog.filter(item => ["engineering-design-v1", "scientific-research-v1", "public-policy-v1", "education-learning-v1", "environmental-systems-v1", "communications-newsroom-v1"].includes(item.id))) {
      let state = initialSimulationState(graph); let evidence: any[] = []; let history: any[] = [];
      for (const decisionId of ["inspect-evidence", "test-small", "recommend-evidence", "assign-checkpoint", "capture-learning", "name-pattern", "set-measure", "practice-skill"]) {
        const result = chooseSimulationDecision(graph, state, decisionId, evidence, history);
        state = result.state; evidence = result.evidence; history = result.history;
      }
      expect(state.currentNodeId).toContain("debrief");
      expect(history).toHaveLength(8);
    }
  });
});
