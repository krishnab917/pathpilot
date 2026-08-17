export type OpportunityRelevanceRecord = {
  careerDomains: string[];
  countryCodes: string[];
  eligibleGrades: string[];
};

export type OpportunityRelevanceContext = {
  careerDirections: string[];
  careerDomains: string[];
  countryCode: string | null;
  grade: string | null;
};

export const opportunityRelevanceMethod = "Order uses your saved career directions and organizer-published country and grade details. It does not use behavioral signals, mentor content, predictions, or a personal score.";

const normalized = (value: string) => value.trim().toLocaleLowerCase();

export function explainOpportunityRelevance(record: OpportunityRelevanceRecord, context: OpportunityRelevanceContext) {
  const reasons: string[] = [];
  const hasDirectionMatch = record.careerDomains.some(domain => context.careerDomains.includes(domain));
  if (hasDirectionMatch && context.careerDirections.length === 1) reasons.push(`Aligned with your saved career direction: ${context.careerDirections[0]}.`);
  else if (hasDirectionMatch) reasons.push("Aligned with one or more of your saved career directions.");

  if (context.countryCode && record.countryCodes.map(normalized).includes(normalized(context.countryCode))) reasons.push("The organizer lists availability in your selected country.");
  if (context.grade && record.eligibleGrades.map(normalized).includes(normalized(context.grade))) reasons.push("The organizer lists your current grade.");
  return reasons;
}
