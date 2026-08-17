import { describe, expect, it } from "vitest";
import { buildPlanningReview } from "../server/planning-review";

describe("planning review", () => {
  it("summarizes saved goal, project, roadmap, and visible activity state without interpretation", () => {
    const review = buildPlanningReview({
      goals: [{ progress: 100, status: "completed" }, { progress: 30, status: "in_progress" }],
      projects: [{ progress: 100, status: "completed" }, { progress: 20, status: "in_progress" }],
      roadmap: { completionPercentage: 40, milestones: [{ progress: 100 }, { progress: 0 }, { progress: 20 }] },
      visibleActivityCount: 7,
    });
    expect(review).toMatchObject({ goals: { total: 2, active: 1, completed: 1 }, projects: { total: 2, active: 1, completed: 1 }, roadmap: { exists: true, completionPercentage: 40, total: 3, completed: 1 }, visibleActivityCount: 7, focus: { section: "roadmap" } });
    expect(review.method).toMatch(/does not assess personality, motivation, ability, or career potential/i);
  });

  it("directs an empty plan to the existing goal workspace without changing data", () => {
    const review = buildPlanningReview({ goals: [], projects: [], roadmap: undefined, visibleActivityCount: 0 });
    expect(review.focus).toMatchObject({ title: "Choose one concrete commitment", section: "goals" });
    expect(review.roadmap).toMatchObject({ exists: false, completionPercentage: 0, total: 0, completed: 0 });
  });
});
