import {
  type DashboardJourney,
  type DashboardJourneySection,
} from "@/lib/dashboard-journey";
import { cn } from "@/lib/utils";
import { ArrowRight, Check, Circle, Rocket } from "lucide-react";
import { Button } from "./ui/button";

export function DashboardJourneyPanel({
  journey,
  onNavigate,
}: {
  journey: DashboardJourney;
  onNavigate: (section: DashboardJourneySection) => void;
}) {
  return (
    <section
      className="surface-panel mt-4 overflow-hidden border-primary/35"
      aria-labelledby="next-action-title"
    >
      <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
        <div className="border-b border-slate-200 p-5 dark:border-slate-700 lg:border-b-0 lg:border-r">
          <p className="eyebrow">{journey.primary.eyebrow}</p>
          <h2
            id="next-action-title"
            className="mt-2 text-xl font-semibold tracking-[-0.035em] sm:text-2xl"
          >
            {journey.primary.title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {journey.primary.description}
          </p>
          <Button
            className="mt-5 gap-2"
            onClick={() => onNavigate(journey.primary.section)}
          >
            {journey.primary.cta}
            <ArrowRight className="size-4" />
          </Button>
        </div>
        <div className="bg-slate-50 p-5 dark:bg-slate-800/60">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center border border-primary/25 bg-primary/10 text-primary">
              <Rocket className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold">{journey.simulation.title}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {journey.simulation.description}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3 text-xs dark:border-slate-700">
            <span className="status-tag">{journey.simulation.status}</span>
            <button
              type="button"
              className="utility-link inline-flex items-center gap-1"
              onClick={() => onNavigate("simulate")}
            >
              {journey.simulation.cta}
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-200 dark:border-slate-700">
        <div className="px-5 py-3">
          <p className="text-sm font-semibold">Your PathPilot journey</p>
          <p className="mt-1 text-xs text-muted-foreground">
            A clear three-step path from career exploration to your saved plan.
          </p>
        </div>
        <ol className="grid divide-y divide-slate-200 border-t border-slate-200 md:grid-cols-3 md:divide-x md:divide-y-0 dark:divide-slate-700 dark:border-slate-700">
          {journey.steps.map(step => {
            const isCurrent = step.state === "current";
            const isComplete = step.state === "complete";
            return (
              <li
                key={step.number}
                className={cn(
                  "min-w-0 p-4",
                  isCurrent && "bg-primary/5",
                  isComplete && "bg-slate-50/80 dark:bg-slate-800/45"
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "grid size-7 shrink-0 place-items-center border text-xs font-semibold",
                      isCurrent
                        ? "border-primary bg-primary text-primary-foreground"
                        : isComplete
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "border-slate-300 text-muted-foreground dark:border-slate-600"
                    )}
                    aria-label={isComplete ? `Step ${step.number} completed` : `Step ${step.number}`}
                  >
                    {isComplete ? <Check className="size-3.5" aria-hidden="true" /> : step.number}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{step.title}</p>
                      {isComplete ? <span className="status-tag">Completed</span> : null}
                      {isCurrent ? <span className="status-tag">Current</span> : null}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {step.description}
                    </p>
                    <button
                      type="button"
                      className={cn(
                        "mt-3 inline-flex items-center gap-1 text-xs font-semibold",
                        isCurrent ? "text-primary" : "text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => onNavigate(step.section)}
                    >
                      {step.cta}
                      <ArrowRight className="size-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

export function CurrentPlanFocus({
  title,
  description,
  rationale,
  cta,
  onClick,
}: {
  title: string;
  description: string;
  rationale: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <section className="surface-panel mt-4 p-4" aria-labelledby="plan-focus-title">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-2">
            <Circle className="size-3.5 text-muted-foreground" />
            <p className="text-sm font-semibold">Current plan focus</p>
          </div>
          <h2 id="plan-focus-title" className="mt-2 text-sm font-semibold">
            {title}
          </h2>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">
            {description}
          </p>
          <details className="mt-2">
            <summary className="cursor-pointer text-xs font-medium text-primary">
              Why this is relevant
            </summary>
            <p className="mt-2 max-w-3xl text-xs leading-5 text-muted-foreground">
              {rationale}
            </p>
          </details>
        </div>
        <button type="button" className="utility-link shrink-0" onClick={onClick}>
          {cta}
        </button>
      </div>
    </section>
  );
}
