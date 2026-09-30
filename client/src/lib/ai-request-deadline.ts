import { TRPCClientError, type TRPCLink } from "@trpc/client";
import { observable } from "@trpc/server/observable";
import type { AppRouter } from "../../../server/routers";

// Also bound reads awaited after generation. Other product requests are unchanged.
const boundedPaths = new Set([
  "pathpilot.discovery.preflight", "pathpilot.discovery.analyze",
  "pathpilot.roadmap.preflight", "pathpilot.roadmap.generate",
  "pathpilot.mentor.send", "pathpilot.mentor.get",
  "pathpilot.projects.guidance", "pathpilot.dashboard.get",
]);

export function aiRequestDeadlineLink(timeoutMs = 70_000): TRPCLink<AppRouter> {
  return () => ({ op, next }) => {
    if (!boundedPaths.has(op.path)) return next(op);
    return observable(observer => {
      const timer = setTimeout(() => {
        observer.error(new TRPCClientError(
          "This request took too long. Reload your saved results before trying again; it may still finish on the server."
        ));
        subscription?.unsubscribe();
      }, timeoutMs);
      const subscription = next(op).subscribe({
        next: value => observer.next(value),
        error: error => { clearTimeout(timer); observer.error(error); },
        complete: () => { clearTimeout(timer); observer.complete(); },
      });
      return () => { clearTimeout(timer); subscription.unsubscribe(); };
    });
  };
}
