export type PlanningReviewInput = {
  goals: Array<{ progress: number; status: string }>;
  projects: Array<{ progress: number; status: string }>;
  roadmap: { completionPercentage: number; milestones: Array<{ progress: number }> } | undefined;
  visibleActivityCount: number;
};

export function buildPlanningReview(input: PlanningReviewInput) {
  const completedGoals = input.goals.filter(goal => goal.progress >= 100 || goal.status === "completed").length;
  const activeGoals = input.goals.filter(goal => goal.progress < 100 && goal.status !== "completed" && goal.status !== "paused").length;
  const completedProjects = input.projects.filter(project => project.progress >= 100 || project.status === "completed").length;
  const activeProjects = input.projects.filter(project => project.progress < 100 && project.status !== "completed" && project.status !== "archived").length;
  const roadmapTotal = input.roadmap?.milestones.length ?? 0;
  const roadmapCompleted = input.roadmap?.milestones.filter(milestone => milestone.progress >= 100).length ?? 0;
  const focus = !input.goals.length
    ? { title: "Choose one concrete commitment", detail: "No goals are saved yet. Add a small next action when you are ready.", section: "goals" as const }
    : input.roadmap && roadmapCompleted < roadmapTotal
      ? { title: "Review your next roadmap milestone", detail: `${roadmapTotal - roadmapCompleted} milestone${roadmapTotal - roadmapCompleted === 1 ? " remains" : "s remain"} in your current roadmap.`, section: "roadmap" as const }
      : activeProjects
        ? { title: "Update one active project", detail: `${activeProjects} active project${activeProjects === 1 ? " is" : "s are"} part of your saved plan.`, section: "portfolio" as const }
        : { title: "Review your current goals", detail: "Use your saved commitments to choose the next action that feels useful to you.", section: "goals" as const };
  return {
    goals: { total: input.goals.length, active: activeGoals, completed: completedGoals },
    projects: { total: input.projects.length, active: activeProjects, completed: completedProjects },
    roadmap: { exists: Boolean(input.roadmap), completionPercentage: input.roadmap?.completionPercentage ?? 0, total: roadmapTotal, completed: roadmapCompleted },
    visibleActivityCount: input.visibleActivityCount,
    focus,
    method: "This review summarizes your saved planning records. It does not assess personality, motivation, ability, or career potential, and it does not change your plan.",
  };
}
