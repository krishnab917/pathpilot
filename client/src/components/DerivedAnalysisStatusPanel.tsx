import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2, RefreshCw, X } from "lucide-react";

export function DerivedAnalysisStatusPanel() {
  const utils = trpc.useUtils();
  const status = trpc.pathpilot.derivedAnalysis.status.useQuery(undefined, { refetchInterval: query => {
    const state = query.state.data?.job?.status;
    return state === "queued" || state === "running" ? 5_000 : false;
  } });
  const refresh = () => utils.pathpilot.derivedAnalysis.status.invalidate();
  const request = trpc.pathpilot.derivedAnalysis.request.useMutation({ onSuccess: refresh });
  const retry = trpc.pathpilot.derivedAnalysis.retry.useMutation({ onSuccess: refresh });
  const cancel = trpc.pathpilot.derivedAnalysis.cancel.useMutation({ onSuccess: refresh });
  const job = status.data?.job;
  const busy = request.isPending || retry.isPending || cancel.isPending;
  const action = !job || job.status === "completed" && !job.isCurrent ? <Button size="sm" variant="outline" disabled={busy} onClick={() => request.mutate()}>{request.isPending ? <Loader2 className="size-3.5" /> : <RefreshCw className="size-3.5" />}{job ? "Refresh snapshot" : "Prepare snapshot"}</Button> : job.status === "queued" ? <Button size="sm" variant="outline" disabled={busy} onClick={() => cancel.mutate({ id: job.id })}>{cancel.isPending ? <Loader2 className="size-3.5" /> : <X className="size-3.5" />}Cancel</Button> : job.status === "failed" || job.status === "cancelled" ? <Button size="sm" variant="outline" disabled={busy} onClick={() => retry.mutate({ id: job.id })}>{retry.isPending ? <Loader2 className="size-3.5" /> : <RefreshCw className="size-3.5" />}Try again</Button> : null;
  const detail = status.isLoading ? "Checking your private analysis status…" : status.error ? "Status is temporarily unavailable. Your saved simulations are unchanged." : !job ? "Prepare a small private snapshot from completed simulations when you are ready." : job.status === "queued" ? "Your request is waiting to be processed. You can cancel before it starts." : job.status === "running" ? "Your bounded snapshot is being prepared in the background. You can keep using PathPilot." : job.status === "failed" ? "The snapshot could not be prepared. Your source records are unchanged; try again when ready." : job.status === "cancelled" ? "The waiting request was cancelled. Your source records are unchanged." : job.isCurrent ? `Snapshot ready from ${job.snapshot?.includedSimulationCount ?? 0} of your most recent completed simulations.` : "Your completed simulations changed after this snapshot. Refresh when you want an updated version.";
  return <section className="surface-panel mt-4 overflow-hidden" aria-live="polite"><div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center dark:border-slate-700"><div><p className="text-sm font-semibold">Background learning snapshot</p><p className="text-xs text-muted-foreground">Optional, deterministic, and separate from career recommendations.</p></div>{action}</div><div className="p-4"><p className="text-sm leading-6 text-muted-foreground">{detail}</p>{job?.status === "completed" && job.snapshot && <p className="mt-2 text-xs text-muted-foreground">Updated {job.completedAt?.toLocaleString() ?? "recently"} · {job.snapshot.hasEvolvingFocus ? "A practice focus is available in your existing learning summary." : "No practice focus was added."}</p>}{(request.error || retry.error || cancel.error) && <p role="alert" className="mt-3 text-xs text-destructive">{request.error?.message ?? retry.error?.message ?? cancel.error?.message}</p>}<p className="mt-3 text-[11px] leading-5 text-muted-foreground">This job uses only up to five completed simulation summaries. It does not use raw decisions, response timing, behavioral evidence, planning activity, mentor content, scores, or AI. It does not change your plan, recommendations, or profile.</p></div></section>;
}
