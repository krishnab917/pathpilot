import { describe, expect, it } from "vitest";
import { goalActivity, presentPlanningActivity, projectActivity, roadmapMilestoneActivity } from "../server/planning-activity";

describe("planning activity classifier", () => {
  it("records only bounded operational context when a goal is created", () => {
    const activity = goalActivity({ category: "opportunity", estimatedHours: 2, deadline: null });
    expect(activity).toEqual({ eventType: "goal_created", metadata: { category: "opportunity", estimatedHours: 2, hasDeadline: false } });
    expect(JSON.stringify(activity)).not.toContain("personality");
  });

  it("classifies progress and completed updates without retaining goal content", () => {
    expect(goalActivity({ category: "skill", estimatedHours: 4, progress: 50 })).toEqual({ eventType: "goal_progress_updated", metadata: { progress: 50 } });
    expect(goalActivity({ category: "skill", estimatedHours: 4, progress: 100 })).toEqual({ eventType: "goal_completed", metadata: { progress: 100 } });
  });

  it("records an explicit edit field list rather than values", () => {
    expect(goalActivity({ category: "skill", estimatedHours: 4, fields: ["title", "deadline", "resources"] })).toEqual({ eventType: "goal_updated", metadata: { fields: ["title", "deadline", "resources"] } });
  });

  it("projects a neutral student-visible event without personality or recommendation language", () => {
    const item = presentPlanningActivity({ id: "11111111-1111-4111-8111-111111111111", eventType: "opportunity_goal_created", subjectType: "opportunity", createdAt: new Date("2026-08-17T00:00:00Z") });
    expect(item).toMatchObject({ title: "Set an opportunity as a goal", detail: "You turned a verified listing into an editable commitment." });
    expect(JSON.stringify(item)).not.toMatch(/personality|diagnos|recommendation/i);
  });

  it("classifies roadmap and project progress with numeric metadata only", () => {
    expect(roadmapMilestoneActivity(40)).toEqual({ eventType: "roadmap_milestone_progress_updated", metadata: { progress: 40 } });
    expect(roadmapMilestoneActivity(100)).toEqual({ eventType: "roadmap_milestone_completed", metadata: { progress: 100 } });
    expect(projectActivity({ progress: 65 })).toEqual({ eventType: "project_progress_updated", metadata: { progress: 65 } });
    expect(projectActivity({ progress: 100, status: "completed" })).toEqual({ eventType: "project_completed", metadata: { progress: 100 } });
  });

  it("records only status and roadmap-link presence when a project is created", () => {
    const activity = projectActivity({ status: "in_progress", hasRoadmapMilestone: true });
    expect(activity).toEqual({ eventType: "project_created", metadata: { hasRoadmapMilestone: true, status: "in_progress" } });
    expect(JSON.stringify(activity)).not.toMatch(/name|description|github|personality/i);
  });
});
