export type PreliminaryFit = { careerName: string; score: number };

const normalizeCareer = (value: string) => value.trim().toLocaleLowerCase().replace(/\s+/g, " ");

export function buildRoadmapContextLabels(input: {
  roadmapCareer?: string | null;
  simulationCareer?: string | null;
  preliminaryFit?: PreliminaryFit | null;
  includedSimulationCount?: number | null;
  completedSimulationCount?: number | null;
}) {
  const roadmapCareer = input.roadmapCareer?.trim() || null;
  const simulationCareer = input.simulationCareer?.trim() || null;
  const fit = input.preliminaryFit && Number.isFinite(input.preliminaryFit.score)
    ? input.preliminaryFit
    : null;
  const fitSupportsRoadmap = Boolean(roadmapCareer && fit && normalizeCareer(roadmapCareer) === normalizeCareer(fit.careerName));
  const simulatedRoadmapCareer = Boolean(roadmapCareer && simulationCareer && normalizeCareer(roadmapCareer) === normalizeCareer(simulationCareer));
  const relationship = !roadmapCareer
    ? "Choose a roadmap career when you are ready. This simulation remains an exploration signal."
    : fitSupportsRoadmap
      ? `Your latest simulation adds evidence that can strengthen your ${roadmapCareer} roadmap. Your roadmap remains focused on ${roadmapCareer} unless you choose to change it.`
      : `The latest simulation explored ${simulationCareer ?? "a career environment"}. Your current roadmap remains ${roadmapCareer}. You can review the new recommendations below without changing your existing plan.`;
  const recommendationTitle = simulatedRoadmapCareer
    ? `Recommended for your ${roadmapCareer} roadmap`
    : `Explore based on your latest ${simulationCareer ?? "simulation"}`;
  const recommendationSource = simulatedRoadmapCareer
    ? "Current roadmap + latest simulation"
    : roadmapCareer
      ? `Latest simulation — ${simulationCareer ?? "selected simulation"}; current roadmap remains ${roadmapCareer}`
      : `Latest simulation — ${simulationCareer ?? "selected simulation"}`;
  const included = Math.max(0, input.includedSimulationCount ?? 0);
  const completed = Math.max(0, input.completedSimulationCount ?? 0);
  const coverage = completed
    ? `Coverage: ${included} of ${completed} completed simulations. More recent simulations contribute more heavily to this summary.`
    : "Coverage: No completed simulations are available for a multi-simulation summary yet.";

  return { roadmapCareer, simulationCareer, fit, relationship, recommendationTitle, recommendationSource, coverage };
}
