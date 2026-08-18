export type DashboardJourneySection = "simulate" | "roadmap";
export type DashboardJourneyStepState = "complete" | "current" | "upcoming";

export type DashboardJourney = {
  stage: "simulation" | "results" | "roadmap";
  primary: {
    eyebrow: string;
    title: string;
    description: string;
    cta: string;
    section: DashboardJourneySection;
  };
  simulation: {
    title: string;
    description: string;
    status: string;
    cta: string;
  };
  steps: Array<{
    number: 1 | 2 | 3;
    title: string;
    description: string;
    cta: string;
    section: DashboardJourneySection;
    state: DashboardJourneyStepState;
  }>;
};

export function buildDashboardJourney(input: {
  hasResumableSimulation: boolean;
  hasCompletedSimulation: boolean;
  hasRoadmap: boolean;
}): DashboardJourney {
  const { hasCompletedSimulation, hasResumableSimulation, hasRoadmap } = input;
  const stage = hasResumableSimulation || !hasCompletedSimulation
    ? "simulation"
    : !hasRoadmap
      ? "results"
      : "roadmap";

  const primary = stage === "simulation"
    ? hasResumableSimulation
      ? {
          eyebrow: "What should I do next?",
          title: "Continue your career simulation",
          description: "Pick up your saved work situation and keep exploring how you approach realistic career decisions.",
          cta: "Continue simulation",
          section: "simulate" as const,
        }
      : {
          eyebrow: "What should I do next?",
          title: "Complete your first simulation",
          description: "This is the best place to start building your PathPilot profile through realistic career decisions.",
          cta: "Start simulation",
          section: "simulate" as const,
        }
    : stage === "results"
      ? {
          eyebrow: "What should I do next?",
          title: "Review your simulation results",
          description: "Your decisions have generated new learning signals and career insights to explore.",
          cta: "Review results",
          section: "simulate" as const,
        }
      : {
          eyebrow: "What should I do next?",
          title: "Continue your personalized roadmap",
          description: "Turn your exploration into the next goal, project, or opportunity in the plan you already own.",
          cta: "Open roadmap",
          section: "roadmap" as const,
        };

  return {
    stage,
    primary,
    simulation: hasResumableSimulation
      ? {
          title: "Career simulation in progress",
          description: "Return to your saved work situation. Your previous decisions and progress are ready when you are.",
          status: "In progress",
          cta: "Continue simulation",
        }
      : hasCompletedSimulation
        ? {
            title: "Explore another career simulation",
            description: "Try a new realistic work situation to add another perspective to your career exploration.",
            status: "Results available",
            cta: "Try another simulation",
          }
        : {
            title: "Complete a career simulation",
            description: "Explore a realistic career scenario and make decisions. Your choices help PathPilot understand how you approach different situations.",
            status: "About 10 decisions · roughly 10 minutes",
            cta: "Start simulation",
          },
    steps: [
      {
        number: 1,
        title: "Complete a simulation",
        description: "Make decisions in realistic career scenarios.",
        cta: hasResumableSimulation ? "Continue simulation" : "Start simulation",
        section: "simulate",
        state: hasCompletedSimulation ? "complete" : "current",
      },
      {
        number: 2,
        title: "Review your results",
        description: "See the learning signals and career insights generated from your simulation.",
        cta: "Review results",
        section: "simulate",
        state: hasRoadmap ? "complete" : hasCompletedSimulation ? "current" : "upcoming",
      },
      {
        number: 3,
        title: "Build your roadmap",
        description: "Turn your results into personalized goals, projects, and opportunities.",
        cta: hasRoadmap ? "Open roadmap" : "Build my roadmap",
        section: "roadmap",
        state: hasRoadmap ? "current" : "upcoming",
      },
    ],
  };
}
