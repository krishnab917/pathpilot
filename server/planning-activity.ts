export const planningActivityTypes = ["goal_created", "goal_updated", "goal_progress_updated", "goal_completed", "opportunity_saved", "opportunity_dismissed", "opportunity_goal_created"] as const;
export type PlanningActivityType = typeof planningActivityTypes[number];
export type PlanningActivitySubject = "goal" | "opportunity";
export type PlanningActivityTimelineItem = { id: string; eventType: PlanningActivityType; subjectType: PlanningActivitySubject; title: string; detail: string; createdAt: Date };

export function goalActivity(input: { category: string; estimatedHours: number; deadline?: Date | null; progress?: number; fields?: string[] }) {
  if (input.progress === 100) return { eventType: "goal_completed" as const, metadata: { progress: 100 } };
  if (input.progress !== undefined) return { eventType: "goal_progress_updated" as const, metadata: { progress: input.progress } };
  if (input.fields?.length) return { eventType: "goal_updated" as const, metadata: { fields: input.fields } };
  return { eventType: "goal_created" as const, metadata: { category: input.category, estimatedHours: input.estimatedHours, hasDeadline: Boolean(input.deadline) } };
}

export function presentPlanningActivity(input: { id: string; eventType: PlanningActivityType; subjectType: PlanningActivitySubject; createdAt: Date }): PlanningActivityTimelineItem {
  const labels: Record<PlanningActivityType, { title: string; detail: string }> = {
    goal_created: { title: "Added a goal", detail: "A new commitment was added to your plan." },
    goal_updated: { title: "Updated goal details", detail: "You revised details in one of your commitments." },
    goal_progress_updated: { title: "Updated goal progress", detail: "You recorded progress on a commitment." },
    goal_completed: { title: "Completed a goal", detail: "You marked a commitment complete." },
    opportunity_saved: { title: "Saved an opportunity", detail: "You kept a verified listing for later review." },
    opportunity_dismissed: { title: "Dismissed an opportunity", detail: "You removed a listing from your active view." },
    opportunity_goal_created: { title: "Set an opportunity as a goal", detail: "You turned a verified listing into an editable commitment." },
  };
  return { ...input, ...labels[input.eventType] };
}
