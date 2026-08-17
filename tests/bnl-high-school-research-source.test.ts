import { describe, expect, it, vi } from "vitest";
import { fetchBnlHighSchoolResearchRecord, parseBnlHighSchoolResearchPage } from "../server/opportunities/bnl-high-school-research-source";

const officialPage = "The High School Research Program is open. Recommended for students that have completed 11th grade. A U.S. citizen or Lawful Permanent Resident (Green Card holder) of the U.S. MAR 20 Friday 5 p.m. 2026 Application Closes. JUL 6 Monday 8:30 a.m. HSRP Starts. AUG 14 Friday 5 p.m. HSRP Ends.";

describe("BNL High School Research Program source", () => {
  it("returns only organizer-published country, grade, and deadline filter values", () => {
    const record = parseBnlHighSchoolResearchPage(officialPage, new Date("2026-08-17T00:00:00Z"));

    expect(record.opportunity).toMatchObject({ countryCodes: ["US"], eligibleGrades: ["Grade 11", "Grade 12"], applicationDeadlineAt: new Date("2026-03-20T21:00:00Z") });
    expect(record.opportunity.eligibilitySummary).toContain("listed 2026 application deadline has passed");
  });

  it("rejects a page that does not confirm the application deadline", () => {
    expect(() => parseBnlHighSchoolResearchPage("The High School Research Program is recommended for students that have completed 11th grade and a U.S. citizen or Lawful Permanent Resident."))
      .toThrow("application deadline");
  });

  it("fetches and parses the official page without relying on a fabricated record", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(officialPage, { status: 200 }));
    await expect(fetchBnlHighSchoolResearchRecord(fetcher)).resolves.toMatchObject({ opportunity: { title: "Brookhaven National Laboratory High School Research Program 2026" } });
    expect(fetcher).toHaveBeenCalledOnce();
  });
});
