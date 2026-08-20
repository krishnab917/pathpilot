export type LandingJourneyTarget = {
  scrollIntoView: (options: ScrollIntoViewOptions) => void;
  focus?: (options?: FocusOptions) => void;
};

export function scrollToLandingJourney({
  target,
  prefersReducedMotion,
}: {
  target: LandingJourneyTarget | null;
  prefersReducedMotion: boolean;
}) {
  if (!target) return false;
  target.scrollIntoView({
    behavior: prefersReducedMotion ? "auto" : "smooth",
    block: "start",
  });
  target.focus?.({ preventScroll: true });
  return true;
}
