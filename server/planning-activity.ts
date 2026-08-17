export const planningActivityTypes = ["goal_created", "goal_updated", "goal_progress_updated", "goal_completed", "opportunity_saved", "opportunity_dismissed", "opportunity_goal_created"] as const;
export type PlanningActivityType = typeof planningActivityTypes[number];
export type PlanningActivitySubject = "goal" | "opportunity";

export function goalActivity(input: { category: string; estimatedHours: number; deadline?: Date | null; progress?: number; fields?: string[] }) {
  if (input.progress === 100) return { eventType: "goal_completed" as const, metadata: { progress: 100 } };
  if (input.progress !== undefined) return { eventType: "goal_progress_updated" as const, metadata: { progress: input.progress } };
  if (input.fields?.length) return { eventType: "goal_updated" as const, metadata: { fields: input.fields } };
  return { eventType: "goal_created" as const, metadata: { category: input.category, estimatedHours: input.estimatedHours, hasDeadline: Boolean(input.deadline) } };
}
