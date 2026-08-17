import { describe, expect, it } from "vitest";
import { goalActivity, presentPlanningActivity } from "../server/planning-activity";

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
});
