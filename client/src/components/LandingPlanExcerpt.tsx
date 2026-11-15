import { Check, ArrowRight } from "lucide-react";
import { ProgressIndicator } from "@/components/ProductPrimitives";
import { roadmapStorySteps } from "@/lib/landing-story";

/** The same fictional roadmap used by the full public product tour. */
export function LandingPlanExcerpt() {
  return (
    <aside className="landing-plan-excerpt" aria-label="Illustrative PathPilot roadmap">
      <div className="landing-plan-caption">
        <span className="eyebrow">Inside PathPilot</span>
        <span>Illustrative plan · Not a student record</span>
      </div>
      <div className="landing-plan-heading">
        <p className="text-sm text-muted-foreground">A direction to explore</p>
        <h2>Software Engineer</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Connect what interests you to something you can try.
        </p>
      </div>
      <ol className="landing-plan-steps">
        {roadmapStorySteps.map((step, index) => (
          <li key={step.id} data-current={index === 1}>
            <span className="landing-plan-marker" aria-hidden="true">
              {index === 0 ? <Check className="size-4" /> : String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <p className="text-xs text-muted-foreground">{step.kind} · {index === 0 ? "Complete" : index === 1 ? "Current focus" : "Up next"}</p>
              <h3 className="mt-1 text-sm font-medium leading-6">{step.title}</h3>
              {index === 1 && <div className="mt-3"><ProgressIndicator value={step.progress} label="Example progress" /></div>}
            </div>
          </li>
        ))}
      </ol>
      <a className="landing-plan-next" href="#college-preparation">
        <span>Build experiences for college applications</span>
        <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
      </a>
    </aside>
  );
}
