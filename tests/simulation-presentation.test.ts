import { describe, expect, it } from "vitest";
import { getSimulationGraph } from "../server/simulation/engine";
import { buildDecisionReview } from "../server/simulation/presentation";

describe("simulation decision review", () => {
  it("maps persisted decision records and consequences to a student-safe review trail", () => {
    const graph = getSimulationGraph("UX Designer");
    const review = buildDecisionReview(graph, [{ nodeId: "design-feedback-alert", decisionId: "gather-evidence", contexts: ["uncertainty"], difficulty: 2, selectedAt: "2026-08-16T00:00:00.000Z" }], [{ id: "one", nodeId: "design-feedback-alert", decisionId: "gather-evidence", message: "The team now has clearer evidence to discuss, though the time window is tighter.", kind: "learning", contexts: ["uncertainty"], occurredAt: "2026-08-16T00:00:00.000Z" }]);
    expect(review).toEqual([expect.objectContaining({ step: 1, decisionLabel: expect.stringContaining("Review the"), consequence: expect.objectContaining({ kind: "learning" }) })]);
    expect(JSON.stringify(review)).not.toContain("signals");
    expect(JSON.stringify(review)).not.toContain("weight");
  });
});
