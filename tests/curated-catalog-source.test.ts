import { describe, expect, it } from "vitest";
import { parseHackClubDirectory, parsePathwaysSummerResearch } from "../server/opportunities/curated-catalog-source";

describe("curated opportunity source adapters", () => {
  it("keeps Hack Club organizer links as popular competition records", () => {
    const records = parseHackClubDirectory('<a href="https://example.org"><h3>Example Hacks</h3><span>Online · August 12–14</span></a>');
    expect(records).toEqual([expect.objectContaining({ title: "Example Hacks", category: "competition", applicationUrl: "https://example.org/", sourceSlug: "hack-club" })]);
  });

  it("normalizes PathwaysToScience details as research or internship records", () => {
    const records = parsePathwaysSummerResearch('<div><a href="programhub.aspx?sort=demo">Summer Research Program</a><span>A public research program for biology students.</span></div><div><a href="programhub.aspx?sort=intern">Summer Internship Program</a></div>');
    expect(records).toHaveLength(2);
    expect(records.map(record => record.category)).toEqual(["research", "internship"]);
    expect(records[0]?.applicationUrl).toContain("programhub.aspx?sort=demo");
  });
});
