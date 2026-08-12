import { describe, expect, it } from "vitest";
import { buildSimulationFeedback, calculateSimulationScores, hasExactlyFiveUniqueCareerMatches } from "./pathpilot.helpers";

describe("PathPilot career discovery invariant", () => {
  it("accepts exactly five unique career directions", () => {
    expect(hasExactlyFiveUniqueCareerMatches([
      { name: "Data Analyst" }, { name: "Biomedical Engineer" }, { name: "Product Designer" }, { name: "Environmental Scientist" }, { name: "Teacher" },
    ])).toBe(true);
  });

  it("rejects duplicate or incomplete career directions", () => {
    expect(hasExactlyFiveUniqueCareerMatches([
      { name: "Data Analyst" }, { name: "data analyst" }, { name: "Product Designer" }, { name: "Environmental Scientist" }, { name: "Teacher" },
    ])).toBe(false);
    expect(hasExactlyFiveUniqueCareerMatches([{ name: "Data Analyst" }])).toBe(false);
  });
});

describe("PathPilot simulation scoring", () => {
  it("calculates all fit dimensions and a rounded overall score", () => {
    const result = calculateSimulationScores([
      { technicalImpact: 84, leadershipImpact: 63, compatibilityImpact: 74 },
      { technicalImpact: 80, leadershipImpact: 75, compatibilityImpact: 68 },
      { technicalImpact: 76, leadershipImpact: 72, compatibilityImpact: 88 },
    ]);
    expect(result).toEqual({ technicalScore: 80, leadershipScore: 70, careerCompatibilityScore: 77, score: 76 });
    expect(buildSimulationFeedback("Software Engineer", result.technicalScore, result.leadershipScore, result.careerCompatibilityScore)).toContain("leadership judgment");
  });
});
