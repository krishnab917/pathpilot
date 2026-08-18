import { describe, expect, it } from "vitest";
import { chooseSimulationDecision, getPublicScenario, initialSimulationState } from "../server/simulation/engine";
import { architectV1Graph, environmentalScientistV1Graph, financialAnalystV1Graph, researchScientistV1Graph, uxProductDesignerV1Graph } from "../server/simulation/graphs/dedicated-set-c";
import type { SimulationGraph } from "../server/simulation/contracts";

const graphs = [architectV1Graph, uxProductDesignerV1Graph, financialAnalystV1Graph, environmentalScientistV1Graph, researchScientistV1Graph];
const reachable = (graph: SimulationGraph) => { const seen = new Set<string>(); const pending = [graph.startNodeId]; while (pending.length) { const id = pending.shift()!; if (seen.has(id)) continue; seen.add(id); for (const decision of graph.nodes[id]!.decisions) if (typeof decision.next === "string") pending.push(decision.next); } return seen; };

describe("dedicated career graph set C", () => {
  it("defines five distinct, connected ten-stage professional graph libraries", () => {
    expect(new Set(graphs.map(graph => getPublicScenario(graph, initialSimulationState(graph)).situation)).size).toBe(5);
    for (const graph of graphs) { expect(Object.values(graph.nodes).filter(node => !node.terminal)).toHaveLength(10); expect(Object.values(graph.nodes).filter(node => node.terminal)).toHaveLength(3); expect(reachable(graph).size).toBe(Object.keys(graph.nodes).length); }
  });
  it("routes every opening choice to a different next scenario", () => {
    for (const graph of graphs) { const state = initialSimulationState(graph); const opening = getPublicScenario(graph, state); expect(new Set(opening.decisions.map(decision => chooseSimulationDecision(graph, state, decision.id, [], []).state.currentNodeId)).size).toBe(3); }
  });
});
