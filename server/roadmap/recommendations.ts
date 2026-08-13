import { getNationalEducationContext } from "./national-context";

export type RoadmapRecommendationDraft = {
  phase: string;
  title: string;
  description: string;
  rationale: string;
  category: "skill" | "project" | "experience";
  priority: "low" | "medium" | "high";
  estimatedHours: number;
  sortOrder: number;
};

type Context = {
  career: string;
  countryCode: string | null | undefined;
  grade: string;
  skills: string[];
  activities: string[];
  existingTitles: string[];
  strongestTraits: string[];
};

const normalized = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const isCovered = (terms: string[], existing: string[]) => existing.some(item => terms.some(term => normalized(item).includes(normalized(term))));

function careerTrack(career: string) {
  const value = normalized(career);
  if (/(software|data|machine learning|artificial intelligence|ai |developer|engineer)/.test(value)) return {
    foundation: "Deepen the technical foundation most relevant to your target role",
    project: `Build an evidence-rich ${career} project`,
    experiment: "Run a structured problem investigation with constraints and trade-offs",
    communication: "Document and explain one technical decision",
    foundationTerms: ["python", "programming", "data structures", "statistics"],
  };
  if (/(health|medicine|nurs|biolog|clinical)/.test(value)) return {
    foundation: "Strengthen the science and evidence base for your target field",
    project: `Complete a research or service project connected to ${career}`,
    experiment: "Explore an ethical, evidence-based case study in the field",
    communication: "Explain a health or science topic clearly for a student audience",
    foundationTerms: ["biology", "chemistry", "science"],
  };
  if (/(design|art|media|writer|journal)/.test(value)) return {
    foundation: "Build deliberate craft practice and feedback habits",
    project: `Create a focused ${career} portfolio piece`,
    experiment: "Test a brief with a real audience and reflect on the result",
    communication: "Present your creative process and design decisions",
    foundationTerms: ["portfolio", "design", "writing"],
  };
  return {
    foundation: `Identify the core knowledge and transferable skills for ${career}`,
    project: `Build a focused project that tests ${career}`,
    experiment: "Run a structured career experiment or observation",
    communication: "Communicate what you learned from your exploration",
    foundationTerms: ["research", "career exploration", "foundations"],
  };
}

export function buildCountryAwareRecommendations(context: Context): RoadmapRecommendationDraft[] {
  const national = getNationalEducationContext(context.countryCode);
  const track = careerTrack(context.career);
  const existing = [...context.skills, ...context.activities, ...context.existingTitles];
  const traitNote = context.strongestTraits.length ? ` Your simulation showed evidence of ${context.strongestTraits.slice(0, 2).join(" and ")}.` : "";
  const base = [
    { phase: "Foundation", title: track.foundation, description: `Choose one focused learning block that advances the skills used in ${context.career}.`, rationale: `This builds from your current grade (${context.grade}) and prevents a vague “learn more skills” task.${traitNote}`, category: "skill" as const, priority: "high" as const, estimatedHours: 18, terms: track.foundationTerms },
    { phase: "Experience", title: track.project, description: "Define a clear problem, a small scope, evidence of progress, and a reflection on what changed.", rationale: `A tangible project turns exploration of ${context.career} into evidence you can review and improve.${traitNote}`, category: "project" as const, priority: "high" as const, estimatedHours: 32, terms: ["project", "portfolio", normalized(context.career)] },
    { phase: "Exploration", title: track.experiment, description: "Use a time-bounded scenario, interview, observation, or research brief; record what the work felt like.", rationale: `This extends the simulation with a real-world learning loop instead of treating one result as a final answer.${traitNote}`, category: "experience" as const, priority: "medium" as const, estimatedHours: 8, terms: ["career experiment", "job shadow", "observation"] },
    { phase: "Preparation", title: track.communication, description: "Create a short explanation, write-up, or presentation that makes your reasoning visible.", rationale: "Communicating your process helps you identify what to improve and creates evidence for future applications or conversations.", category: "project" as const, priority: "medium" as const, estimatedHours: 6, terms: ["technical writing", "presentation", "write up"] },
    { phase: "Preparation", title: `Map ${national.label} learning pathways for ${context.career}`, description: national.planningSignals[0], rationale: `${national.sourceNote} This creates a country-aware planning checkpoint without assuming a single required route.`, category: "experience" as const, priority: "medium" as const, estimatedHours: 4, terms: ["pathway", "entry requirements", "college research"] },
  ];
  const filtered = base.filter(item => !isCovered(item.terms, existing));
  const output = (filtered.length >= 3 ? filtered : base).slice(0, 5);
  return output.map((item, index) => ({ ...item, sortOrder: index }));
}
