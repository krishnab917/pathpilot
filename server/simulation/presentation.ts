import type { BehavioralEvent, DecisionRecord, SimulationGraph } from "./contracts";

export function buildDecisionReview(graph: SimulationGraph, history: DecisionRecord[], events: BehavioralEvent[]) {
  return history.map((record, index) => {
    const node = graph.nodes[record.nodeId];
    const decision = node?.decisions.find(item => item.id === record.decisionId);
    const event = [...events].reverse().find(item => item.nodeId === record.nodeId && item.decisionId === record.decisionId);
    return {
      step: index + 1,
      nodeTitle: node?.title ?? "Decision point",
      decisionLabel: decision?.label ?? "Recorded decision",
      consequence: event ? { message: event.message, kind: event.kind } : null,
    };
  });
}
