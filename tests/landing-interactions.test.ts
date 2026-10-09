import React from "react";
import { Router } from "wouter";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { LandingDiscoveryPreview } from "../client/src/components/LandingDiscoveryPreview";
import { LandingOpportunitiesPreview } from "../client/src/components/LandingOpportunitiesPreview";
import {
  LandingActionJourney,
  LandingRoadmapShowcase,
} from "../client/src/components/LandingActionJourney";
import {
  exampleProjectProgress,
  preparationChapters,
  roadmapStorySteps,
} from "../client/src/lib/landing-story";
import { roadmapTour } from "../client/src/components/LandingRoadmapJourney";
import { landingCareerExamples } from "../client/src/lib/landing-product-examples";

vi.stubGlobal("React", React);

describe("interactive landing presentation contracts", () => {
  it("derives demo progress only from the checked milestones", () => {
    expect(exampleProjectProgress([])).toBe(0);
    for (let mask = 0; mask < 8; mask++) {
      const checked = [0, 1, 2].map(bit => Boolean(mask & (1 << bit)));
      expect(exampleProjectProgress(checked)).toBe(
        Math.round((checked.filter(Boolean).length / 3) * 100)
      );
    }
  });
  it("keeps roadmap selection separate from example progress", () => {
    expect(roadmapStorySteps.map(step => step.progress)).toEqual([100, 20, 0]);
    const html = renderToStaticMarkup(
      React.createElement(
        Router,
        { ssrPath: "/" },
        React.createElement(LandingRoadmapShowcase, { startHref: "/auth" })
      )
    );
    expect(html).toContain('aria-label="Example roadmap milestones"');
    expect(html).toContain('aria-valuenow="20"');
    expect(html).toContain("Selecting a milestone does not mark it complete.");
    expect(html).toContain("Illustrative plan");
    expect(roadmapTour.map(x => x.id)).toEqual(["direction", "milestone", "experience", "project", "goal", "preparation"]);
    for (const step of roadmapTour) expect(html).toContain(`id="path-${step.id}"`);
  });
  it("clearly labels discovery as examples and uses actual public catalog copy", () => {
    const html = renderToStaticMarkup(
      React.createElement(LandingDiscoveryPreview, { onExplore: () => {} })
    );
    expect(html).toContain("not a personalized assessment");
    expect(html).toContain(landingCareerExamples[0].description);
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
    expect(html.match(/aria-pressed="false"/g)).toHaveLength(2);
  });
  it("keeps hero filters labeled, keyboard-scrollable, and distinct from live listings", () => {
    const html = renderToStaticMarkup(
      React.createElement(LandingOpportunitiesPreview, { compact: true })
    );
    expect(html).toContain("not live listings");
    expect(html).toContain("Search titles and summaries");
    expect(html).toContain(
      'aria-label="Example opportunity results" tabindex="0"'
    );
    expect(html).toContain("Source and eligibility details");
    expect(html).not.toContain("Apply now");
  });
  it("renders every college-story chapter even without scroll or motion", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        Router,
        { ssrPath: "/" },
        React.createElement(LandingActionJourney, { startHref: "/auth" })
      )
    );
    for (const chapter of preparationChapters)
      expect(html).toContain(`id="story-${chapter.id}"`);
    expect(html).toContain("not a readiness score");
    expect(html).toContain("not a live AI response");
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('href="/auth"');
    expect(html).toContain("not an admissions predictor");
  });
});
