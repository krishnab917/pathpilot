import type { TraitKey } from "./contracts";

export const simulationCareerCategories = [
  "Technology",
  "Health & Law",
  "Business & Finance",
  "Engineering & Built Environment",
  "Science & Environment",
  "Design & Research",
  "Education & Community",
] as const;

export type SimulationCareerCategory = (typeof simulationCareerCategories)[number];

export const simulationCareerIcons = [
  "code", "brain", "stethoscope", "scale", "rocket", "workflow", "shield", "chart", "plane", "cog", "building", "palette", "landmark", "leaf", "flask",
] as const;

export type SimulationCareerIcon = (typeof simulationCareerIcons)[number];

export type SimulationCareerDefinition = {
  id: string;
  name: string;
  category: SimulationCareerCategory;
  icon: SimulationCareerIcon;
  description: string;
  simulationIntro: string;
  durationLabel: string;
  relatedCareerIds: string[];
  behavioralRequirements: Partial<Record<TraitKey, "core" | "meaningful" | "supportive">>;
};

export const simulationCareerCatalog: readonly SimulationCareerDefinition[] = [
  {
    id: "software-engineer",
    name: "Software Engineer",
    category: "Technology",
    icon: "code",
    description: "Design, debug, and ship reliable software with a development team.",
    simulationIntro: "Respond to incidents, architecture tradeoffs, reviews, and delivery decisions in a software team.",
    durationLabel: "About 3–7 minutes",
    relatedCareerIds: ["ai-machine-learning-engineer", "cybersecurity-analyst", "product-manager"],
    behavioralRequirements: { analytical_thinking: "core", problem_solving: "core", systems_thinking: "core", attention_to_detail: "core", collaboration: "meaningful", communication: "meaningful", adaptability: "meaningful", long_term_thinking: "supportive" },
  },
  {
    id: "ai-machine-learning-engineer",
    name: "AI / Machine Learning Engineer",
    category: "Technology",
    icon: "brain",
    description: "Train, evaluate, and deploy intelligent systems responsibly.",
    simulationIntro: "Work through data quality, model performance, explainability, and deployment tradeoffs.",
    durationLabel: "About 3–7 minutes",
    relatedCareerIds: ["data-scientist", "software-engineer", "research-scientist"],
    behavioralRequirements: { analytical_thinking: "core", systems_thinking: "core", attention_to_detail: "core", problem_solving: "meaningful", ethical_reasoning: "meaningful", long_term_thinking: "meaningful", communication: "supportive" },
  },
  {
    id: "doctor-physician",
    name: "Doctor / Physician",
    category: "Health & Law",
    icon: "stethoscope",
    description: "Make clinical decisions under uncertainty, pressure, and ethical responsibility.",
    simulationIntro: "Work through triage, patient communication, limited information, and care coordination.",
    durationLabel: "About 3–7 minutes",
    relatedCareerIds: ["research-scientist", "environmental-scientist", "lawyer"],
    behavioralRequirements: { communication: "core", ethical_reasoning: "core", collaboration: "core", attention_to_detail: "meaningful", problem_solving: "meaningful", adaptability: "supportive" },
  },
  {
    id: "lawyer",
    name: "Lawyer",
    category: "Health & Law",
    icon: "scale",
    description: "Evaluate evidence, advise clients, and navigate legal and ethical tradeoffs.",
    simulationIntro: "Work through testimony, negotiation, legal strategy, and professional responsibility.",
    durationLabel: "About 3–7 minutes",
    relatedCareerIds: ["financial-analyst", "product-manager", "entrepreneur-startup-founder"],
    behavioralRequirements: { analytical_thinking: "core", communication: "core", ethical_reasoning: "core", attention_to_detail: "meaningful", long_term_thinking: "meaningful", systems_thinking: "supportive" },
  },
  {
    id: "entrepreneur-startup-founder",
    name: "Entrepreneur / Startup Founder",
    category: "Business & Finance",
    icon: "rocket",
    description: "Build a company through difficult customer, team, and resource tradeoffs.",
    simulationIntro: "Work through product-market fit, hiring, runway, customer feedback, and growth decisions.",
    durationLabel: "About 3–7 minutes",
    relatedCareerIds: ["product-manager", "financial-analyst", "ux-product-designer"],
    behavioralRequirements: { ownership: "core", adaptability: "core", communication: "core", long_term_thinking: "meaningful", collaboration: "meaningful", problem_solving: "meaningful", systems_thinking: "supportive" },
  },
  {
    id: "product-manager",
    name: "Product Manager",
    category: "Business & Finance",
    icon: "workflow",
    description: "Align customer needs, business goals, and delivery constraints.",
    simulationIntro: "Work through prioritization, research, launches, roadmap conflict, and stakeholder decisions.",
    durationLabel: "About 3–7 minutes",
    relatedCareerIds: ["entrepreneur-startup-founder", "ux-product-designer", "software-engineer"],
    behavioralRequirements: { communication: "core", collaboration: "core", systems_thinking: "core", ownership: "core", long_term_thinking: "meaningful", problem_solving: "meaningful", ethical_reasoning: "supportive" },
  },
  {
    id: "cybersecurity-analyst",
    name: "Cybersecurity Analyst",
    category: "Technology",
    icon: "shield",
    description: "Protect systems and people by investigating and responding to security incidents.",
    simulationIntro: "Work through suspicious activity, containment, evidence, communication, and recovery decisions.",
    durationLabel: "About 3–7 minutes",
    relatedCareerIds: ["software-engineer", "data-scientist", "ai-machine-learning-engineer"],
    behavioralRequirements: { attention_to_detail: "core", problem_solving: "core", ethical_reasoning: "core", analytical_thinking: "meaningful", communication: "meaningful", long_term_thinking: "supportive" },
  },
  {
    id: "data-scientist",
    name: "Data Scientist",
    category: "Technology",
    icon: "chart",
    description: "Investigate evidence and communicate careful conclusions from data.",
    simulationIntro: "Work through data quality, experimentation, uncertainty, stakeholder questions, and recommendations.",
    durationLabel: "About 3–7 minutes",
    relatedCareerIds: ["ai-machine-learning-engineer", "research-scientist", "financial-analyst"],
    behavioralRequirements: { analytical_thinking: "core", attention_to_detail: "core", problem_solving: "core", systems_thinking: "meaningful", communication: "meaningful", long_term_thinking: "meaningful", adaptability: "supportive" },
  },
  {
    id: "aerospace-engineer-astronaut",
    name: "Aerospace Engineer / Astronaut Pathway",
    category: "Engineering & Built Environment",
    icon: "plane",
    description: "Plan and protect complex missions under systems, safety, and resource constraints.",
    simulationIntro: "Work through telemetry, mission planning, hardware faults, crew coordination, and risk tradeoffs.",
    durationLabel: "About 3–7 minutes",
    relatedCareerIds: ["mechanical-engineer", "software-engineer", "research-scientist"],
    behavioralRequirements: { systems_thinking: "core", attention_to_detail: "core", problem_solving: "core", collaboration: "meaningful", ethical_reasoning: "meaningful", adaptability: "supportive" },
  },
  {
    id: "mechanical-engineer",
    name: "Mechanical Engineer",
    category: "Engineering & Built Environment",
    icon: "cog",
    description: "Design and test physical systems that balance reliability, safety, and cost.",
    simulationIntro: "Work through prototypes, materials, manufacturing constraints, and reliability testing.",
    durationLabel: "About 3–7 minutes",
    relatedCareerIds: ["aerospace-engineer-astronaut", "architect", "software-engineer"],
    behavioralRequirements: { problem_solving: "core", attention_to_detail: "core", systems_thinking: "core", long_term_thinking: "meaningful", collaboration: "meaningful", adaptability: "supportive" },
  },
  {
    id: "architect",
    name: "Architect",
    category: "Engineering & Built Environment",
    icon: "building",
    description: "Shape buildings around people, constraints, safety, and long-term impact.",
    simulationIntro: "Work through client needs, accessibility, zoning, sustainability, and construction decisions.",
    durationLabel: "About 3–7 minutes",
    relatedCareerIds: ["mechanical-engineer", "ux-product-designer", "environmental-scientist"],
    behavioralRequirements: { systems_thinking: "core", communication: "core", ethical_reasoning: "core", long_term_thinking: "meaningful", attention_to_detail: "meaningful", collaboration: "supportive" },
  },
  {
    id: "ux-product-designer",
    name: "UX / Product Designer",
    category: "Design & Research",
    icon: "palette",
    description: "Research, design, and improve experiences around real human needs.",
    simulationIntro: "Work through usability evidence, accessibility, conflicting feedback, and design tradeoffs.",
    durationLabel: "About 3–7 minutes",
    relatedCareerIds: ["product-manager", "software-engineer", "entrepreneur-startup-founder"],
    behavioralRequirements: { communication: "core", collaboration: "core", ethical_reasoning: "core", adaptability: "meaningful", attention_to_detail: "meaningful", problem_solving: "supportive" },
  },
  {
    id: "financial-analyst",
    name: "Financial Analyst",
    category: "Business & Finance",
    icon: "landmark",
    description: "Assess financial evidence, uncertainty, risk, and recommendations.",
    simulationIntro: "Work through earnings, forecasting, market volatility, risk signals, and client communication.",
    durationLabel: "About 3–7 minutes",
    relatedCareerIds: ["data-scientist", "entrepreneur-startup-founder", "lawyer"],
    behavioralRequirements: { analytical_thinking: "core", attention_to_detail: "core", long_term_thinking: "core", ethical_reasoning: "meaningful", communication: "meaningful", systems_thinking: "supportive" },
  },
  {
    id: "environmental-scientist",
    name: "Environmental Scientist",
    category: "Science & Environment",
    icon: "leaf",
    description: "Study environmental systems and recommend responsible action with incomplete evidence.",
    simulationIntro: "Work through field data, ecosystem risk, mitigation planning, and public communication.",
    durationLabel: "About 3–7 minutes",
    relatedCareerIds: ["research-scientist", "architect", "aerospace-engineer-astronaut"],
    behavioralRequirements: { systems_thinking: "core", ethical_reasoning: "core", long_term_thinking: "core", communication: "meaningful", problem_solving: "meaningful", adaptability: "supportive" },
  },
  {
    id: "research-scientist",
    name: "Research Scientist",
    category: "Science & Environment",
    icon: "flask",
    description: "Plan, test, and interpret research with integrity and curiosity.",
    simulationIntro: "Work through experiments, reproducibility, funding limits, ethics, and publication decisions.",
    durationLabel: "About 3–7 minutes",
    relatedCareerIds: ["data-scientist", "ai-machine-learning-engineer", "environmental-scientist"],
    behavioralRequirements: { analytical_thinking: "core", attention_to_detail: "core", long_term_thinking: "core", problem_solving: "meaningful", ethical_reasoning: "meaningful", systems_thinking: "supportive" },
  },
  {"id":"teacher","name":"Teacher","category":"Education & Community","icon":"brain","description":"Adapt lessons using evidence from student work.","simulationIntro":"Adapt lessons using evidence from student work.","durationLabel":"About 3–7 minutes","relatedCareerIds":["doctor-physician"],"behavioralRequirements":{"communication":"core","adaptability":"meaningful"}},
  {"id":"journalist","name":"Journalist","category":"Education & Community","icon":"code","description":"Verify sources and communicate accurate public information.","simulationIntro":"Verify sources and communicate accurate public information.","durationLabel":"About 3–7 minutes","relatedCareerIds":["lawyer"],"behavioralRequirements":{"attention_to_detail":"core","communication":"meaningful"}},
  {"id":"civil-engineer","name":"Civil Engineer","category":"Engineering & Built Environment","icon":"building","description":"Compare infrastructure alternatives against constraints.","simulationIntro":"Compare infrastructure alternatives against constraints.","durationLabel":"About 3–7 minutes","relatedCareerIds":["mechanical-engineer"],"behavioralRequirements":{"systems_thinking":"core","analytical_thinking":"meaningful"}},
  {"id":"urban-planner","name":"Urban Planner","category":"Engineering & Built Environment","icon":"building","description":"Connect land use, access, and community participation.","simulationIntro":"Connect land use, access, and community participation.","durationLabel":"About 3–7 minutes","relatedCareerIds":["architect"],"behavioralRequirements":{"systems_thinking":"core","ethical_reasoning":"meaningful"}},
  {"id":"registered-nurse","name":"Registered Nurse","category":"Health & Law","icon":"stethoscope","description":"Coordinate observations, handoffs, and patient communication.","simulationIntro":"Coordinate observations, handoffs, and patient communication.","durationLabel":"About 3–7 minutes","relatedCareerIds":["doctor-physician"],"behavioralRequirements":{"communication":"core","attention_to_detail":"meaningful"}},
  {"id":"pharmacist","name":"Pharmacist","category":"Health & Law","icon":"stethoscope","description":"Review medicine supply records and safety processes.","simulationIntro":"Review medicine supply records and safety processes.","durationLabel":"About 3–7 minutes","relatedCareerIds":["doctor-physician"],"behavioralRequirements":{"attention_to_detail":"core","ethical_reasoning":"meaningful"}},
  {"id":"supply-chain-analyst","name":"Supply Chain Analyst","category":"Business & Finance","icon":"workflow","description":"Balance demand, inventory, and delivery constraints.","simulationIntro":"Balance demand, inventory, and delivery constraints.","durationLabel":"About 3–7 minutes","relatedCareerIds":["financial-analyst"],"behavioralRequirements":{"analytical_thinking":"core","systems_thinking":"meaningful"}},
  {"id":"accountant","name":"Accountant","category":"Business & Finance","icon":"landmark","description":"Reconcile records and maintain a clear financial audit trail.","simulationIntro":"Reconcile records and maintain a clear financial audit trail.","durationLabel":"About 3–7 minutes","relatedCareerIds":["financial-analyst"],"behavioralRequirements":{"attention_to_detail":"core","ethical_reasoning":"meaningful"}},
  {"id":"game-designer","name":"Game Designer","category":"Design & Research","icon":"palette","description":"Shape playable experiences through testing and iteration.","simulationIntro":"Shape playable experiences through testing and iteration.","durationLabel":"About 3–7 minutes","relatedCareerIds":["ux-product-designer"],"behavioralRequirements":{"problem_solving":"core","adaptability":"meaningful"}},
  {"id":"social-worker","name":"Social Worker","category":"Education & Community","icon":"workflow","description":"Connect stated needs to consent-based support and resources.","simulationIntro":"Connect stated needs to consent-based support and resources.","durationLabel":"About 3–7 minutes","relatedCareerIds":["teacher"],"behavioralRequirements":{"communication":"core","ethical_reasoning":"meaningful"}},
] as const;

const careersById = new Map(simulationCareerCatalog.map(career => [career.id, career]));
const normalizeCareerInput = (value: string) => value.trim().toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
const careersByResolvedInput = new Map<string, SimulationCareerDefinition>([
  ...simulationCareerCatalog.flatMap(career => [
    [normalizeCareerInput(career.id), career] as const,
    [normalizeCareerInput(career.name), career] as const,
  ]),
]);

/** Resolves only source-controlled catalog IDs or canonical display names; it never fuzzy-matches, aliases, or substitutes a career. */
export function resolveSupportedCareer(input: string | null | undefined): SimulationCareerDefinition | null {
  return typeof input === "string" ? careersByResolvedInput.get(normalizeCareerInput(input)) ?? null : null;
}

export function getSimulationCareer(careerId: string | null | undefined): SimulationCareerDefinition | null {
  return resolveSupportedCareer(careerId);
}

export function searchSimulationCareers(query: string, category?: SimulationCareerCategory): SimulationCareerDefinition[] {
  const normalized = query.trim().toLowerCase();
  return simulationCareerCatalog.filter(career => {
    const matchesCategory = !category || career.category === category;
    const searchable = `${career.name} ${career.category} ${career.description}`.toLowerCase();
    return matchesCategory && (!normalized || searchable.includes(normalized));
  });
}

export function relatedSimulationCareers(careerId: string): SimulationCareerDefinition[] {
  const career = getSimulationCareer(careerId);
  if (!career) return [];
  return career.relatedCareerIds.map(id => getSimulationCareer(id)).filter((item): item is SimulationCareerDefinition => Boolean(item));
}
