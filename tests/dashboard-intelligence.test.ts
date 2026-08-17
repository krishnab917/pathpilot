import { describe, expect, it } from "vitest";
import { buildDashboardNextAction } from "../server/dashboard/intelligence";

const base = { matches: [{ career: { name: "Data Scientist" }, matchScore: 84 }], goals: [], roadmap: undefined, projects: [], savedOpportunity: null, hasCompletedSimulation: false, now: new Date("2026-08-17T12:00:00Z") };

describe("dashboard next-best-action logic", () => {
  it("progresses from discovery to simulation before proposing a roadmap", () => {
    expect(buildDashboardNextAction({ ...base, matches: [] }).section).toBe("discover");
    expect(buildDashboardNextAction(base)).toMatchObject({ section: "simulate", cta: "Run a simulation" });
    expect(buildDashboardNextAction({ ...base, hasCompletedSimulation: true })).toMatchObject({ section: "roadmap", cta: "Build roadmap" });
  });

  it("prioritizes an imminent real goal deadline over an in-progress project", () => {
    const action = buildDashboardNextAction({ ...base, hasCompletedSimulation: true, roadmap: { targetCareer: "Data Scientist", milestones: [] }, projects: [{ name: "Climate model", status: "in_progress", progress: 60 }], goals: [{ title: "Submit research outline", status: "in_progress", progress: 25, deadline: new Date("2026-08-22T12:00:00Z") }] });
    expect(action).toMatchObject({ section: "goals", title: "Advance “Submit research outline”" });
    expect(action.rationale).toContain("real deadline");
  });

  it("never fabricates a deadline when a saved opportunity only has source timing", () => {
    const action = buildDashboardNextAction({ ...base, hasCompletedSimulation: true, roadmap: { targetCareer: "Data Scientist", milestones: [] }, savedOpportunity: { title: "Student Research Program", sourceDateLabel: "Updated August 2026" } });
    expect(action).toMatchObject({ section: "opportunities", cta: "Review opportunity" });
    expect(action.rationale).toContain("does not infer a deadline");
  });
});
