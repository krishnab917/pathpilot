export const crossProductEvidencePolicy = {
  purpose: "A read-only reflection-context summary that helps a student see which private record categories are available together.",
  allowedSources: [
    "A bounded count of the student’s completed adaptive simulations.",
    "A bounded count of the student’s recorded planning-activity entries.",
  ],
  prohibitedSources: [
    "Simulation choices, behavioral evidence, behavioral events, profiles, scores, compatibility, terminal outcomes, and response-time metadata.",
    "Planning-activity titles or metadata; goal, project, roadmap, opportunity, mentor, portfolio, recommendation, profile, or authentication content.",
  ],
  guardrails: [
    "Derived signals are availability indicators only; they do not assess personality, ability, motivation, readiness, fit, or likely outcomes.",
    "The summary creates no automatic recommendation, roadmap, score, alert, or data change.",
    "Raw records remain in their existing user-owned sources and are not copied into this summary.",
  ],
} as const;

export function buildCrossProductEvidenceSummary(input: { completedSimulationCount: number; planningActivityCount: number }) {
  const completedSimulationCount = Math.max(0, Math.min(5, Math.floor(input.completedSimulationCount)));
  const planningActivityCount = Math.max(0, Math.min(12, Math.floor(input.planningActivityCount)));
  return {
    policy: crossProductEvidencePolicy,
    availability: {
      completedSimulationCount,
      planningActivityCount,
      reflectionContextAvailable: completedSimulationCount > 0 && planningActivityCount > 0,
    },
  };
}
