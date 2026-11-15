import { z } from "zod";
import { careerFields, careerTaxonomy, dimensions, environments, pathways, type Career, type CareerField, type Dimension } from "./career-taxonomy";

export const MAPPING_VERSION = "behavior-mapping-v2.0" as const;
export const signalSchema = z.object({
  version: z.literal(MAPPING_VERSION), id: z.string().min(1).max(160), context: z.string().min(1).max(160),
  dimension: z.enum(dimensions), source: z.enum(["observed", "self_report", "inferred_legacy"]),
  value: z.number().min(0).max(1), evidence: z.string().min(1).max(240),
  conflicting: z.boolean().default(false),
}).strict();
export type BehavioralSignal = z.infer<typeof signalSchema>;
export const matchingInputSchema = z.object({
  interests: z.array(z.string().max(100)).max(24).default([]),
  skills: z.array(z.string().max(100)).max(24).default([]),
  goals: z.array(z.string().max(100)).max(12).default([]),
  fields: z.array(z.enum(careerFields)).max(12).default([]),
  environments: z.array(z.enum(environments)).max(9).default([]),
  pathways: z.array(z.enum(pathways)).max(7).default([]),
  signals: z.array(signalSchema).max(250).default([]),
  overrides: z.partialRecord(z.enum(dimensions), z.number().min(0).max(1)).default({}),
  useInferences: z.boolean().default(true),
}).strict();
export type MatchingInput = z.input<typeof matchingInputSchema>;

const aliases: Record<string, string[]> = {
  cooking: ["culinary", "chef", "food", "baking"], baking: ["baker", "pastry"],
  coding: ["software", "programming"], art: ["design", "drawing", "animation"],
  building: ["construction", "carpenter", "civil"], teaching: ["teacher", "education", "instruction"],
  nursing: ["nurse", "care", "healthcare"], medicine: ["physician", "clinical", "healthcare"],
  finance: ["financial", "accounting"], helping: ["support", "service"],
  law: ["lawyer", "legal"], environment: ["environmental", "conservation"],
  sports: ["sport", "coaching"], music: ["musician", "performance"],
};
const tokens = (value: string) => value.toLowerCase().match(/[a-z0-9]+/g) ?? [];
function termStrength(term: string, career: Career) {
  const identity = new Set(tokens(`${career.name} ${career.subfield}`));
  const context = new Set(tokens([...career.interests, ...career.skills, ...career.responsibilities].join(" ")));
  const words = tokens(term).filter(token => !["a", "an", "the", "to", "in", "and", "with", "want", "learn"].includes(token));
  // Every meaningful word matters: one shared word must not equal a full specialty match.
  return words.reduce((sum, token) => sum + (identity.has(token) ? 1 : (aliases[token] ?? []).some(word => identity.has(word)) ? 0.9 : context.has(token) ? 0.65 : (aliases[token] ?? []).some(word => context.has(word)) ? 0.35 : 0), 0) / Math.max(1, words.length);
}
function sharedTerms(terms: string[], career: Career) {
  return Array.from(new Set(terms)).filter(term => termStrength(term, career) > 0);
}

export function summarizeSignals(raw: MatchingInput) {
  const input = matchingInputSchema.parse(raw);
  const unique = Array.from(new Map(input.signals.map(signal => [signal.id, signal])).values());
  return dimensions.map(dimension => {
    const evidence = unique.filter(signal => signal.dimension === dimension && (input.useInferences || signal.source === "self_report"));
    // Repeated events in one exercise cannot manufacture independent observations.
    const contexts = Array.from(new Set(evidence.map(signal => signal.context)));
    const values = contexts.map(context => {
      const items = evidence.filter(signal => signal.context === context);
      return items.reduce((sum, item) => sum + item.value, 0) / items.length;
    });
    const conflict = evidence.some(signal => signal.conflicting) || (evidence.some(signal => signal.value < 0.4) && evidence.some(signal => signal.value > 0.6));
    const overridden = input.overrides[dimension] !== undefined;
    const reports = evidence.filter(signal => signal.source === "self_report");
    // Stated preferences take priority; no prediction of an unobserved opposite preference.
    const value = overridden ? input.overrides[dimension]! : reports.length ? reports.at(-1)!.value : values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
    const observedContexts = new Set(evidence.filter(signal => signal.source === "observed").map(signal => signal.context)).size;
    return { dimension, value, conflict, overridden, contexts: contexts.length, evidence,
      confidence: value === null ? "unknown" as const : overridden || reports.length ? "self-reported" as const : observedContexts >= 2 && !conflict ? "building" as const : "limited" as const };
  });
}

export function rankCareers(raw: MatchingInput, catalogue: readonly Career[] = careerTaxonomy) {
  const input = matchingInputSchema.parse(raw);
  const summary = summarizeSignals(input);
  return catalogue.map(career => {
    const reasons: string[] = [];
    const cautions: string[] = [];
    const components: { name: string; value: number; weight: number }[] = [];
    const interestTerms = sharedTerms(input.interests, career);
    if (input.interests.length || input.fields.length) {
      const field = input.fields.includes(career.field);
      const score = Math.max(field ? 1 : 0, input.interests.reduce((sum, term) => sum + termStrength(term, career), 0) / Math.max(1, input.interests.length));
      components.push({ name: "interests", value: score, weight: 0.45 });
      if (field) reasons.push("You selected this field to explore.");
      if (interestTerms.length) reasons.push(`Your stated interests: ${interestTerms.join(", ")}.`);
    }
    for (const [name, terms, weight] of [["skills", input.skills, 0.1], ["goals", input.goals, 0.15]] as const) {
      if (!terms.length) continue;
      const matches = sharedTerms([...terms], career);
      components.push({ name, value: terms.reduce((sum, term) => sum + termStrength(term, career), 0) / terms.length, weight });
      if (matches.length) reasons.push(`Your self-reported ${name}: ${matches.join(", ")}.`);
    }
    if (input.environments.length) {
      const aligned = input.environments.some(environment => career.environments.includes(environment));
      components.push({ name: "environment", value: aligned ? 1 : 0, weight: 0.1 });
      if (aligned) reasons.push("Includes a work setting you selected.");
      else cautions.push("The typical setting differs from your selection; settings vary by role.");
    }
    if (input.pathways.length) {
      const aligned = input.pathways.some(pathway => career.pathways.includes(pathway));
      components.push({ name: "pathways", value: aligned ? 1 : 0, weight: 0.1 });
      if (aligned) reasons.push("Includes a training route you are willing to consider.");
      else cautions.push("Listed training routes differ from your current preference. Check local requirements.");
    }
    const known = summary.filter(signal => signal.value !== null);
    if (known.length) {
      // Shrink single-context and contradictory observations toward neutral. Counts never inflate fit.
      const score = known.reduce((sum, signal) => {
        const reliability = signal.overridden || signal.confidence === "self-reported" ? 1 : signal.conflict ? 0.2 : signal.confidence === "building" ? 0.6 : 0.25;
        return sum + 0.5 + (signal.value! - 0.5) * (career.dimensions[signal.dimension] - 0.5) * 2 * reliability;
      }, 0) / known.length;
      components.push({ name: "behavior", value: score, weight: 0.1 });
      for (const signal of known.filter(signal => career.workStyles.includes(signal.dimension)).slice(0, 2)) {
        if (signal.overridden) reasons.push(`You set your ${signal.dimension} preference to ${signal.value! === 0.5 ? "neutral" : signal.value! > 0.5 ? "more" : "less"}.`);
        else if (signal.evidence.length) reasons.push(`${signal.dimension}: ${signal.evidence[0].evidence}`);
        if (signal.conflict) cautions.push(`Mixed evidence for ${signal.dimension}; this contributes less to the comparison.`);
      }
    }
    const weight = components.reduce((sum, component) => sum + component.weight, 0);
    const score = weight ? Math.round(100 * components.reduce((sum, component) => sum + component.value * component.weight, 0) / weight) : null;
    // Confidence uses the same deduplicated evidence as the score. Replayed IDs,
    // unrelated single observations and overridden inferences cannot inflate it.
    const buildingEvidence = summary.some(signal => signal.confidence === "building");
    return { career, score, version: MAPPING_VERSION, reasons: reasons.length ? reasons : ["A direction to investigate; no matching evidence has been supplied for this career."], cautions,
      confidence: !weight ? "unknown" as const : buildingEvidence && !summary.some(signal => signal.conflict) ? "building" as const : "limited" as const,
      components, missingDimensions: summary.filter(signal => signal.value === null).map(signal => signal.dimension) };
  }).sort((a, b) => (b.score ?? 50) - (a.score ?? 50) || a.career.id.localeCompare(b.career.id));
}
export type CareerRanking = ReturnType<typeof rankCareers>[number];

/** Diversity affects presentation only; the independent scores remain visible. */
export function discoverySuggestions(ranked: CareerRanking[], count = 6) {
  const selected: CareerRanking[] = [];
  const fields = new Map<CareerField, number>();
  for (const result of ranked) {
    if ((fields.get(result.career.field) ?? 0) >= 2) continue;
    selected.push(result); fields.set(result.career.field, (fields.get(result.career.field) ?? 0) + 1);
    if (selected.length >= count) break;
  }
  return selected;
}

// Legacy scores are inferences, never reconstructed observations. No records are rewritten.
export function legacySignals(summary: { traits: { trait: string; score: number; consistency: string }[] } | null | undefined): BehavioralSignal[] {
  const mapping: Record<string, Dimension> = { analytical_thinking: "investigation", problem_solving: "investigation", systems_thinking: "abstract", collaboration: "collaboration", communication: "communication", adaptability: "adaptation", long_term_thinking: "planning" };
  return (summary?.traits ?? []).flatMap(trait => {
    const dimension = mapping[trait.trait];
    if (!dimension || !Number.isFinite(trait.score) || trait.score < 0 || trait.score > 100) return [];
    return [signalSchema.parse({ version: MAPPING_VERSION, id: `legacy:${trait.trait}`, context: "legacy-summary", source: "inferred_legacy", dimension, value: trait.score / 100, conflicting: trait.consistency === "varied", evidence: `Earlier simulation summary for ${trait.trait.replaceAll("_", " ")} (${trait.consistency}). This is an inference from recorded decisions, not a stated preference.` })];
  });
}
