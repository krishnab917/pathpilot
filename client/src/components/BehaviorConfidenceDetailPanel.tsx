import { trpc } from "@/lib/trpc";
import { BarChart3, Clock3, Info } from "lucide-react";

const confidenceCopy = {
  initial: "Initial observation",
  building: "Building observation",
  repeated: "Repeated observation",
} as const;

const trendCopy = {
  insufficient: "One included observation so far",
  similar: "Included observations were similar",
  recently_higher: "Most recent included observation was higher",
  recently_lower: "Most recent included observation was lower",
  varied: "Included observations varied by context",
} as const;

function dateLabel(value: Date | null) {
  return value ? new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Not available";
}

export function BehaviorConfidenceDetailPanel() {
  const evolution = trpc.pathpilot.simulations.adaptive.behaviorSummary.useQuery();
  if (evolution.isLoading) return <section className="surface-panel mt-4 p-4"><p className="text-xs text-muted-foreground">Loading simulation observation detail…</p></section>;
  if (evolution.error || !evolution.data) return <section className="surface-panel mt-4 p-4"><p className="text-sm font-semibold">Simulation observation detail</p><p className="mt-2 text-xs leading-5 text-muted-foreground">Complete one work simulation to see the scope and recency of its learning observations. This is not a personal assessment.</p></section>;
  const summary = evolution.data;
  return <section className="surface-panel mt-4 overflow-hidden"><div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700"><div className="flex items-center gap-2"><BarChart3 className="size-4 text-primary" /><div><p className="text-sm font-semibold">Simulation observation detail</p><p className="text-xs text-muted-foreground">Confidence, evidence count, recency, and trend for decision observations in completed work situations.</p></div></div></div><div className="grid divide-y divide-slate-200 dark:divide-slate-700 lg:grid-cols-[0.8fr_1.2fr] lg:divide-x lg:divide-y-0"><div className="p-4"><div className="flex items-center gap-2"><Clock3 className="size-4 text-primary" /><p className="text-xs font-semibold">Scope and recency</p></div><dl className="mt-3 grid grid-cols-2 gap-2"><div className="border border-slate-200 p-3 dark:border-slate-700"><dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Included</dt><dd className="data-value mt-1 text-lg font-semibold">{summary.includedSimulationCount}/{summary.completedSimulationCount}</dd><p className="mt-1 text-[11px] leading-4 text-muted-foreground">most recent completed scenarios</p></div><div className="border border-slate-200 p-3 dark:border-slate-700"><dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Most recent</dt><dd className="mt-1 text-sm font-semibold">{dateLabel(summary.mostRecentCompletedAt)}</dd><p className="mt-1 text-[11px] leading-4 text-muted-foreground">included observation</p></div></dl><div className="mt-3 border-l-2 border-slate-300 bg-slate-50 p-3 dark:border-slate-600 dark:bg-slate-800"><div className="flex items-center gap-2"><Info className="size-3.5 text-primary" /><p className="text-xs font-semibold">How to read this</p></div><p className="mt-1 text-xs leading-5 text-muted-foreground">Confidence shows repetition within these simulations, not ability or potential. Trend compares only included scenario observations; it is not a rank, target, or prediction.</p></div></div><div className="divide-y divide-slate-200 dark:divide-slate-700">{summary.traits.map(item => <article key={item.trait} className="px-4 py-3"><div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center"><div><p className="text-sm font-semibold capitalize">{item.label}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Observed in {item.observations} of {summary.includedSimulationCount} included simulation{summary.includedSimulationCount === 1 ? "" : "s"}.</p></div><span className="status-tag">{confidenceCopy[item.confidence]}</span></div><p className="mt-2 text-xs leading-5 text-muted-foreground">Trend: {trendCopy[item.trend]}</p></article>)}</div></div><p className="border-t border-slate-200 px-4 py-3 text-[11px] leading-5 text-muted-foreground dark:border-slate-700">{summary.method} It excludes response timing, planning activity, goals, projects, mentor content, recommendations, and raw decision records.</p></section>;
}
