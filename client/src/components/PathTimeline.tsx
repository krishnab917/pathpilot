import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { ProgressIndicator } from "@/components/ProductPrimitives";

export type PathStep = {
  id: string;
  title: string;
  description: string;
  progress: number;
  metadata: ReactNode;
  action?: ReactNode;
};

/** Presentation only: saved progress determines state, never elapsed time or predictions. */
export function PathTimeline({
  steps,
  label = "Roadmap milestones",
}: {
  steps: PathStep[];
  label?: string;
}) {
  const current = steps.findIndex(step => step.progress < 100);
  return (
    <ol className="pp-timeline" aria-label={label}>
      {steps.map((step, index) => {
        const complete = step.progress >= 100;
        const state = complete
          ? "complete"
          : index === current
            ? "current"
            : "upcoming";
        return (
          <li
            key={step.id}
            className="pp-timeline-item"
            data-state={state}
            aria-current={state === "current" ? "step" : undefined}
          >
            <span className="pp-path-marker" aria-hidden="true">
              {complete ? (
                <Check className="size-4" />
              ) : (
                String(index + 1).padStart(2, "0")
              )}
            </span>
            <article className="surface-panel min-w-0 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-muted-foreground">
                  {step.metadata}
                </div>
                <span className="status-tag">
                  {complete
                    ? "Complete"
                    : state === "current"
                      ? "Next incomplete milestone"
                      : "Upcoming"}
                </span>
              </div>
              <h3 className="mt-3 text-lg font-medium leading-snug tracking-tight">
                {step.title}
              </h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                {step.description}
              </p>
              <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <ProgressIndicator
                  value={step.progress}
                  label="Saved progress"
                  className="w-full sm:max-w-56"
                />
                {step.action && (
                  <div className="flex flex-wrap gap-2">{step.action}</div>
                )}
              </div>
            </article>
          </li>
        );
      })}
    </ol>
  );
}
