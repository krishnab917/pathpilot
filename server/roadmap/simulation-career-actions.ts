import type { CareerRequirementAction } from "./career-requirements";

/** Beginner exploration, not licensing requirements or permission to practice. */
const preparation = [
  ["teacher", "Teacher", "learning and communication", "Create and test a fraction explanation", "lesson plan", "Compare two ways of explaining one concept to a willing peer."],
  ["journalist", "Journalist", "source verification and writing", "Build a sourced community report", "verification ledger", "Use public sources and distinguish verified facts from attributed claims."],
  ["civil engineer", "Civil Engineer", "mathematics and physical science", "Model a drainage capacity comparison", "capacity model", "Use fictional inputs and document assumptions; do not present this as construction advice."],
  ["urban planner", "Urban Planner", "geography and community research", "Map access to public amenities", "access map", "Use public information without recording personal resident details."],
  ["registered nurse", "Registered Nurse", "biology and communication", "Create a fictional structured handoff", "handoff exercise", "Practice clarity and ownership without giving treatment advice or using patient records."],
  ["pharmacist", "Pharmacist", "chemistry and careful record keeping", "Build a fictional inventory reconciliation", "inventory reconciliation", "Use made-up stock codes, not real medicines, prescribing, or dosing."],
  ["supply chain analyst", "Supply Chain Analyst", "quantitative planning", "Model stock coverage for three locations", "stock coverage", "State demand assumptions and test the effect of a delivery delay."],
  ["accountant", "Accountant", "financial records and mathematics", "Reconcile a fictional cash ledger", "cash reconciliation", "Keep a correction log and never use someone else's private financial records."],
  ["game designer", "Game Designer", "interaction and playtesting", "Prototype a paper tutorial level", "paper level", "Observe a consenting player's actions and revise one barrier."],
  ["social worker", "Social Worker", "communication and community resources", "Map public community support resources", "resource map", "Check public eligibility information; do not collect personal case details or promise access."],
] as const;

export const simulationCareerActions: Record<string, CareerRequirementAction[]> = Object.fromEntries(preparation.map(([key, career, subject, project, term, guidance]) => {
  const id = key.replaceAll(" ", "-");
  const make = (suffix: string, kind: "primary" | "explore", category: "skill" | "project" | "experience", title: string, description: string, terms: string[]): CareerRequirementAction => ({
    id: `${id}-${suffix}`, kind, category, requirementId: `${id}-${suffix}`, requirementLabel: `${career}: ${suffix.replaceAll("-", " ")}`,
    priority: kind === "explore" ? "low" : "medium", estimatedHours: category === "project" ? 6 : 2, coverageTerms: terms,
    title: () => title, description: () => description, gap: () => `No saved ${career.toLowerCase()} ${suffix.replaceAll("-", " ")} evidence is recorded yet.`, tip: guidance,
  });
  return [key, [
    make("foundation", "primary", "skill", `Plan a ${career.toLowerCase()} foundation step`, `Ask an educator about accessible learning in ${subject}. Verify local course and professional qualification requirements through official sources.`, [`${career.toLowerCase()} foundation`]),
    make("work-sample", "primary", "project", project, guidance, [term]),
    make("feedback", "primary", "experience", `Review your ${career.toLowerCase()} work sample with a mentor`, "Explain the artifact, one open question, and what you changed. Agree on one realistic next step without treating a simulation as an aptitude assessment.", [`${career.toLowerCase()} feedback`]),
    make("career-conversation", "explore", "experience", `Explore day-to-day work with a ${career.toLowerCase()} educator or professional`, "Ask about a typical assignment, supervision, ethics, and local preparation. Verify age, consent, and safeguarding requirements before any in-person activity.", [`${career.toLowerCase()} interview`]),
  ]];
}));
