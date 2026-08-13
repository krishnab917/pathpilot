import type { BehavioralEvidence, BehavioralProfile, ConfidenceLevel, ContextObservation, ContextTag, TraitKey, TraitResult } from "./contracts";

const labels: Record<TraitKey, string> = { analytical_thinking: "analytical thinking", problem_solving: "problem solving", systems_thinking: "systems thinking", attention_to_detail: "attention to detail", collaboration: "collaboration", communication: "communication", ownership: "ownership", adaptability: "adaptability", ethical_reasoning: "ethical reasoning", long_term_thinking: "long-term thinking" };
const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
const scoreEvidence = (items: BehavioralEvidence[]) => {
  const signed = items.reduce((total, item) => total + item.direction * item.weight * item.difficulty, 0);
  const magnitude = items.reduce((total, item) => total + item.weight * item.difficulty, 0);
  return clamp(50 + (signed / (magnitude + 12)) * 50);
};
const confidenceFor = (items: BehavioralEvidence[]): ConfidenceLevel => {
  const contexts = new Set(items.map(item => item.context)).size;
  const directions = items.map(item => item.direction);
  const consistency = Math.max(directions.filter(direction => direction === 1).length, directions.filter(direction => direction === -1).length) / Math.max(1, directions.length);
  const difficulty = items.reduce((total, item) => total + item.difficulty, 0);
  if (items.length >= 3 && contexts >= 2 && consistency >= 0.67 && difficulty >= 6) return "high";
  if (items.length >= 2 && consistency >= 0.5) return "moderate";
  return "low";
};

export function buildBehavioralProfile(evidence: BehavioralEvidence[]): BehavioralProfile {
  const traits: TraitResult[] = [];
  for (const trait of ["analytical_thinking", "problem_solving", "systems_thinking", "attention_to_detail", "collaboration", "communication", "ownership", "adaptability", "ethical_reasoning", "long_term_thinking"] as TraitKey[]) {
    const items = evidence.filter(item => item.trait === trait);
    if (!items.length) continue;
    traits.push({ trait, score: scoreEvidence(items), confidence: confidenceFor(items), evidenceCount: items.length, contexts: Array.from(new Set(items.map(item => item.context))) });
  }
  const contextObservations: ContextObservation[] = [];
  for (const trait of traits) for (const context of trait.contexts) {
    const items = evidence.filter(item => item.trait === trait.trait && item.context === context);
    contextObservations.push({ trait: trait.trait, context, score: scoreEvidence(items), confidence: confidenceFor(items) });
  }
  const patterns: string[] = [];
  const find = (trait: TraitKey) => traits.find(item => item.trait === trait);
  if ((find("analytical_thinking")?.score ?? 0) >= 60 && evidence.some(item => item.trait === "analytical_thinking" && item.context === "uncertainty" && item.direction === 1)) patterns.push("In this simulation, you tended to gather evidence before committing when information was incomplete.");
  if ((find("collaboration")?.score ?? 0) >= 60 && evidence.some(item => item.trait === "collaboration" && item.context === "interpersonal" && item.direction === 1)) patterns.push("In this simulation, you used collaboration to move a difficult decision forward.");
  if ((find("long_term_thinking")?.score ?? 0) >= 60) patterns.push("In this simulation, you considered how short-term choices could affect future work.");
  if ((find("ethical_reasoning")?.score ?? 0) >= 60) patterns.push("In this simulation, you made room for the impact of decisions on affected people.");
  const contradictions: string[] = [];
  for (const trait of traits) {
    const values = contextObservations.filter(item => item.trait === trait.trait);
    const highest = values.reduce<ContextObservation | undefined>((best, item) => !best || item.score > best.score ? item : best, undefined);
    const lowest = values.reduce<ContextObservation | undefined>((best, item) => !best || item.score < best.score ? item : best, undefined);
    if (highest && lowest && highest.context !== lowest.context && highest.score - lowest.score >= 18) contradictions.push(`Your ${labels[trait.trait]} appeared context-dependent: stronger in ${highest.context.replaceAll("_", " ")} than in ${lowest.context.replaceAll("_", " ")} situations in this simulation.`);
  }
  const sorted = [...traits].sort((a, b) => b.score - a.score);
  return { traits, patterns, contradictions, contextObservations, strongestTraits: sorted.filter(item => item.score >= 60 && item.confidence !== "low").slice(0, 4).map(item => item.trait), developmentTraits: [...traits].sort((a, b) => a.score - b.score).filter(item => item.score < 50 && item.evidenceCount >= 2).slice(0, 3).map(item => item.trait) };
}

export const traitLabel = (trait: TraitKey) => labels[trait];
