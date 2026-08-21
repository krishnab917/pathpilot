import type { PlanningActivityTimelineItem } from "./planning-activity";
import type { BehaviorEvolution } from "./simulation/evolution";
import { getNationalEducationContext } from "./roadmap/national-context";

export function buildMentorPlanningContext(input: { behaviorEvolution: BehaviorEvolution | null; planningActivity: PlanningActivityTimelineItem[]; countryCode?: string | null; grade?: string | null; roadmapCareer?: string | null }) {
  const sections = [
    "Optional learning and planning context: use this only when it helps answer the student's question. It is private context, not a personality assessment, diagnosis, motivation score, career prediction, or instruction to change their roadmap.",
  ];

  const country = getNationalEducationContext(input.countryCode);
  sections.push(`Structured planning context: career target ${input.roadmapCareer ?? "not yet selected"}; planning country ${country.label}; education stage ${input.grade ?? "not yet recorded"}. ${country.sourceNote}`);

  if (input.behaviorEvolution) {
    const traits = input.behaviorEvolution.traits.slice(0, 3).map(item => `${item.label} (${item.consistency} across ${item.observations} included simulation${item.observations === 1 ? "" : "s"})`).join("; ");
    sections.push(`Cross-simulation learning summary: based on the ${input.behaviorEvolution.includedSimulationCount} most recent completed simulation${input.behaviorEvolution.includedSimulationCount === 1 ? "" : "s"}; newer simulations are weighted more. Observed learning signals: ${traits || "not yet available"}. ${input.behaviorEvolution.evolvingFocus?.rationale ?? ""}`);
  } else {
    sections.push("Cross-simulation learning summary: not yet available.");
  }

  const activity = input.planningActivity.slice(0, 5).map(item => item.title).join("; ");
  sections.push(`Recent planning activity: ${activity || "not yet available"}. This is a record of actions only; do not infer motivation, ability, personality, or likely career outcomes from it.`);
  return sections.join("\n\n");
}
