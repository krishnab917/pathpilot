import { describe, expect, it } from "vitest";
import { buildRecommendationEvolutionPreview } from "../server/roadmap/recommendation-evolution";

const focus = { title: "Practice collaboration", description: "Test this in a project.", rationale: "This focus is based on 3 of your 3 most recent completed simulations; newer simulations contribute more to the summary." };

describe("optional recommendation evolution preview", () => {
  it("requires at least two observations and preserves every existing plan category", () => {
    const preview = buildRecommendationEvolutionPreview({ includedSimulationCount: 1, completedSimulationCount: 1, mostRecentCompletedAt: new Date("2026-08-15"), evolvingFocus: focus, evolvedRecommendationCount: 4, hasPendingEvolutionRecommendations: false });
    expect(preview.state).toBe("requires_more_simulations");
    expect(preview.preserves.join(" ")).toContain("Accepted recommendations, goals, roadmaps, and projects");
    expect(preview.exclusions.join(" ")).toContain("Response-time metadata");
  });

  it("makes a bounded, explainable optional set available without claiming prediction or automatic action", () => {
    const preview = buildRecommendationEvolutionPreview({ includedSimulationCount: 3, completedSimulationCount: 4, mostRecentCompletedAt: new Date("2026-08-15"), evolvingFocus: focus, evolvedRecommendationCount: 4, hasPendingEvolutionRecommendations: false });
    expect(preview).toMatchObject({ state: "ready", recommendationCount: 4, focus, includedSimulationCount: 3, completedSimulationCount: 4 });
    expect(preview.consideredInputs).toHaveLength(2);
    expect(JSON.stringify(preview)).not.toMatch(/predict|automatically replace|personality/i);
  });

  it("reports an existing optional set instead of replacing or duplicating it", () => {
    const preview = buildRecommendationEvolutionPreview({ includedSimulationCount: 3, completedSimulationCount: 3, mostRecentCompletedAt: new Date("2026-08-15"), evolvingFocus: focus, evolvedRecommendationCount: 4, hasPendingEvolutionRecommendations: true });
    expect(preview.state).toBe("already_added");
    expect(preview.detail).toContain("edit, add, or skip");
    expect(preview.preserves.join(" ")).toContain("Current pending recommendations");
  });
});
