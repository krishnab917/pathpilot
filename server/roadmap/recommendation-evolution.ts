export const EVOLUTION_CONTEXT_VERSION = "evolution-v1";

type EvolutionPreviewInput = {
  includedSimulationCount: number;
  completedSimulationCount: number;
  mostRecentCompletedAt: Date | null;
  evolvingFocus: { title: string; description: string; rationale: string } | null;
  evolvedRecommendationCount: number;
  hasPendingEvolutionRecommendations: boolean;
};

export function buildRecommendationEvolutionPreview(input: EvolutionPreviewInput) {
  const eligible = input.includedSimulationCount >= 2 && Boolean(input.evolvingFocus);
  if (!eligible) return {
    state: "requires_more_simulations" as const,
    title: "More scenario observations are needed",
    detail: "Complete at least two work simulations before creating a separate, optional evolved recommendation set. Your current recommendations and plan remain unchanged.",
    includedSimulationCount: input.includedSimulationCount,
    completedSimulationCount: input.completedSimulationCount,
    mostRecentCompletedAt: input.mostRecentCompletedAt,
    consideredInputs: [] as string[],
    exclusions: ["Response-time metadata", "Raw decisions and behavioral evidence", "Planning activity, goals, projects, mentor content, and recommendations"],
    preserves: ["Current pending recommendations", "Accepted recommendations, goals, roadmaps, and projects"],
  };
  if (input.hasPendingEvolutionRecommendations) return {
    state: "already_added" as const,
    title: "Optional evolved recommendations are already available",
    detail: "The separate evolved suggestions remain optional. You can edit, add, or skip each one individually; your baseline recommendations and saved plan remain available.",
    includedSimulationCount: input.includedSimulationCount,
    completedSimulationCount: input.completedSimulationCount,
    mostRecentCompletedAt: input.mostRecentCompletedAt,
    focus: input.evolvingFocus!,
    consideredInputs: [`A bounded summary of ${input.includedSimulationCount} recent completed simulations`, "The optional learning focus shown in your simulation observation detail"],
    exclusions: ["Response-time metadata", "Raw decisions and behavioral evidence", "Planning activity, goals, projects, mentor content, and existing recommendations"],
    preserves: ["Current pending recommendations", "Accepted recommendations, goals, roadmaps, and projects"],
    recommendationCount: input.evolvedRecommendationCount,
  };
  return {
    state: "ready" as const,
    title: "Optionally add an evolved recommendation set",
    detail: "You can create a separate set of pending suggestions informed by the stated simulation summary. This adds choices; it does not replace anything you have saved.",
    includedSimulationCount: input.includedSimulationCount,
    completedSimulationCount: input.completedSimulationCount,
    mostRecentCompletedAt: input.mostRecentCompletedAt,
    focus: input.evolvingFocus!,
    consideredInputs: [`A bounded summary of ${input.includedSimulationCount} recent completed simulations`, "The optional learning focus shown in your simulation observation detail"],
    exclusions: ["Response-time metadata", "Raw decisions and behavioral evidence", "Planning activity, goals, projects, mentor content, and existing recommendations"],
    preserves: ["Current pending recommendations", "Accepted recommendations, goals, roadmaps, and projects"],
    recommendationCount: input.evolvedRecommendationCount,
  };
}
