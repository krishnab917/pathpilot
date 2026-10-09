import { useId, useState } from "react";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { landingCareerExamples } from "@/lib/landing-product-examples";

const interests = [
  "Making useful tools",
  "Investigating what happened",
  "Finding meaning in data",
];

export function LandingDiscoveryPreview({
  onExplore,
}: {
  onExplore: (career: string) => void;
}) {
  const [selected, setSelected] = useState(0);
  const reduceMotion = useReducedMotion();
  const id = useId();
  const career = landingCareerExamples[selected];
  return (
    <LayoutGroup id={id}>
      <div className="landing-discovery-example">
        <p className="eyebrow">Start with a curiosity</p>
        <h4 className="mt-4 text-2xl font-semibold tracking-tight">
          What kind of work pulls you in?
        </h4>
        <p className="mt-3 text-xs leading-6 text-muted-foreground">
          Explore three example connections, not a personalized assessment. In
          your account, Discovery also considers your background, skills,
          activities, and preferences.
        </p>
        <div
          className="mt-5 grid gap-2"
          role="group"
          aria-label="Example career interests"
        >
          {interests.map((interest, index) => (
            <button
              type="button"
              key={interest}
              className="landing-interest-choice"
              aria-pressed={selected === index}
              onClick={() => setSelected(index)}
            >
              {selected === index && (
                <motion.span
                  layoutId="interest-selection"
                  className="landing-interest-fill"
                  transition={{ duration: reduceMotion ? 0 : 0.22 }}
                />
              )}
              <span className="relative">{interest}</span>
              <ArrowRight aria-hidden="true" className="relative size-4" />
            </button>
          ))}
        </div>
        <div className="landing-discovery-connector" aria-hidden="true">
          <span />
          <ArrowDown className="size-4" />
          <span />
        </div>
        <div
          className="landing-discovery-result"
          aria-live="polite"
          aria-atomic="true"
        >
          <motion.div
            key={career.id}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.24 }}
          >
            <p className="eyebrow">A direction to investigate</p>
            <h4 className="mt-3 text-2xl font-semibold tracking-tight">
              {career.name}
            </h4>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {career.description}
            </p>
            <p className="mt-4 border-l-2 border-primary/30 pl-3 text-xs leading-6">
              Try the work: {career.simulationIntro}
            </p>
          </motion.div>
        </div>
        <Button
          variant="outline"
          className="mt-5"
          onClick={() => onExplore(career.id)}
        >
          Explore this career{" "}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Button>
        <p className="mt-3 text-xs leading-6 text-muted-foreground">
          Descriptions from the actual PathPilot career catalog. Nothing here is
          saved.
        </p>
      </div>
    </LayoutGroup>
  );
}
