import { describe, expect, it } from "vitest";
import {
  PLANNING_REPORT_SHARE_DURATION_MS,
  createPlanningReportShareToken,
  hashPlanningReportShareToken,
  isPlanningReportShareToken,
  planningReportShareExpiresAt,
  toSharedPlanningReport,
} from "../server/report-share";

describe("planning report share helpers", () => {
  it("creates a valid 43-character base64url token and rejects malformed tokens", () => {
    const token = createPlanningReportShareToken();

    expect(token).toHaveLength(43);
    expect(isPlanningReportShareToken(token)).toBe(true);
    expect(isPlanningReportShareToken("short-token")).toBe(false);
    expect(isPlanningReportShareToken(`${token}+`)).toBe(false);
  });

  it("hashes the same token deterministically without returning the token", () => {
    const token = "a".repeat(43);
    const firstHash = hashPlanningReportShareToken(token);
    const secondHash = hashPlanningReportShareToken(token);

    expect(firstHash).toBe(secondHash);
    expect(firstHash).toHaveLength(64);
    expect(firstHash).not.toBe(token);
  });

  it("sets the share-link expiry exactly seven days after the supplied time", () => {
    const now = new Date("2026-08-17T12:00:00.000Z");
    const expiresAt = planningReportShareExpiresAt(now);

    expect(expiresAt.getTime() - now.getTime()).toBe(PLANNING_REPORT_SHARE_DURATION_MS);
    expect(expiresAt.toISOString()).toBe("2026-08-24T12:00:00.000Z");
  });

  it("projects only neutral planning-report fields and excludes private details", () => {
    const privateReview = {
      goals: { completed: 2, total: 5, active: 3 },
      projects: { completed: 1, total: 2, active: 1 },
      roadmap: { exists: true, completionPercentage: 40, completed: 3, total: 8 },
      visibleActivityCount: 7,
      focus: { title: "Review your next roadmap milestone", detail: "Five milestones remain." },
      method: "Counts are derived from saved planning records.",
      studentName: "Private student name",
      goalDescriptions: ["Private goal detail"],
      simulationEvidence: ["Private simulation decision"],
      mentorMessages: ["Private mentor message"],
      recommendations: ["Private recommendation"],
    };

    const shared = toSharedPlanningReport(privateReview);

    expect(Object.keys(shared).sort()).toEqual(["focus", "goals", "method", "privacyNote", "projects", "roadmap", "visibleActivityCount"]);
    expect(shared).toMatchObject({
      goals: privateReview.goals,
      projects: privateReview.projects,
      roadmap: privateReview.roadmap,
      visibleActivityCount: 7,
      focus: privateReview.focus,
      method: privateReview.method,
    });
    expect(shared).not.toHaveProperty("studentName");
    expect(shared).not.toHaveProperty("goalDescriptions");
    expect(shared).not.toHaveProperty("simulationEvidence");
    expect(shared).not.toHaveProperty("mentorMessages");
    expect(shared).not.toHaveProperty("recommendations");
    expect(shared.privacyNote).toMatch(/does not include names, descriptions, resources, links, simulation evidence, mentor messages, behavioral assessments, predictions, or recommendations/i);
  });
});
