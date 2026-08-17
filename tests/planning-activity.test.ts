import { describe, expect, it } from "vitest";
import { goalActivity } from "../server/planning-activity";

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
});
