export const simulationCareerCategories = [
  "Technology",
  "Health & Law",
  "Business & Finance",
  "Engineering & Built Environment",
  "Science & Environment",
  "Design & Research",
] as const;

export type SimulationCareerCategory = (typeof simulationCareerCategories)[number];

export type SimulationCareerDefinition = {
  id: string;
  name: string;
  category: SimulationCareerCategory;
  description: string;
  simulationIntro: string;
  durationLabel: string;
  relatedCareerIds: string[];
};

export const simulationCareerCatalog: readonly SimulationCareerDefinition[] = [
  {
    id: "software-engineer",
    name: "Software Engineer",
    category: "Technology",
    description: "Design, debug, and ship reliable software with a development team.",
    simulationIntro: "Respond to incidents, architecture tradeoffs, reviews, and delivery decisions in a software team.",
    durationLabel: "About 10 decisions",
    relatedCareerIds: ["ai-machine-learning-engineer", "cybersecurity-analyst", "product-manager"],
  },
  {
    id: "ai-machine-learning-engineer",
    name: "AI / Machine Learning Engineer",
    category: "Technology",
    description: "Train, evaluate, and deploy intelligent systems responsibly.",
    simulationIntro: "Work through data quality, model performance, explainability, and deployment tradeoffs.",
    durationLabel: "About 10 decisions",
    relatedCareerIds: ["data-scientist", "software-engineer", "research-scientist"],
  },
  {
    id: "doctor-physician",
    name: "Doctor / Physician",
    category: "Health & Law",
    description: "Make clinical decisions under uncertainty, pressure, and ethical responsibility.",
    simulationIntro: "Work through triage, patient communication, limited information, and care coordination.",
    durationLabel: "About 10 decisions",
    relatedCareerIds: ["research-scientist", "environmental-scientist", "lawyer"],
  },
  {
    id: "lawyer",
    name: "Lawyer",
    category: "Health & Law",
    description: "Evaluate evidence, advise clients, and navigate legal and ethical tradeoffs.",
    simulationIntro: "Work through testimony, negotiation, legal strategy, and professional responsibility.",
    durationLabel: "About 10 decisions",
    relatedCareerIds: ["financial-analyst", "product-manager", "entrepreneur-startup-founder"],
  },
  {
    id: "entrepreneur-startup-founder",
    name: "Entrepreneur / Startup Founder",
    category: "Business & Finance",
    description: "Build a company through difficult customer, team, and resource tradeoffs.",
    simulationIntro: "Work through product-market fit, hiring, runway, customer feedback, and growth decisions.",
    durationLabel: "About 10 decisions",
    relatedCareerIds: ["product-manager", "financial-analyst", "ux-product-designer"],
  },
  {
    id: "product-manager",
    name: "Product Manager",
    category: "Business & Finance",
    description: "Align customer needs, business goals, and delivery constraints.",
    simulationIntro: "Work through prioritization, research, launches, roadmap conflict, and stakeholder decisions.",
    durationLabel: "About 10 decisions",
    relatedCareerIds: ["entrepreneur-startup-founder", "ux-product-designer", "software-engineer"],
  },
  {
    id: "cybersecurity-analyst",
    name: "Cybersecurity Analyst",
    category: "Technology",
    description: "Protect systems and people by investigating and responding to security incidents.",
    simulationIntro: "Work through suspicious activity, containment, evidence, communication, and recovery decisions.",
    durationLabel: "About 10 decisions",
    relatedCareerIds: ["software-engineer", "data-scientist", "ai-machine-learning-engineer"],
  },
  {
    id: "data-scientist",
    name: "Data Scientist",
    category: "Technology",
    description: "Investigate evidence and communicate careful conclusions from data.",
    simulationIntro: "Work through data quality, experimentation, uncertainty, stakeholder questions, and recommendations.",
    durationLabel: "About 10 decisions",
    relatedCareerIds: ["ai-machine-learning-engineer", "research-scientist", "financial-analyst"],
  },
  {
    id: "aerospace-engineer-astronaut",
    name: "Aerospace Engineer / Astronaut Pathway",
    category: "Engineering & Built Environment",
    description: "Plan and protect complex missions under systems, safety, and resource constraints.",
    simulationIntro: "Work through telemetry, mission planning, hardware faults, crew coordination, and risk tradeoffs.",
    durationLabel: "About 10 decisions",
    relatedCareerIds: ["mechanical-engineer", "software-engineer", "research-scientist"],
  },
  {
    id: "mechanical-engineer",
    name: "Mechanical Engineer",
    category: "Engineering & Built Environment",
    description: "Design and test physical systems that balance reliability, safety, and cost.",
    simulationIntro: "Work through prototypes, materials, manufacturing constraints, and reliability testing.",
    durationLabel: "About 10 decisions",
    relatedCareerIds: ["aerospace-engineer-astronaut", "architect", "software-engineer"],
  },
  {
    id: "architect",
    name: "Architect",
    category: "Engineering & Built Environment",
    description: "Shape buildings around people, constraints, safety, and long-term impact.",
    simulationIntro: "Work through client needs, accessibility, zoning, sustainability, and construction decisions.",
    durationLabel: "About 10 decisions",
    relatedCareerIds: ["mechanical-engineer", "ux-product-designer", "environmental-scientist"],
  },
  {
    id: "ux-product-designer",
    name: "UX / Product Designer",
    category: "Design & Research",
    description: "Research, design, and improve experiences around real human needs.",
    simulationIntro: "Work through usability evidence, accessibility, conflicting feedback, and design tradeoffs.",
    durationLabel: "About 10 decisions",
    relatedCareerIds: ["product-manager", "software-engineer", "entrepreneur-startup-founder"],
  },
  {
    id: "financial-analyst",
    name: "Financial Analyst",
    category: "Business & Finance",
    description: "Assess financial evidence, uncertainty, risk, and recommendations.",
    simulationIntro: "Work through earnings, forecasting, market volatility, risk signals, and client communication.",
    durationLabel: "About 10 decisions",
    relatedCareerIds: ["data-scientist", "entrepreneur-startup-founder", "lawyer"],
  },
  {
    id: "environmental-scientist",
    name: "Environmental Scientist",
    category: "Science & Environment",
    description: "Study environmental systems and recommend responsible action with incomplete evidence.",
    simulationIntro: "Work through field data, ecosystem risk, mitigation planning, and public communication.",
    durationLabel: "About 10 decisions",
    relatedCareerIds: ["research-scientist", "architect", "aerospace-engineer-astronaut"],
  },
  {
    id: "research-scientist",
    name: "Research Scientist",
    category: "Science & Environment",
    description: "Plan, test, and interpret research with integrity and curiosity.",
    simulationIntro: "Work through experiments, reproducibility, funding limits, ethics, and publication decisions.",
    durationLabel: "About 10 decisions",
    relatedCareerIds: ["data-scientist", "ai-machine-learning-engineer", "environmental-scientist"],
  },
] as const;

const careersById = new Map(simulationCareerCatalog.map(career => [career.id, career]));

export function getSimulationCareer(careerId: string | null | undefined): SimulationCareerDefinition | null {
  return careerId ? careersById.get(careerId) ?? null : null;
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
