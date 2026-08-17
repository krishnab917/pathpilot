import { describe, expect, it } from "vitest";
import { buildMentorPlanningContext } from "../server/mentor-context";

describe("mentor planning context", () => {
  it("uses only a bounded transparent behavior summary and neutral timeline labels", () => {
    const context = buildMentorPlanningContext({
      behaviorEvolution: {
        completedSimulationCount: 4,
        includedSimulationCount: 3,
        method: "Newest simulations receive more weight.",
        simulations: [],
        traits: [{ trait: "problem_solving", label: "problem solving", score: 72, consistency: "consistent", observations: 3 }],
        strongestTraits: ["problem_solving"],
        evolvingFocus: { title: "Practice problem solving", description: "Test it.", rationale: "This focus is based on 3 of your 3 most recent completed simulations." },
      },
      planningActivity: [{ id: "11111111-1111-4111-8111-111111111111", eventType: "project_progress_updated", subjectType: "project", title: "Updated project progress", detail: "Ignored detail", createdAt: new Date("2026-08-17T00:00:00Z") }],
    });

    expect(context).toContain("based on the 3 most recent completed simulations");
    expect(context).toContain("problem solving (consistent across 3 included simulations)");
    expect(context).toContain("Updated project progress");
    expect(context).not.toContain("Ignored detail");
    expect(context).toMatch(/not a personality assessment, diagnosis, motivation score, career prediction/i);
    expect(context).toMatch(/do not infer motivation, ability, personality, or likely career outcomes/i);
  });

  it("keeps missing context explicit rather than inventing an interpretation", () => {
    const context = buildMentorPlanningContext({ behaviorEvolution: null, planningActivity: [] });
    expect(context).toContain("Cross-simulation learning summary: not yet available.");
    expect(context).toContain("Recent planning activity: not yet available.");
  });
});
