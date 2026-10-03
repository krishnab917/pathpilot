import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

// Time changes the waiting guidance, never claims a backend stage has completed.
export function AiPendingStatus({ operation }: { operation: "mentor" | "roadmap" }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const started = Date.now();
    const timer = setInterval(() => setElapsed(Date.now() - started), 1000);
    return () => clearInterval(timer);
  }, []);
  const detail = elapsed >= 35_000
    ? "This is taking longer than usual. If it cannot finish, you’ll have a chance to review saved results and retry."
    : elapsed >= 12_000
      ? operation === "mentor"
        ? "Still working on your answer. Your question will stay here if you need to retry."
        : "Still preparing your plan. Your current roadmap stays available while this request finishes."
      : operation === "mentor"
        ? "Using your saved context to prepare a useful answer."
        : "Your profile, career direction, and existing plans inform the milestones. The result is checked and saved before it appears.";
  return <div role="status" aria-live="polite" className="my-3 flex items-start gap-3 border border-slate-200 bg-slate-50 px-3 py-3 text-xs dark:border-slate-700 dark:bg-slate-800">
    <Loader2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary motion-safe:animate-spin" />
    <div><p className="font-semibold text-foreground">{operation === "mentor" ? "Thinking through your question…" : "Building your roadmap…"}</p><p className="mt-1 max-w-xl leading-5 text-muted-foreground">{detail}</p></div>
  </div>;
}
