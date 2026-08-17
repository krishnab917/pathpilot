export type PlanningReportInput = {
  goals: { completed: number; total: number; active: number };
  projects: { completed: number; total: number; active: number };
  roadmap: { exists: boolean; completionPercentage: number; completed: number; total: number };
  visibleActivityCount: number;
  focus: { title: string; detail: string };
};

export function buildPlanningPrintReport(input: PlanningReportInput) {
  return {
    title: "PathPilot planning report",
    subtitle: "A private snapshot of the planning records you have chosen to save.",
    metrics: [
      { label: "Goals", value: `${input.goals.completed}/${input.goals.total}`, detail: `${input.goals.active} active` },
      { label: "Projects", value: `${input.projects.completed}/${input.projects.total}`, detail: `${input.projects.active} active` },
      { label: "Roadmap", value: input.roadmap.exists ? `${input.roadmap.completionPercentage}%` : "Not started", detail: input.roadmap.exists ? `${input.roadmap.completed}/${input.roadmap.total} milestones complete` : "No active roadmap" },
      { label: "Recent activity", value: String(input.visibleActivityCount), detail: "visible planning actions" },
    ],
    focus: input.focus,
    privacyNote: "This report contains saved planning counts and a current focus only. It does not include goal or project details, simulation evidence, mentor messages, behavioral assessments, predictions, or recommendations.",
  };
}
