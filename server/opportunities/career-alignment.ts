import { careerFields, careerTaxonomy, fieldDetails, resolveDiscoveryCareer, type CareerField } from "../../shared/career-taxonomy";
import { readIntake } from "../../shared/discovery-intake";

// Compatibility with organizer tags already stored in career_domains. These are
// broad subject connections, not evidence that a listing fits a specific job.
const legacyTags: Record<CareerField, readonly string[]> = {
  technology: ["engineering"], healthcare: ["science"], business: [],
  creative: ["design"], hospitality: [], trades: ["engineering"],
  education: ["social-impact"], "public-service": ["social-impact"],
  "human-services": ["social-impact"], environment: ["science"],
  transport: [], sport: [],
};
const interestTerms: Record<CareerField, readonly string[]> = {
  technology: ["computing", "computers", "programming", "engineering", "mathematics", "hackathon", "hackathons", "coding"],
  healthcare: ["medicine", "nursing", "health care", "biology", "life sciences"],
  business: ["finance", "entrepreneurship", "marketing"],
  creative: ["arts", "art", "design", "media", "music", "entertainment"],
  hospitality: ["culinary", "cooking", "baking", "food services"],
  trades: ["skilled trades", "construction", "manufacturing"],
  education: ["teaching", "academic research"],
  "public-service": ["law", "government", "public service"],
  "human-services": ["psychology", "social services", "human services", "counseling"],
  environment: ["agriculture", "sustainability", "natural resources", "ecology", "climate", "environmental"],
  transport: ["transportation", "aviation", "logistics"],
  sport: ["sports", "recreation", "fitness"],
};
const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const containsPhrase = (text: string, phrase: string) => ` ${normalize(text)} `.includes(` ${normalize(phrase)} `);

export function opportunityFieldsForInterest(value: string): CareerField[] {
  const exact = resolveDiscoveryCareer(value);
  if (exact) return [exact.field];
  return careerFields.filter(field =>
    [field, fieldDetails[field].label, ...interestTerms[field]].some(term => containsPhrase(value, term)) ||
    careerTaxonomy.some(career => career.field === field &&
      [career.name, career.subfield].some(term => containsPhrase(value, term))));
}

export function opportunityTagsForFields(fields: readonly CareerField[]): string[] {
  return Array.from(new Set(fields.flatMap(field => [field, ...legacyTags[field]])));
}

export function careerDomainsFor(value: string): string[] {
  const tags = new Set(opportunityTagsForFields(opportunityFieldsForInterest(value)));
  const career = resolveDiscoveryCareer(value);
  const text = career ? `${career.name} ${career.subfield}` : value;
  // Preserve narrower historical subject connections within broad fields.
  if (/\b(scientist|scientific|science|physics|chemistry|biology)\b/i.test(text)) tags.add("science");
  if (/\b(architect|architecture)\b/i.test(text)) tags.add("engineering");
  return Array.from(tags);
}

export function opportunityAlignment(profile: {
  interests?: string[]; careerPreferences?: string[]; discoveryIntake?: unknown;
} | null, savedDirections: string[]) {
  const intake = readIntake(profile?.discoveryIntake);
  const careerDirections = Array.from(new Set([
    ...savedDirections, ...(profile?.careerPreferences ?? []),
    ...(intake?.direction === "ideas" ? intake.careers : []),
  ].filter(value => typeof value === "string" && value.trim())));
  const fields = Array.from(new Set([
    ...(intake?.fields ?? []),
    ...[...careerDirections, ...(profile?.interests ?? []), ...(intake?.subjects ?? [])]
      .filter(value => typeof value === "string").flatMap(opportunityFieldsForInterest),
  ]));
  const domains = Array.from(new Set([
    ...opportunityTagsForFields(fields),
    ...[...careerDirections, ...(profile?.interests ?? []), ...(intake?.subjects ?? [])]
      .filter(value => typeof value === "string").flatMap(careerDomainsFor),
  ]));
  return { careerDirections, fields, domains };
}
