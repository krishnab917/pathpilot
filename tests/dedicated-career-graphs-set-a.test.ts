import { describe, expect, it } from "vitest";
import { chooseSimulationDecision, getPublicScenario, initialSimulationState } from "../server/simulation/engine";
import {
  aerospaceEngineerAstronautV1Graph,
  doctorPhysicianV1Graph,
  entrepreneurStartupFounderV1Graph,
  lawyerV1Graph,
} from "../server/simulation/graphs/dedicated-set-a";
import type { SimulationGraph } from "../server/simulation/contracts";

const graphs = [doctorPhysicianV1Graph, lawyerV1Graph, entrepreneurStartupFounderV1Graph, aerospaceEngineerAstronautV1Graph];

function reachableNodes(graph: SimulationGraph) {
  const visited = new Set<string>();
  const pending = [graph.startNodeId];
  while (pending.length) {
    const nodeId = pending.shift()!;
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);
    const node = graph.nodes[nodeId]!;
    for (const decision of node.decisions) {
      if (typeof decision.next === "string") pending.push(decision.next);
    }
  }
  return visited;
}

describe("dedicated career graph set A", () => {
  it("provides separate, connected professional scenario libraries with ten authored decision stages", () => {
    expect(new Set(graphs.map(graph => graph.id)).size).toBe(4);
    const openingSituations = new Set(graphs.map(graph => getPublicScenario(graph, initialSimulationState(graph)).situation));
    expect(openingSituations.size).toBe(4);

    for (const graph of graphs) {
      const decisionNodes = Object.values(graph.nodes).filter(node => !node.terminal);
      expect(decisionNodes).toHaveLength(10);
      expect(Object.values(graph.nodes).filter(node => node.terminal)).toHaveLength(3);
      expect(reachableNodes(graph).size).toBe(Object.keys(graph.nodes).length);
    }
  });

  it("uses each career's opening choice to create a different deterministic next scenario", () => {
    for (const graph of graphs) {
      const state = initialSimulationState(graph);
      const opening = getPublicScenario(graph, state);
      const first = chooseSimulationDecision(graph, state, opening.decisions[0]!.id, [], []);
      const second = chooseSimulationDecision(graph, state, opening.decisions[1]!.id, [], []);
      expect(first.state.currentNodeId).not.toBe(second.state.currentNodeId);
      expect(first.consequence?.message).not.toBe(second.consequence?.message);
    }
  });

  it("keeps specialty-specific environments visible in authored scenario titles", () => {
    expect(Object.values(doctorPhysicianV1Graph.nodes).map(node => node.title).join(" ")).toContain("Triage");
    expect(Object.values(lawyerV1Graph.nodes).map(node => node.title).join(" ")).toContain("legal");
    expect(Object.values(entrepreneurStartupFounderV1Graph.nodes).map(node => node.title).join(" ")).toContain("customer");
    expect(Object.values(aerospaceEngineerAstronautV1Graph.nodes).map(node => node.title).join(" ")).toContain("telemetry");
  });
});
