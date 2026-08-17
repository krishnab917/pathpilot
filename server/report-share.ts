import { createHash, randomBytes } from "node:crypto";

export const PLANNING_REPORT_SHARE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
export const PLANNING_REPORT_SHARE_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export type SharedPlanningReportInput = {
  goals: { completed: number; total: number; active: number };
  projects: { completed: number; total: number; active: number };
  roadmap: { exists: boolean; completionPercentage: number; completed: number; total: number };
  visibleActivityCount: number;
  focus: { title: string; detail: string };
  method: string;
};

export function createPlanningReportShareToken() {
  return randomBytes(32).toString("base64url");
}

export function hashPlanningReportShareToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function isPlanningReportShareToken(token: string) {
  return PLANNING_REPORT_SHARE_TOKEN_PATTERN.test(token);
}

export function planningReportShareExpiresAt(now = new Date()) {
  return new Date(now.getTime() + PLANNING_REPORT_SHARE_DURATION_MS);
}

export function toSharedPlanningReport(value: SharedPlanningReportInput) {
  return {
    goals: value.goals,
    projects: value.projects,
    roadmap: value.roadmap,
    visibleActivityCount: value.visibleActivityCount,
    focus: value.focus,
    method: value.method,
    privacyNote: "This shared report contains planning counts and a current focus only. It does not include names, descriptions, resources, links, simulation evidence, mentor messages, behavioral assessments, predictions, or recommendations.",
  };
}
