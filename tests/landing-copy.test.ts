import { describe, expect, it } from "vitest";
import {
  landingCopy,
  landingFeatureCards,
  prohibitedLandingClaims,
} from "../client/src/lib/landing-copy";

const allLandingCopy = JSON.stringify({ landingCopy, landingFeatureCards }).toLowerCase();

describe("landing-page narrative", () => {
  it("centers the hero on career experience rather than a quiz result and provides a value-specific CTA", () => {
    expect(landingCopy.hero.titleLead).toContain("quiz result");
    expect(landingCopy.hero.titleAccent).toContain("Experience");
    expect(landingCopy.hero.cta).toBe("Discover my career path");
    expect(landingCopy.hero.description).toContain("realistic decisions");
  });

  it("tells a discover, experience, and action-oriented product story", () => {
    expect(landingCopy.story.workflowDescription).toContain("discover possibilities");
    expect(landingCopy.story.workflowDescription).toContain("experience realistic decisions");
    expect(landingFeatureCards.map(card => card.title)).toEqual([
      "Discover yourself",
      "Explore and experience",
      "Build direction",
    ]);
    expect(landingCopy.closing.description).toContain("Explore possibilities");
  });

  it("does not make mental-health, deterministic, or fear-based claims", () => {
    for (const prohibitedClaim of prohibitedLandingClaims) {
      expect(allLandingCopy).not.toContain(prohibitedClaim);
    }
    expect(allLandingCopy).toContain("at your own pace");
  });
});
