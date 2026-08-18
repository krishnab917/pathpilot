import { describe, expect, it } from "vitest";
import { chooseSimulationDecision, getPublicScenario, initialSimulationState } from "../server/simulation/engine";
import {
  aiMachineLearningEngineerV1Graph,
  cybersecurityAnalystV1Graph,
  dataScientistV1Graph,
  mechanicalEngineerV1Graph,
  productManagerV1Graph,
} from "../server/simulation/graphs/dedicated-set-b";
import type { SimulationGraph } from "../server/simulation/contracts";

const graphs = [aiMachineLearningEngineerV1Graph, productManagerV1Graph, cybersecurityAnalystV1Graph, dataScientistV1Graph, mechanicalEngineerV1Graph];

function reachableNodes(graph: SimulationGraph) {
  const visited = new Set<string>();
  const pending = [graph.startNodeId];
  while (pending.length) {
    const id = pending.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    for (const decision of graph.nodes[id]!.decisions) if (typeof decision.next === "string") pending.push(decision.next);
  }
  return visited;
}

describe("dedicated career graph set B", () => {
  it("contains five separate ten-stage career environments with reachable safe closes", () => {
    expect(new Set(graphs.map(graph => graph.id)).size).toBe(5);
    expect(new Set(graphs.map(graph => getPublicScenario(graph, initialSimulationState(graph)).situation)).size).toBe(5);
    for (const graph of graphs) {
      expect(Object.values(graph.nodes).filter(node => !node.terminal)).toHaveLength(10);
      expect(Object.values(graph.nodes).filter(node => node.terminal)).toHaveLength(3);
      expect(reachableNodes(graph).size).toBe(Object.keys(graph.nodes).length);
    }
  });

  it("routes each opening decision to a different career-specific next situation", () => {
    for (const graph of graphs) {
      const state = initialSimulationState(graph);
      const opening = getPublicScenario(graph, state);
      const nextNodes = opening.decisions.map(decision => chooseSimulationDecision(graph, state, decision.id, [], []).state.currentNodeId);
      expect(new Set(nextNodes).size).toBe(3);
    }
  });

  it("makes the central work context visible in the authored library", () => {
    expect(Object.values(aiMachineLearningEngineerV1Graph.nodes).map(node => node.title).join(" ")).toContain("Model");
    expect(Object.values(productManagerV1Graph.nodes).map(node => node.title).join(" ")).toContain("roadmap");
    expect(Object.values(cybersecurityAnalystV1Graph.nodes).map(node => node.title).join(" ")).toContain("Contain");
    expect(Object.values(dataScientistV1Graph.nodes).map(node => node.title).join(" ")).toContain("metric");
    expect(Object.values(mechanicalEngineerV1Graph.nodes).map(node => node.title).join(" ")).toContain("prototype");
  });
});
