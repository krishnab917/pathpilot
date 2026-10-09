import type { ReactNode } from "react";
import { CircleHelp, Loader2, TriangleAlert } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="pp-page-header">
      <div className="min-w-0">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action && <div className="pp-page-actions">{action}</div>}
    </header>
  );
}

export function FeedbackState({
  title,
  description,
  action,
  tone = "empty",
  className,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  tone?: "empty" | "loading" | "error";
  className?: string;
}) {
  const Icon =
    tone === "error"
      ? TriangleAlert
      : tone === "loading"
        ? Loader2
        : CircleHelp;
  return (
    <div
      className={cn("pp-feedback", className)}
      data-tone={tone}
      role={
        tone === "error" ? "alert" : tone === "loading" ? "status" : undefined
      }
    >
      <span className="pp-feedback-icon">
        <Icon
          aria-hidden="true"
          className={cn(
            "size-4",
            tone === "loading" && "motion-safe:animate-spin"
          )}
        />
      </span>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
        {action && <div className="mt-4 flex flex-wrap gap-2">{action}</div>}
      </div>
    </div>
  );
}

export function ProgressIndicator({
  value,
  label,
  className,
}: {
  value: number;
  label: string;
  className?: string;
}) {
  const bounded = Number.isFinite(value)
    ? Math.min(100, Math.max(0, value))
    : 0;
  return (
    <div className={cn("pp-progress", className)}>
      <div className="pp-progress-label">
        <span>{label}</span>
        <span>{bounded}%</span>
      </div>
      <Progress value={bounded} aria-label={label} />
    </div>
  );
}
