import type { BehavioralEvent, DecisionRecord, SimulationGraph, TerminalOutcomeCategory } from "./contracts";

const terminalOutcomeCopy: Record<TerminalOutcomeCategory, { title: string; summary: string; reflectionPrompt: string }> = {
  practice_next_step: { title: "Practice-oriented close", summary: "This scenario path closes with a small practice move named for a future project or work situation.", reflectionPrompt: "What is one small, low-stakes way to try that practice move?" },
  evidence_review: { title: "Evidence-review close", summary: "This scenario path closes with a plan to revisit the outcome using shared evidence before changing the next step.", reflectionPrompt: "What evidence would be most useful to review with others?" },
  feedback_conversation: { title: "Feedback-oriented close", summary: "This scenario path closes with an invitation for another perspective on the trade-off and communication.", reflectionPrompt: "Who could offer a useful perspective on the trade-off?" },
};

export function presentTerminalOutcome(graph: SimulationGraph, currentNodeId: string | null | undefined) {
  const terminal = currentNodeId ? graph.nodes[currentNodeId] : undefined;
  if (!terminal?.terminal) return null;
  const copy = terminal.terminalOutcome ? terminalOutcomeCopy[terminal.terminalOutcome] : { title: "Simulation complete", summary: "This scenario path is complete. The result below summarizes learning signals from the decisions in this work situation.", reflectionPrompt: "Which decision would you want to revisit or discuss?" };
  return { category: terminal.terminalOutcome ?? "neutral_close", ...copy, note: "This describes the next step within this simulated work situation. It is not a rating, personality label, or prediction." };
}

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
