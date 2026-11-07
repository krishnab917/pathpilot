import type { DecisionRecord, SimulationGraph } from "./contracts";
import { workAssignments } from "./work-assignments";

export const workGraphs: SimulationGraph[] = workAssignments.map(assignment => {
  const nodes: SimulationGraph["nodes"] = {};
  assignment.tasks.forEach((work, index) => {
    const id = `work-${index + 1}`;
    nodes[id] = {
      id, title: work.title, situation: index === 0 ? assignment.brief : work.instruction,
      contexts: index === 0 ? ["technical", "planning"] : ["uncertainty", "failure"], difficulty: 2, work,
      decisions: [true, false].map(passed => ({
        id: `${id}-${passed ? "verified" : "review"}`, label: passed ? "Submit verified artifact" : "Submit artifact with open checks",
        signals: [], statePatch: { discoveredInformation: [`${id}:${passed ? "verified" : "review"}`] },
        consequences: [{ id: "work-reviewed", kind: passed ? "progress" : "caution", message: passed ? "Your artifact meets the assignment checks. The next situation introduces a new constraint." : "Some checks remain open. Your next review is a chance to recover; this does not determine your career suitability." }],
        next: index === 0 ? "work-2" : "handoff",
      })),
    };
  });
  nodes.handoff = {
    id: "handoff", title: "Choose the handoff boundary", situation: `You have prepared work for “${assignment.title}”. Review the saved artifacts before deciding what others can rely on.`, contexts: ["ethical", "planning"], difficulty: 2,
    decisions: [
      { id: "handoff-reviewed", label: "Share the artifact, open checks, and a specific next review", signals: [{ trait: "communication", direction: 1, weight: 1, context: "planning" }], consequences: [{ id: "handoff", kind: "team", message: "The next person receives both the work and its limits. Unresolved checks remain visible instead of becoming hidden assumptions." }], next: "done-review" },
      { id: "handoff-hold", label: "Hold use of the artifact until a colleague verifies it", signals: [{ trait: "ethical_reasoning", direction: 1, weight: 1, context: "ethical" }], consequences: [{ id: "handoff", kind: "learning", message: "You deferred use for another review. This adds waiting time but avoids treating an unchecked artifact as final." }], next: "done-hold" },
      { id: "handoff-release", label: "Release as final without communicating the remaining checks", signals: [{ trait: "communication", direction: -1, weight: 1, context: "planning" }], consequences: [{ id: "handoff", kind: "caution", message: "Others may rely on an incomplete picture. Revisit your saved checks before applying this work; even passing model checks does not establish real-world safety." }], next: "done-release" },
    ],
  };
  for (const ending of ["review", "hold", "release"]) nodes[`done-${ending}`] = { id: `done-${ending}`, title: "Assignment debrief", situation: "", contexts: [], difficulty: 1, decisions: [], terminal: true, terminalOutcome: ending === "hold" ? "feedback_conversation" : ending === "release" ? "practice_next_step" : "evidence_review" };
  return { id: `${assignment.careerId}-work-v1`, title: assignment.title, startNodeId: "work-1", nodes, nextStep: assignment.nextStep };
});

export function workDebrief(graph: SimulationGraph, history: DecisionRecord[]) {
  const receipts = history.flatMap(record => record.work ? [record.work] : []);
  if (!receipts.length) return null;
  const open = receipts.reduce((sum, receipt) => sum + receipt.checks.filter(check => !check.passed).length, 0);
  const handoff = history.at(-1)?.decisionId;
  const outcome = handoff === "handoff-hold" ? "You prepared the artifacts and held their use for colleague review. The handoff remains provisional."
    : handoff === "handoff-release" && open > 0 ? `You released work with ${open} unresolved checks without disclosing them. Reopen those checks before anyone relies on the artifact.`
    : handoff === "handoff-reviewed" ? `You handed over the artifacts with their limits visible. ${open ? `${open} checks still need follow-up.` : "The artifacts met the simplified assignment checks; real work would still require professional review."}`
    : `You have ${receipts.length} submitted artifacts and ${open} open checks. Review the record before treating the work as final.`;
  return { receipts, outcome, nextStep: graph.nextStep, note: "These are observations from a fictional work sample, not a validated assessment of aptitude. Passing the simplified checks is not professional approval." };
}
