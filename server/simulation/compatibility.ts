import type { BehavioralProfile, CompatibilityResult, ConfidenceLevel, TraitKey } from "./contracts";
import { traitLabel } from "./behavioral";

type CareerProfile = { aliases: string[]; requirements: Partial<Record<TraitKey, "core" | "meaningful" | "supportive">>; source: string };
const profiles: CareerProfile[] = [
  { aliases: ["software", "developer", "engineer"], requirements: { analytical_thinking: "core", problem_solving: "core", systems_thinking: "core", attention_to_detail: "core", collaboration: "meaningful", communication: "meaningful", adaptability: "meaningful", long_term_thinking: "supportive" }, source: "O*NET Software Developers: analysis, problem solving, teamwork, communication, planning, and information processing." },
  { aliases: ["data", "machine learning", "ai", "research"], requirements: { analytical_thinking: "core", problem_solving: "core", attention_to_detail: "core", systems_thinking: "meaningful", communication: "meaningful", long_term_thinking: "meaningful", adaptability: "supportive" }, source: "O*NET Data Scientists: analysis, model validation, reporting, and data-informed problem solving." },
  { aliases: ["product", "project manager", "program manager"], requirements: { communication: "core", collaboration: "core", systems_thinking: "core", ownership: "core", long_term_thinking: "meaningful", problem_solving: "meaningful", ethical_reasoning: "supportive" }, source: "O*NET IT Project Managers: coordination, communication, planning, resource monitoring, risk assessment, and problem solving." },
  { aliases: ["cyber", "security"], requirements: { analytical_thinking: "core", attention_to_detail: "core", ethical_reasoning: "meaningful", problem_solving: "meaningful", communication: "meaningful", long_term_thinking: "supportive" }, source: "Initial transparent technical profile; enrich with an occupation-specific source before expanding the catalog." },
];
const tierWeight = { core: 3, meaningful: 2, supportive: 1 } as const;
const confidenceRank = { low: 1, moderate: 2, high: 3 } as const;
const resolveProfile = (careerName: string) => profiles.find(profile => profile.aliases.some(alias => careerName.toLowerCase().includes(alias)));

export function calculateCareerCompatibility(careers: Array<{ name: string; matchScore: number }>, profile: BehavioralProfile): CompatibilityResult[] {
  const traitByKey = new Map(profile.traits.map(trait => [trait.trait, trait]));
  return careers.map((career): CompatibilityResult => {
    const careerProfile = resolveProfile(career.name);
    if (!careerProfile) return { careerName: career.name, score: career.matchScore, confidence: "low" as ConfidenceLevel, reason: "Your existing discovery match remains the available signal because this career does not yet have a detailed behavioral mapping in the simulation catalog.", alignedTraits: [], growthTraits: [], limitedMapping: true };
    const weighted = Object.entries(careerProfile.requirements).map(([trait, tier]) => ({ trait: trait as TraitKey, tier: tier!, observed: traitByKey.get(trait as TraitKey) }));
    const evidenceWeight = weighted.reduce((total, item) => total + (item.observed ? tierWeight[item.tier] : 0), 0);
    const denominator = weighted.reduce((total, item) => total + tierWeight[item.tier], 0);
    const behaviorScore = evidenceWeight ? Math.round(weighted.reduce((total, item) => total + (item.observed ? item.observed.score * tierWeight[item.tier] : 50 * tierWeight[item.tier]), 0) / denominator) : career.matchScore;
    const confidence = weighted.reduce<ConfidenceLevel>((best, item) => !item.observed || confidenceRank[item.observed.confidence] <= confidenceRank[best] ? best : item.observed.confidence, "low");
    const behavioralShare = confidence === "high" ? 0.35 : confidence === "moderate" ? 0.22 : 0.1;
    const score = Math.round(career.matchScore * (1 - behavioralShare) + behaviorScore * behavioralShare);
    const alignedTraits = weighted.filter(item => (item.observed?.score ?? 0) >= 58 && item.observed?.confidence !== "low").sort((a, b) => tierWeight[b.tier] - tierWeight[a.tier]).slice(0, 4).map(item => item.trait);
    const growthTraits = weighted.filter(item => (item.observed?.score ?? 50) < 50 && item.observed && item.observed.evidenceCount >= 2).sort((a, b) => tierWeight[b.tier] - tierWeight[a.tier]).slice(0, 3).map(item => item.trait);
    const reason = alignedTraits.length ? `${career.name} aligns with observed ${alignedTraits.map(traitLabel).join(", ")} in this simulation. ${careerProfile.source}` : `${career.name} remains informed primarily by your existing discovery profile while PathPilot gathers more decision evidence. ${careerProfile.source}`;
    return { careerName: career.name, score, confidence, reason, alignedTraits, growthTraits };
  }).sort((a, b) => b.score - a.score);
}
