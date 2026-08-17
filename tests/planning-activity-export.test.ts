import { describe, expect, it } from "vitest";
import { buildPlanningActivityCsv } from "../client/src/lib/planning-activity-export";

describe("planning activity export", () => {
  it("exports only neutral fields with safe CSV escaping", () => {
    const csv = buildPlanningActivityCsv([{ activity: "Updated \"project\" progress", subject: "project", recordedAt: new Date("2026-08-17T00:00:00Z") }]);
    expect(csv).toBe("Activity,Subject,Recorded at\n\"Updated \"\"project\"\" progress\",\"project\",\"2026-08-17T00:00:00.000Z\"");
    expect(csv).not.toMatch(/metadata|simulation|mentor/i);
  });
});
