import type { SimulationCareerOption } from "@/components/CareerSimulationSelector";

// Public excerpts from server/simulation/catalog.ts, checked against the source in tests.
// Do not import server graphs or expose hidden scoring in the marketing bundle.
export const landingCareerExamples: readonly SimulationCareerOption[] = [
  {
    id: "software-engineer",
    name: "Software Engineer",
    category: "Technology",
    icon: "code",
    description:
      "Design, debug, and ship reliable software with a development team.",
    simulationIntro:
      "Respond to incidents, architecture tradeoffs, reviews, and delivery decisions in a software team.",
    durationLabel: "About 10 decisions",
  },
  {
    id: "cybersecurity-analyst",
    name: "Cybersecurity Analyst",
    category: "Technology",
    icon: "shield",
    description:
      "Protect systems and people by investigating and responding to security incidents.",
    simulationIntro:
      "Work through suspicious activity, containment, evidence, communication, and recovery decisions.",
    durationLabel: "About 10 decisions",
  },
  {
    id: "data-scientist",
    name: "Data Scientist",
    category: "Technology",
    icon: "chart",
    description:
      "Investigate evidence and communicate careful conclusions from data.",
    simulationIntro:
      "Work through data quality, experimentation, uncertainty, stakeholder questions, and recommendations.",
    durationLabel: "About 10 decisions",
  },
];

// Exact opening excerpt from software-v1.ts; this is not an executable simulation.
export const landingSimulationExcerpt = {
  title: "A release signal changes",
  situation:
    "Two days before a student-facing feature demonstration, a reliability check shows the feature performs unevenly for a group of users. Your team has limited time and needs a next move.",
  choices: [
    "Inspect the input data and recent changes before proposing a fix.",
    "Prototype a targeted technical change and compare it against the current approach.",
    "Bring in a teammate for a short, structured review of the evidence.",
    "Keep the current plan and prepare a contingency for the demonstration.",
  ],
} as const;
