import { describe, expect, it } from "vitest";
import {
  landingCopy,
  landingExperientialEvidence,
  landingFeatureCards,
  landingProofPoints,
  prohibitedLandingClaims,
} from "../client/src/lib/landing-copy";

const allLandingCopy = JSON.stringify({ landingCopy, landingFeatureCards, landingProofPoints, landingExperientialEvidence }).toLowerCase();

describe("landing-page narrative", () => {
  it("centers the hero on career experience rather than a quiz result and provides a value-specific CTA", () => {
    expect(landingCopy.hero.titleLead).toContain("quiz result");
    expect(landingCopy.hero.titleAccent).toContain("Experience");
    expect(landingCopy.hero.cta).toBe("Discover my career path");
    expect(landingCopy.hero.proof).toBe("4 in 5 students want more career exploration opportunities in high school.");
    expect(landingCopy.hero.description).toContain("realistic decisions");
  });

  it("moves students from uncertainty through a five-stage exploration journey without taking away agency", () => {
    expect(landingCopy.story.title).toBe("You shouldn't have to figure out your whole future from a quiz.");
    expect(landingCopy.story.description).toContain("explore before you commit");
    expect(landingCopy.story.workflowTitle).toBe("Don't just choose a career. Experience it.");
    expect(landingCopy.story.workflowDescription).toContain("you remain the person who decides");
    expect(landingCopy.story.stageCta).toBe("Start your journey");
    expect(landingFeatureCards.map(card => card.title)).toEqual([
      "Discover yourself",
      "Explore careers",
      "Experience them",
      "Understand your direction",
      "Take your next step",
    ]);
    expect(landingCopy.closing.title).toBe("From “Maybe” to “What's next.”");
    expect(landingCopy.closing.description).toContain("You don't need all the answers");
  });

  it("uses only the verified, source-attributed proof points in the conversion narrative", () => {
    expect(landingProofPoints.map(point => point.value)).toEqual(["4 in 5", "66%", "49%"]);
    expect(landingProofPoints[0].source).toBe("College Board / Morning Consult");
    expect(landingProofPoints[1].source).toContain("Jobs for the Future");
    expect(landingProofPoints[2].source).toBe("DeBruce Foundation / TeenVoice 2024");
    expect(landingExperientialEvidence.text).toContain("57%");
    expect(landingExperientialEvidence.text).toContain("internship or externship");
    for (const point of landingProofPoints) expect(point.href).toMatch(/^https:\/\//);
  });

  it("does not make mental-health, deterministic, or fear-based claims", () => {
    for (const prohibitedClaim of prohibitedLandingClaims) {
      expect(allLandingCopy).not.toContain(prohibitedClaim);
    }
    expect(allLandingCopy).toContain("at your own pace");
  });
});
