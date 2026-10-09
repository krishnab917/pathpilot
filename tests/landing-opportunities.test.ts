import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  filterOpportunityExamples,
  opportunityExamples,
  previewCareers,
} from "../client/src/lib/landing-opportunities";
import { explainOpportunityRelevance } from "../server/opportunities/relevance";

describe("public opportunity sample", () => {
  it("combines search, category, and catalog-domain alignment", () => {
    expect(
      filterOpportunityExamples("  NASA SPACE ", "competition", true).map(
        x => x.id
      )
    ).toEqual(["2026-space-apps-challenge"]);
    expect(filterOpportunityExamples("NASA", "research", true)).toEqual([]);
    expect(filterOpportunityExamples("", "research", true, "Designer")).toEqual(
      []
    );
    expect(
      filterOpportunityExamples("", "research", false, "Designer").map(
        x => x.id
      )
    ).toEqual(["hsrp-2026"]);
    expect(filterOpportunityExamples("", "", true, "Teacher")).toEqual([]);
    expect(filterOpportunityExamples("", "internship", false)).toEqual([]);
  });
  it("keeps domain matching consistent with the real relevance layer", () => {
    for (const career of previewCareers)
      for (const item of opportunityExamples) {
        const reasons = explainOpportunityRelevance(
          {
            careerDomains: [...item.careerDomains],
            countryCodes: [],
            eligibleGrades: [],
          },
          {
            careerDirections: [career.name],
            careerDomains: [...career.domains],
            countryCode: null,
            grade: null,
          }
        );
        expect(
          filterOpportunityExamples("", "", true, career.name).includes(item)
        ).toBe(reasons.length > 0);
      }
  });
  it("uses existing named catalog records and source URLs, never invented availability", () => {
    for (const [id, file] of [
      ["2026-space-apps-challenge", "nasa-space-apps-source"],
      ["hsrp-2026", "bnl-high-school-research-source"],
    ]) {
      const item = opportunityExamples.find(x => x.id === id)!;
      const source = readFileSync(
        new URL(`../server/opportunities/${file}.ts`, import.meta.url),
        "utf8"
      );
      expect(source).toContain(item.title);
      expect(source).toContain(item.summary);
      expect(source).toContain(item.sourceUrl);
    }
    expect(
      opportunityExamples.find(x => x.id === "hsrp-2026")?.recordNote
    ).toContain("Historical");
    expect(
      opportunityExamples.every(
        x => new URL(x.applicationUrl).protocol === "https:"
      )
    ).toBe(true);
    expect(new Set(opportunityExamples.map(x => x.id)).size).toBe(
      opportunityExamples.length
    );
    expect(JSON.stringify(opportunityExamples)).not.toMatch(
      /Apply now|registration is open/i
    );
  });
  it("clears filters without mutating the sample", () => {
    const snapshot = JSON.stringify(opportunityExamples);
    expect(filterOpportunityExamples("missing", "", false)).toEqual([]);
    expect(filterOpportunityExamples("", "", false)).toEqual(
      opportunityExamples
    );
    expect(JSON.stringify(opportunityExamples)).toBe(snapshot);
  });
});
