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
    expect(landingCopy.hero.description).toContain("whole future figured out");
    expect(landingCopy.hero.description).toContain("realistic decisions");
  });

  it("moves students from uncertainty through a five-stage exploration journey without taking away agency", () => {
    expect(landingCopy.story.title).toBe("Feeling stuck about your future?");
    expect(landingCopy.story.description).toContain("Too many choices. Too little clarity.");
    expect(landingCopy.story.workflowTitle).toBe("Don't guess. Explore.");
    expect(landingCopy.story.workflowDescription).toContain("you remain the person who decides");
    expect(landingFeatureCards.map(card => card.title)).toEqual([
      "Discover yourself",
      "Explore careers",
      "Experience them",
      "Understand your direction",
      "Take your next step",
    ]);
    expect(landingCopy.closing.title).toBe("You don't need all the answers.");
    expect(landingCopy.closing.description).toContain("Turn uncertainty into clarity.");
  });

  it("does not make mental-health, deterministic, or fear-based claims", () => {
    for (const prohibitedClaim of prohibitedLandingClaims) {
      expect(allLandingCopy).not.toContain(prohibitedClaim);
    }
    expect(allLandingCopy).toContain("at your own pace");
  });
});
