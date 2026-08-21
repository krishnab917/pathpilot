import { getNationalEducationContext } from "./national-context";
import { actionIsCovered, getCareerRequirementActions, metadataForAction, type CareerRecommendationMetadata } from "./career-requirements";

export type RoadmapRecommendationDraft = {
  phase: string;
  title: string;
  description: string;
  rationale: string;
  category: "skill" | "project" | "experience";
  priority: "low" | "medium" | "high";
  estimatedHours: number;
  sortOrder: number;
  intelligence: CareerRecommendationMetadata | null;
};

type Context = {
  career: string;
  countryCode: string | null | undefined;
  grade: string;
  skills: string[];
  activities: string[];
  existingTitles: string[];
  strongestTraits: string[];
  evolvingFocus?: { title: string; description: string; rationale: string };
};

export function buildCountryAwareRecommendations(context: Context): RoadmapRecommendationDraft[] {
  const existing = [...context.skills, ...context.activities, ...context.existingTitles];
  const actions = getCareerRequirementActions(context.career);
  if (!actions.length) return [];
  const actionContext = { career: context.career, countryCode: context.countryCode, grade: context.grade, existingEvidence: existing, strongestTraits: context.strongestTraits };
  const traitNote = context.strongestTraits.length ? ` Your latest simulation showed decision evidence related to ${context.strongestTraits.slice(0, 2).join(" and ")}.` : "";
  const evolutionNote = context.evolvingFocus ? ` ${context.evolvingFocus.rationale}` : "";
  const primary = actions.filter(action => action.kind === "primary" && !actionIsCovered(action, existing)).slice(0, 3);
  const exploratory = actions.filter(action => action.kind === "explore" && !actionIsCovered(action, existing)).slice(0, 1);
  return [...primary, ...exploratory].map((action, index) => {
    const intelligence = metadataForAction(action, actionContext);
    return {
      phase: action.kind === "primary" ? "Do this next" : "Explore",
      title: action.title(actionContext),
      description: action.description(actionContext),
      rationale: `You are targeting ${context.career}. ${intelligence.studentGap}${traitNote}${evolutionNote}`,
      category: action.category,
      priority: action.priority,
      estimatedHours: action.estimatedHours,
      sortOrder: index,
      intelligence,
    };
  });
}
