import { Skeleton } from "@/components/ui/skeleton";
import { workspaceLoadingLabel, type WorkspaceSkeletonSection } from "@/lib/workspace-skeleton";

function Block({ className }: { className: string }) {
  return <Skeleton aria-hidden="true" className={`bg-slate-200 dark:bg-slate-800 ${className}`} />;
}

function LoadingRegion({ label, children }: { label: string; children: React.ReactNode }) {
  return <section aria-busy="true" aria-label={label}><span className="sr-only" role="status">{label}</span>{children}</section>;
}

function SectionHeadingSkeleton() {
  return <div className="mb-5"><Block className="h-3 w-28" /><Block className="mt-3 h-8 w-64 max-w-full" /><Block className="mt-3 h-4 w-full max-w-xl" /><Block className="mt-2 h-4 w-4/5 max-w-lg" /></div>;
}

function TableRows({ columns = 5, rows = 5 }: { columns?: number; rows?: number }) {
  return <div className="divide-y divide-slate-200 dark:divide-slate-700">{Array.from({ length: rows }, (_, row) => <div key={row} className="grid min-h-14 grid-cols-[48px_minmax(180px,1.8fr)_minmax(100px,1fr)_minmax(80px,0.7fr)_72px] items-center gap-3 px-4"><Block className="h-3 w-6" />{Array.from({ length: Math.max(1, columns - 1) }, (_, column) => <Block key={column} className={column === 0 ? "h-3 w-3/4" : "h-3 w-2/3"} />)}</div>)}</div>;
}

function OverviewSkeleton() {
  return <><SectionHeadingSkeleton /><div className="grid border border-slate-200 bg-card md:grid-cols-3 dark:border-slate-700">{Array.from({ length: 3 }, (_, index) => <div key={index} className="border-b border-slate-200 p-4 last:border-b-0 dark:border-slate-700 md:border-b-0 md:border-r md:last:border-r-0"><Block className="h-3 w-20" /><Block className="mt-4 h-8 w-14" /><Block className="mt-2 h-3 w-4/5" /></div>)}</div><div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_0.9fr]"><section className="surface-panel overflow-hidden"><div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700"><Block className="h-4 w-28" /><Block className="mt-2 h-3 w-52" /></div><TableRows columns={3} rows={4} /></section><section className="surface-panel overflow-hidden"><div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700"><Block className="h-4 w-20" /></div><TableRows columns={2} rows={4} /></section></div><div className="mt-4 grid gap-4 lg:grid-cols-2">{Array.from({ length: 2 }, (_, index) => <section key={index} className="surface-panel p-4"><Block className="h-4 w-36" /><Block className="mt-4 h-3 w-full" /><Block className="mt-2 h-3 w-4/5" /><Block className="mt-4 h-7 w-28" /></section>)}</div></>;
}

function DiscoverSkeleton() {
  return <><SectionHeadingSkeleton /><section className="surface-panel overflow-hidden"><div className="border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800"><div className="grid grid-cols-[56px_minmax(180px,1.8fr)_minmax(100px,1fr)_minmax(80px,0.7fr)_72px] gap-3">{Array.from({ length: 5 }, (_, index) => <Block key={index} className="h-3 w-3/5" />)}</div></div><TableRows rows={5} /></section></>;
}

function RoadmapSkeleton() {
  return <><SectionHeadingSkeleton /><section className="surface-panel mb-4 p-4"><Block className="h-4 w-44" /><Block className="mt-3 h-3 w-full max-w-xl" /><div className="mt-4 flex gap-2"><Block className="h-9 w-48" /><Block className="h-9 w-28" /></div></section><section className="surface-panel overflow-hidden"><div className="border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800"><div className="grid grid-cols-[48px_minmax(180px,1.8fr)_minmax(90px,0.7fr)_minmax(90px,0.7fr)_64px_72px] gap-3">{Array.from({ length: 6 }, (_, index) => <Block key={index} className="h-3 w-3/5" />)}</div></div><TableRows columns={6} rows={6} /></section></>;
}

function SimulationSkeleton() {
  return <><SectionHeadingSkeleton /><section className="surface-panel max-w-3xl overflow-hidden"><div className="flex justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700"><Block className="h-3 w-32" /><Block className="h-5 w-24" /></div><div className="p-4"><Block className="h-1.5 w-full" /><Block className="mt-6 h-7 w-3/5" /><Block className="mt-4 h-4 w-full" /><Block className="mt-2 h-4 w-11/12" /><div className="mt-6 border border-slate-200 dark:border-slate-700">{Array.from({ length: 3 }, (_, index) => <div key={index} className="grid grid-cols-[24px_1fr_16px] items-center gap-3 border-b border-slate-200 p-3 last:border-b-0 dark:border-slate-700"><Block className="size-6" /><Block className="h-4 w-4/5" /><Block className="size-4" /></div>)}</div></div></section></>;
}

export function PortfolioTableSkeleton() {
  return <LoadingRegion label="Loading project portfolio"><section className="surface-panel overflow-hidden"><div className="border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800"><div className="grid grid-cols-[minmax(180px,1.8fr)_minmax(120px,1fr)_90px_72px_72px] gap-3">{Array.from({ length: 5 }, (_, index) => <Block key={index} className="h-3 w-3/5" />)}</div></div><TableRows rows={5} /></section></LoadingRegion>;
}

export function MentorConversationSkeleton() {
  return <LoadingRegion label="Loading career mentor"><section className="grid gap-4 xl:grid-cols-[0.72fr_1.28fr]"><aside className="surface-panel p-4"><Block className="h-4 w-32" /><div className="mt-4 divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-700 dark:border-slate-700">{Array.from({ length: 3 }, (_, index) => <div key={index} className="flex justify-between py-3"><Block className="h-3 w-20" /><Block className="h-3 w-14" /></div>)}</div></aside><section className="surface-panel flex min-h-72 flex-col p-4"><Block className="h-3 w-2/5 self-end" /><Block className="mt-4 h-14 w-4/5" /><Block className="mt-4 h-10 w-3/5 self-end" /><div className="mt-auto border-t border-slate-200 pt-3 dark:border-slate-700"><Block className="h-10 w-full" /></div></section></section></LoadingRegion>;
}

export function RoadmapRecommendationSkeleton() {
  return <LoadingRegion label="Preparing recommendations from your simulation"><section className="space-y-4"><article className="surface-panel p-4"><Block className="h-3 w-36" /><Block className="mt-3 h-5 w-56" /><Block className="mt-3 h-4 w-full max-w-2xl" /><Block className="mt-2 h-4 w-4/5" /></article><section className="surface-panel overflow-hidden"><div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700"><Block className="h-4 w-44" /><Block className="mt-2 h-3 w-72" /></div><div className="divide-y divide-slate-200 dark:divide-slate-700">{Array.from({ length: 4 }, (_, index) => <div key={index} className="p-4"><div className="flex justify-between gap-4"><div className="flex-1"><Block className="h-4 w-2/5" /><Block className="mt-3 h-3 w-full" /><Block className="mt-2 h-3 w-4/5" /></div><Block className="h-8 w-16" /></div></div>)}</div></section></section></LoadingRegion>;
}

export function SimulationDecisionSkeleton() {
  return <LoadingRegion label="Restoring simulation"><SimulationSkeleton /></LoadingRegion>;
}

export function WorkspaceSectionSkeleton({ section }: { section: WorkspaceSkeletonSection }) {
  const label = workspaceLoadingLabel(section);
  const content = { overview: <OverviewSkeleton />, discover: <DiscoverSkeleton />, roadmap: <RoadmapSkeleton />, simulate: <SimulationSkeleton />, portfolio: <PortfolioTableSkeleton />, opportunities: <DiscoverSkeleton />, mentor: <MentorConversationSkeleton />, goals: <DiscoverSkeleton /> }[section];
  return <LoadingRegion label={label}>{content}</LoadingRegion>;
}
