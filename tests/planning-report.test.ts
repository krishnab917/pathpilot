import { describe, expect, it } from "vitest";
import { buildPlanningPrintReport } from "../client/src/lib/planning-report";

describe("planning print report", () => {
  it("formats only neutral saved-plan counts and current focus", () => {
    const report = buildPlanningPrintReport({
      goals: { completed: 2, total: 5, active: 3 },
      projects: { completed: 1, total: 2, active: 1 },
      roadmap: { exists: true, completionPercentage: 40, completed: 3, total: 8 },
      visibleActivityCount: 7,
      focus: { title: "Review your next roadmap milestone", detail: "5 milestones remain in your current roadmap." },
    });
    expect(report.metrics).toEqual([
      { label: "Goals", value: "2/5", detail: "3 active" },
      { label: "Projects", value: "1/2", detail: "1 active" },
      { label: "Roadmap", value: "40%", detail: "3/8 milestones complete" },
      { label: "Recent activity", value: "7", detail: "visible planning actions" },
    ]);
    expect(report.focus.title).toBe("Review your next roadmap milestone");
  });

  it("states the strict privacy boundary for the printable report", () => {
    const report = buildPlanningPrintReport({ goals: { completed: 0, total: 0, active: 0 }, projects: { completed: 0, total: 0, active: 0 }, roadmap: { exists: false, completionPercentage: 0, completed: 0, total: 0 }, visibleActivityCount: 0, focus: { title: "Choose one concrete commitment", detail: "No goals are saved yet." } });
    expect(report.privacyNote).toMatch(/does not include goal or project details, simulation evidence, mentor messages, behavioral assessments, predictions, or recommendations/i);
    expect(report.metrics[2]).toEqual({ label: "Roadmap", value: "Not started", detail: "No active roadmap" });
  });
});
