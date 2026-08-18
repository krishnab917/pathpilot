import { simulationCareerCatalog } from "./catalog";
import type { BehavioralProfile, CompatibilityResult, ConfidenceLevel, TraitKey } from "./contracts";
import { traitLabel } from "./behavioral";

const tierWeight = { core: 3, meaningful: 2, supportive: 1 } as const;
const confidenceRank = { low: 1, moderate: 2, high: 3 } as const;

export function calculateCareerCompatibility(profile: BehavioralProfile, discoveryMatches: Array<{ name: string; matchScore: number }> = []): CompatibilityResult[] {
  const traitByKey = new Map(profile.traits.map(trait => [trait.trait, trait]));
  const discoveryByName = new Map(discoveryMatches.map(match => [match.name.toLowerCase(), match.matchScore]));
  return simulationCareerCatalog.map((career): CompatibilityResult => {
    const baselineScore = discoveryByName.get(career.name.toLowerCase()) ?? 50;
    const weighted = Object.entries(career.behavioralRequirements).map(([trait, tier]) => ({ trait: trait as TraitKey, tier: tier!, observed: traitByKey.get(trait as TraitKey) }));
    const evidenceWeight = weighted.reduce((total, item) => total + (item.observed ? tierWeight[item.tier] : 0), 0);
    const denominator = weighted.reduce((total, item) => total + tierWeight[item.tier], 0);
    const behaviorScore = evidenceWeight ? Math.round(weighted.reduce((total, item) => total + (item.observed ? item.observed.score * tierWeight[item.tier] : 50 * tierWeight[item.tier]), 0) / denominator) : baselineScore;
    const confidence = weighted.reduce<ConfidenceLevel>((best, item) => !item.observed || confidenceRank[item.observed.confidence] <= confidenceRank[best] ? best : item.observed.confidence, "low");
    const behavioralShare = confidence === "high" ? 0.35 : confidence === "moderate" ? 0.22 : 0.1;
    const score = Math.round(baselineScore * (1 - behavioralShare) + behaviorScore * behavioralShare);
    const alignedTraits = weighted.filter(item => (item.observed?.score ?? 0) >= 58 && item.observed?.confidence !== "low").sort((a, b) => tierWeight[b.tier] - tierWeight[a.tier]).slice(0, 4).map(item => item.trait);
    const growthTraits = weighted.filter(item => (item.observed?.score ?? 50) < 50 && item.observed && item.observed.evidenceCount >= 2).sort((a, b) => tierWeight[b.tier] - tierWeight[a.tier]).slice(0, 3).map(item => item.trait);
    const reason = alignedTraits.length ? `${career.name} aligns with observed ${alignedTraits.map(traitLabel).join(", ")} in this simulation. This is a preliminary comparison across PathPilot's supported career catalog, not a prediction.` : `${career.name} remains a preliminary comparison while PathPilot gathers more decision evidence. This simulation's environment does not determine which careers can be considered.`;
    return { careerName: career.name, score, confidence, reason, alignedTraits, growthTraits };
  }).sort((a, b) => b.score - a.score);
}
