export type DashboardSection = "discover" | "roadmap" | "simulate" | "portfolio" | "opportunities" | "goals";
export type DashboardNextAction = { section: DashboardSection; cta: string; title: string; description: string; rationale: string };
type Goal = { title: string; status: string; progress: number; deadline: Date | null };
type Project = { name: string; status: string; progress: number };
type Milestone = { title: string; category: string; progress: number };
type Match = { career: { name: string }; matchScore: number };
type SavedOpportunity = { title: string; sourceDateLabel: string | null } | null;

const daysUntil = (date: Date, now: Date) => Math.ceil((date.getTime() - now.getTime()) / 86_400_000);

export function buildDashboardNextAction(input: { matches: Match[]; goals: Goal[]; roadmap: { targetCareer: string; milestones: Milestone[] } | undefined; projects: Project[]; savedOpportunity: SavedOpportunity; hasCompletedSimulation: boolean; now?: Date }): DashboardNextAction {
  const now = input.now ?? new Date();
  const datedGoal = input.goals.filter(goal => goal.status !== "completed" && goal.status !== "paused" && goal.deadline).sort((a, b) => a.deadline!.getTime() - b.deadline!.getTime())[0];
  if (datedGoal && daysUntil(datedGoal.deadline!, now) <= 14) {
    const days = daysUntil(datedGoal.deadline!, now);
    return { section: "goals", cta: "Open goal", title: `Advance “${datedGoal.title}”`, description: days < 0 ? "This goal is overdue. Review its scope, deadline, or next concrete step." : days === 0 ? "This goal is due today. Choose one small step that moves it forward." : `This is due in ${days} days. Make progress before adding another commitment.`, rationale: `This is the nearest active goal with a real deadline saved in your plan. The recommendation is based on that date and current ${datedGoal.progress}% progress.` };
  }
  const activeProject = input.projects.find(project => project.status === "in_progress" && project.progress < 100);
  if (activeProject) return { section: "portfolio", cta: "Continue project", title: `Continue “${activeProject.name}”`, description: `You already have an in-progress project at ${activeProject.progress}%. Build evidence there before starting a separate project.`, rationale: "This recommendation prioritizes an existing in-progress project so your effort remains connected to work you have already started." };
  if (input.savedOpportunity) return { section: "opportunities", cta: "Review opportunity", title: `Review “${input.savedOpportunity.title}”`, description: "You saved this opportunity. Confirm its current details and decide whether it belongs in your plan.", rationale: input.savedOpportunity.sourceDateLabel ? `This is a saved opportunity with source timing recorded as ${input.savedOpportunity.sourceDateLabel}; PathPilot does not infer a deadline when one is not verified.` : "This is an opportunity you saved. PathPilot does not infer an application deadline when one is not verified." };
  if (!input.matches.length) return { section: "discover", cta: "Discover directions", title: "Discover career directions", description: "Start with five grounded directions based on the profile you have already saved.", rationale: "No career-match analysis is available yet, so PathPilot cannot responsibly prioritize a simulation, roadmap, or project." };
  if (!input.hasCompletedSimulation) return { section: "simulate", cta: "Run a simulation", title: `Try ${input.matches[0]!.career.name} in context`, description: "Use a branching work scenario to add a decision-based learning signal before committing to a plan.", rationale: `Your strongest current direction is ${input.matches[0]!.career.name}, but no completed adaptive simulation is available yet.` };
  if (!input.roadmap) return { section: "roadmap", cta: "Build roadmap", title: "Turn your exploration into a plan", description: "Create an editable roadmap from your current career direction and completed simulation.", rationale: "You have career directions and a completed simulation, but no active roadmap is saved yet." };
  const nextMilestone = input.roadmap.milestones.find(milestone => milestone.progress < 100);
  if (nextMilestone) return { section: "roadmap", cta: nextMilestone.category === "project" ? "Start project step" : "Open roadmap", title: `Advance “${nextMilestone.title}”`, description: `Continue the next incomplete ${nextMilestone.category} step in your ${input.roadmap.targetCareer} roadmap.`, rationale: `This is the first incomplete milestone in your active roadmap. Its ${nextMilestone.progress}% progress keeps the recommendation tied to work you already chose.` };
  return { section: "goals", cta: "Create next goal", title: "Choose your next concrete goal", description: "Your current roadmap is complete. Add one focused goal to keep your momentum visible.", rationale: "All saved roadmap milestones are complete, and no nearer dated goal, in-progress project, or saved opportunity is competing for attention." };
}
