import { getNationalEducationContext } from "./national-context";

export type RecommendationKind = "primary" | "explore";
export type CareerRecommendationMetadata = {
  kind: RecommendationKind;
  requirementId: string;
  requirementLabel: string;
  studentGap: string;
  tip: string;
  countryContext: string;
  verificationStatus: "general";
  sourceLabel: "General recommendation — verify local availability";
};

export type CareerRequirementAction = {
  id: string;
  kind: RecommendationKind;
  requirementId: string;
  requirementLabel: string;
  category: "skill" | "project" | "experience";
  priority: "low" | "medium" | "high";
  estimatedHours: number;
  coverageTerms: string[];
  title: (context: CareerRecommendationContext) => string;
  description: (context: CareerRecommendationContext) => string;
  gap: (context: CareerRecommendationContext) => string;
  tip: string;
};

export type CareerRecommendationContext = {
  career: string;
  countryCode: string | null | undefined;
  grade: string;
  existingEvidence: string[];
  strongestTraits: string[];
};

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const gradeNumber = (grade: string) => Number(grade.match(/\d+/)?.[0] ?? 10);
const countryPlanningAction = (context: CareerRecommendationContext, subject: string) => {
  const country = getNationalEducationContext(context.countryCode);
  if (country.code === "US") return `Check your school catalog for the most challenging ${subject} course available and compare it with pathways you are considering.`;
  if (country.code === "IN") return `Map ${subject} preparation to your board subjects and intended higher-education pathway; verify any entrance requirements through official sources.`;
  if (country.code === "GB") return `Compare ${subject} preparation with the entry requirements of UK courses you are considering; verify details with providers or UCAS.`;
  return `Use your local school or provider catalog to identify an appropriate ${subject} preparation step, then verify requirements with the official source.`;
};
const levelAction = (context: CareerRecommendationContext, foundation: string, advanced: string) => gradeNumber(context.grade) >= 11 ? advanced : foundation;

const profiles: Record<string, CareerRequirementAction[]> = {
  "software engineer": [
    { id: "cs-foundation", kind: "primary", requirementId: "software-cs-foundations", requirementLabel: "Computer science foundations", category: "skill", priority: "high", estimatedHours: 16, coverageTerms: ["data structures", "algorithms", "ap computer science", "computer science a"], title: context => `Plan a ${getNationalEducationContext(context.countryCode).label} computer science preparation step`, description: context => countryPlanningAction(context, "computer science and mathematics"), gap: () => "No advanced computer science or algorithms preparation is recorded yet.", tip: "Choose the most rigorous option available to you, then build one small Java, Python, or web project that applies the concepts beyond the assignment." },
    { id: "software-artifact", kind: "primary", requirementId: "software-portfolio-evidence", requirementLabel: "Substantial software artifact", category: "project", priority: "high", estimatedHours: 32, coverageTerms: ["software application", "full stack", "github project", "production app", "web app"], title: context => levelAction(context, "Build a small software application that uses an external API", "Build and document a production-style software application with tests"), description: () => "Define one user problem, a limited first release, version control, a public demo or screenshots, and a README that explains your decisions.", gap: () => "Your saved evidence does not yet show a substantial software artifact tied to a real problem.", tip: "Make the final artifact demonstrable: explain the problem, approach, result, trade-offs, and what you would improve next." },
    { id: "software-collaboration", kind: "primary", requirementId: "software-collaboration", requirementLabel: "Technical collaboration", category: "experience", priority: "medium", estimatedHours: 12, coverageTerms: ["software subsystem", "technical subsystem", "code review", "technical lead", "engineering team"], title: () => "Take ownership of a technical subsystem or reviewable deliverable", description: () => "Use a coding, robotics, or maker activity to plan, build, test, and explain one bounded component with collaborators.", gap: () => "Current activities do not yet document ownership of a technical deliverable with collaboration evidence.", tip: "Ask for a clear subsystem, define acceptance checks, and keep a short decision log so your contribution is visible." },
    { id: "software-interview", kind: "explore", requirementId: "software-career-understanding", requirementLabel: "Career understanding", category: "experience", priority: "low", estimatedHours: 3, coverageTerms: ["software engineer interview", "developer interview"], title: () => "Interview a software professional about one real development workflow", description: context => `Prepare five questions about debugging, collaboration, review, and delivery; compare what you hear with your simulation observations. ${countryPlanningAction(context, "professional learning and outreach")}`, gap: () => "You have not recorded a direct professional perspective on day-to-day software work.", tip: "Ask for one example of a difficult bug or trade-off, not only general career advice." },
  ],
  "doctor physician": [
    { id: "medicine-science", kind: "primary", requirementId: "medicine-science-foundation", requirementLabel: "Science preparation", category: "skill", priority: "high", estimatedHours: 16, coverageTerms: ["advanced biology", "advanced chemistry", "ap biology", "ap chemistry"], title: () => "Plan an advanced science preparation step where available", description: context => countryPlanningAction(context, "biology, chemistry, and quantitative science"), gap: () => "No advanced science preparation is recorded yet.", tip: "Use a notebook to connect one scientific concept each week to a real health or research question." },
    { id: "medicine-evidence", kind: "primary", requirementId: "medicine-scientific-reasoning", requirementLabel: "Scientific reasoning", category: "project", priority: "high", estimatedHours: 20, coverageTerms: ["science investigation", "biology research", "health research"], title: () => "Complete a science investigation with a documented evidence trail", description: () => "Choose a safe school, community, or open-data question; state a hypothesis, collect or analyze evidence, record limitations, and present a conclusion.", gap: () => "Your saved work does not yet show a documented scientific investigation.", tip: "Keep a research log with your question, method, failed attempts, evidence, and what changed your conclusion." },
    { id: "medicine-exposure", kind: "primary", requirementId: "medicine-healthcare-exposure", requirementLabel: "Ethical healthcare exposure", category: "experience", priority: "medium", estimatedHours: 8, coverageTerms: ["healthcare volunteering", "hospital volunteering", "healthcare exposure"], title: () => "Identify one official healthcare or health-science exposure pathway", description: () => "Use an official school, hospital, clinic, university, or community organization source to review age, safeguarding, eligibility, and supervision requirements before applying.", gap: () => "No verified healthcare or health-science exposure is recorded.", tip: "Never assume access or eligibility; confirm safeguarding and age requirements directly with the organization before committing time." },
    { id: "medicine-interview", kind: "explore", requirementId: "medicine-career-understanding", requirementLabel: "Career understanding", category: "experience", priority: "low", estimatedHours: 3, coverageTerms: ["physician interview", "doctor interview"], title: () => "Speak with a healthcare professional or educator about clinical teamwork", description: () => "Prepare questions about communication, uncertainty, ethics, and collaborative care; reflect on what the work requires beyond academic preparation.", gap: () => "No direct perspective on healthcare teamwork is recorded.", tip: "Ask about one situation where communication changed a patient or team outcome." },
  ],
  "entrepreneur startup founder": [
    { id: "startup-customer-discovery", kind: "primary", requirementId: "startup-customer-discovery", requirementLabel: "Customer discovery", category: "experience", priority: "high", estimatedHours: 10, coverageTerms: ["customer interviews", "customer discovery", "user interviews"], title: () => "Run five structured customer-discovery conversations", description: () => "Choose a small problem area, write neutral questions, interview potential users, and summarize repeated needs without pitching a solution first.", gap: () => "No structured customer-discovery evidence is recorded.", tip: "Ask about recent behavior and frustrations instead of asking whether someone likes your idea." },
    { id: "startup-validation", kind: "primary", requirementId: "startup-product-validation", requirementLabel: "Product validation", category: "project", priority: "high", estimatedHours: 24, coverageTerms: ["product prototype", "validated prototype", "startup mvp"], title: () => "Build a small prototype and test it with real users", description: () => "Create the smallest useful version of one idea, set one measurable learning goal, collect feedback, and document what you changed after testing.", gap: () => "Your saved work does not yet show a prototype tested against user feedback.", tip: "Define one learning metric before building; revise the prototype after at least one full feedback cycle." },
    { id: "startup-finance", kind: "primary", requirementId: "startup-financial-basics", requirementLabel: "Business-model fundamentals", category: "skill", priority: "medium", estimatedHours: 10, coverageTerms: ["business model", "unit economics", "entrepreneurship course"], title: () => "Create a one-page business-model and cost sketch", description: context => `${countryPlanningAction(context, "business and entrepreneurship learning") } Use a simple model to state the customer, problem, value, costs, and assumptions you still need to test.`, gap: () => "No structured business-model or financial-basics evidence is recorded.", tip: "Treat every number as an assumption until a customer, price, or cost source validates it." },
    { id: "startup-interview", kind: "explore", requirementId: "startup-career-understanding", requirementLabel: "Career understanding", category: "experience", priority: "low", estimatedHours: 3, coverageTerms: ["founder interview", "entrepreneur interview"], title: () => "Interview a founder about one product decision that changed", description: () => "Ask how they identified a customer problem, what evidence changed their plan, and how they decided what not to build.", gap: () => "No recorded first-hand perspective on iterative entrepreneurship work.", tip: "Focus on decisions and evidence, not only the founder’s final outcome." },
  ],
  "environmental scientist": [
    { id: "environmental-science", kind: "primary", requirementId: "environmental-science-foundation", requirementLabel: "Environmental science foundation", category: "skill", priority: "high", estimatedHours: 14, coverageTerms: ["environmental science", "ecology", "earth science", "gis"], title: () => "Plan an environmental science or data-preparation step", description: context => countryPlanningAction(context, "environmental science, ecology, geography, or data analysis"), gap: () => "No environmental-science or ecological-data preparation is recorded.", tip: "Choose one local or global environmental issue and connect each learning block to the data used to understand it." },
    { id: "environmental-data", kind: "primary", requirementId: "environmental-data-evidence", requirementLabel: "Environmental data investigation", category: "project", priority: "high", estimatedHours: 24, coverageTerms: ["environmental data project", "water quality project", "climate data project", "environmental investigation"], title: () => "Build a local or open-data environmental investigation", description: () => "Frame a measurable question, use a safe official or open dataset where needed, document methods and limitations, and communicate one evidence-based finding.", gap: () => "Your saved work does not yet show environmental data or field evidence used to support a conclusion.", tip: "Separate what the data shows from what it cannot show; include limitations in your final presentation." },
    { id: "environmental-action", kind: "primary", requirementId: "environmental-community-application", requirementLabel: "Applied environmental action", category: "experience", priority: "medium", estimatedHours: 12, coverageTerms: ["environmental action", "conservation project", "sustainability project"], title: () => "Take a measurable role in an environmental or sustainability project", description: () => "Choose a school, community, or official organization activity where you can collect evidence, track an outcome, and explain the environmental trade-off involved.", gap: () => "No applied environmental activity with a measurable contribution is recorded.", tip: "Define one baseline and one outcome measure before starting so the work produces usable evidence." },
    { id: "environmental-interview", kind: "explore", requirementId: "environmental-career-understanding", requirementLabel: "Career understanding", category: "experience", priority: "low", estimatedHours: 3, coverageTerms: ["environmental scientist interview", "environmental professional interview"], title: () => "Interview an environmental professional or educator about evidence and trade-offs", description: () => "Ask how they evaluate incomplete data, communicate uncertainty, and balance environmental, community, and operational constraints.", gap: () => "No recorded professional perspective on environmental decision-making.", tip: "Ask for one example where new evidence changed the recommended action." },
  ],
};

export function getCareerRequirementActions(career: string): CareerRequirementAction[] {
  const key = normalize(career);
  return profiles[key] ?? (key === "machine learning engineer" ? profiles["software engineer"] : []);
}

export function actionIsCovered(action: CareerRequirementAction, evidence: string[]) {
  return evidence.some(value => action.coverageTerms.some(term => normalize(value).includes(normalize(term))));
}

export function metadataForAction(action: CareerRequirementAction, context: CareerRecommendationContext): CareerRecommendationMetadata {
  return {
    kind: action.kind,
    requirementId: action.requirementId,
    requirementLabel: action.requirementLabel,
    studentGap: action.gap(context),
    tip: action.tip,
    countryContext: getNationalEducationContext(context.countryCode).label,
    verificationStatus: "general",
    sourceLabel: "General recommendation — verify local availability",
  };
}
