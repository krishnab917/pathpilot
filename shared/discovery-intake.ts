import { z } from "zod";
import { careerFields, dimensions, fieldDetails, pathways, type CareerField } from "./career-taxonomy";
import { rankCareers, type MatchingInput, type BehavioralSignal } from "./career-matching";

export const motivationOptions = ["Financial stability", "Creativity", "Helping others", "Intellectual challenge", "Leadership", "Independence", "Work-life balance", "Innovation", "Building tangible things"] as const;
const textList = z.array(z.string().trim().min(1).max(80)).max(12);
export const discoveryIntakeSchema = z.object({
  version: z.literal("discovery-intake-v1"),
  fields: z.array(z.enum(careerFields)).max(12).default([]),
  preferences: z.partialRecord(z.enum(dimensions), z.union([z.literal(0), z.literal(0.5), z.literal(1)])).default({}),
  motivations: z.array(z.enum(motivationOptions)).max(9).default([]),
  subjects: textList.default([]),
  pathways: z.array(z.enum(pathways)).max(7).default([]),
  direction: z.enum(["open", "ideas"]).default("open"),
  careers: textList.default([]),
}).strict();
export type DiscoveryIntake = z.infer<typeof discoveryIntakeSchema>;
export const emptyIntake = (): DiscoveryIntake => discoveryIntakeSchema.parse({ version: "discovery-intake-v1" });
export function readIntake(value: unknown): DiscoveryIntake | null {
  const parsed = discoveryIntakeSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
export const draftProfileSchema = z.object({
  grade: z.string().max(16), location: z.string().max(160),
  countryCode: z.string().regex(/^[A-Z]{2}$/).nullable().optional(),
  educationSystem: z.string().max(180).nullable().optional(),
  interests: textList, skills: textList, activities: textList, careerPreferences: textList,
  discoveryIntake: discoveryIntakeSchema.optional(),
}).strict();
export const completedProfileSchema = draftProfileSchema.extend({
  grade: z.string().trim().min(1).max(16), location: z.string().trim().min(2).max(160),
  countryCode: z.string().regex(/^[A-Z]{2}$/), educationSystem: z.string().trim().min(2).max(180),
});
export type IntakeProfile = z.infer<typeof draftProfileSchema>;

/** Adapt explicit answers only. Motives such as income/balance are not proxies for occupational outcomes. */
export function intakeMatchingInput(profile: Partial<IntakeProfile>, signals: BehavioralSignal[] = []): MatchingInput {
  const intake = readIntake(profile.discoveryIntake);
  return {
    interests: Array.from(new Set([...(profile.interests ?? []), ...(intake?.subjects ?? [])])).slice(0, 24),
    skills: Array.from(new Set(profile.skills ?? [])), goals: Array.from(new Set(intake?.direction === "ideas" ? intake.careers : profile.careerPreferences ?? [])),
    fields: Array.from(new Set(intake?.fields ?? [])), pathways: Array.from(new Set(intake?.pathways ?? [])),
    overrides: intake?.preferences ?? {}, signals,
  };
}

/** Presentation aggregation, not another scorer: one best existing-engine result per field. */
export function startingFields(input: MatchingInput) {
  const ranked = rankCareers(input);
  const seen = new Set<CareerField>();
  return ranked.filter(item => { if (seen.has(item.career.field)) return false; seen.add(item.career.field); return true; }).slice(0, 4).map(item => ({
    field: item.career.field, label: fieldDetails[item.career.field].label,
    career: item.career, reasons: item.reasons, cautions: item.cautions,
    evidence: item.score === null ? "Exploratory starting point" : item.confidence === "building" ? "Repeated observations available" : "Limited information",
    missing: item.missingDimensions,
    nextStep: item.career.nextSteps[0],
  }));
}
