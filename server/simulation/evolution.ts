import type { BehavioralProfile, TraitKey } from "./contracts";

export type CompletedSimulationBehavior = { id: string; career: string; completedAt: Date | null; behavioralProfile: BehavioralProfile | null };
const traitLabels: Record<TraitKey, string> = { analytical_thinking: "analytical thinking", problem_solving: "problem solving", systems_thinking: "systems thinking", attention_to_detail: "attention to detail", collaboration: "collaboration", communication: "communication", ownership: "ownership", adaptability: "adaptability", ethical_reasoning: "ethical reasoning", long_term_thinking: "long-term thinking" };
const weights = [1, 0.85, 0.7, 0.55, 0.4] as const;

export type BehaviorEvolution = {
  completedSimulationCount: number;
  includedSimulationCount: number;
  method: string;
  simulations: Array<{ id: string; career: string; completedAt: Date | null; recencyWeight: number }>;
  traits: Array<{ trait: TraitKey; label: string; score: number; consistency: "consistent" | "varied"; observations: number }>;
  strongestTraits: TraitKey[];
  evolvingFocus: { title: string; description: string; rationale: string } | null;
};

export function buildBehaviorEvolution(all: CompletedSimulationBehavior[]): BehaviorEvolution | null {
  const simulations = [...all].filter(item => item.behavioralProfile).sort((a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0)).slice(0, weights.length);
  if (!simulations.length) return null;
  const values = new Map<TraitKey, Array<{ score: number; weight: number }>>();
  simulations.forEach((simulation, index) => simulation.behavioralProfile!.traits.forEach(trait => {
    values.set(trait.trait, [...(values.get(trait.trait) ?? []), { score: trait.score, weight: weights[index] }]);
  }));
  const traits = Array.from(values.entries()).map(([trait, entries]) => {
    const denominator = entries.reduce((sum, item) => sum + item.weight, 0);
    const score = Math.round(entries.reduce((sum, item) => sum + item.score * item.weight, 0) / denominator);
    const spread = Math.max(...entries.map(item => item.score)) - Math.min(...entries.map(item => item.score));
    return { trait, label: traitLabels[trait], score, consistency: (entries.length < 2 || spread <= 18 ? "consistent" : "varied") as "consistent" | "varied", observations: entries.length };
  }).sort((a, b) => b.score - a.score || b.observations - a.observations);
  const strongestTraits = traits.filter(item => item.score >= 58).slice(0, 3).map(item => item.trait);
  const leading = traits[0];
  const evolvingFocus = leading ? { title: `Practice ${leading.label}`, description: simulations.length === 1 ? "Complete another career simulation to see whether this learning signal repeats in a different context." : `Use one small project or experience to test how ${leading.label} shows up in a new setting.`, rationale: simulations.length === 1 ? "This is an initial signal from one completed simulation, not a stable conclusion." : `This focus is based on ${leading.observations} of your ${simulations.length} most recent completed simulations; newer simulations contribute more to the summary.` } : null;
  return { completedSimulationCount: all.filter(item => item.behavioralProfile).length, includedSimulationCount: simulations.length, method: "The five most recent completed simulations are included. The newest contributes 1.00 weight; each earlier simulation contributes less (0.85, 0.70, 0.55, then 0.40). This is a learning summary, not a personality or career prediction.", simulations: simulations.map((item, index) => ({ id: item.id, career: item.career, completedAt: item.completedAt, recencyWeight: weights[index] })), traits: traits.slice(0, 6), strongestTraits, evolvingFocus };
}
