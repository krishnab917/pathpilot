import { describe, expect, it, vi } from "vitest";
import { scrollToLandingJourney } from "../client/src/lib/landing-scroll";

describe("landing discovery scroll", () => {
  it("uses smooth scrolling and focuses the explanatory journey by default", () => {
    const scrollIntoView = vi.fn();
    const focus = vi.fn();

    const didScroll = scrollToLandingJourney({
      target: { scrollIntoView, focus },
      prefersReducedMotion: false,
    });

    expect(didScroll).toBe(true);
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it("uses immediate positioning when the user prefers reduced motion", () => {
    const scrollIntoView = vi.fn();

    scrollToLandingJourney({
      target: { scrollIntoView },
      prefersReducedMotion: true,
    });

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "auto", block: "start" });
  });

  it("does nothing when the explanatory section is unavailable", () => {
    expect(scrollToLandingJourney({ target: null, prefersReducedMotion: false })).toBe(false);
  });
});
