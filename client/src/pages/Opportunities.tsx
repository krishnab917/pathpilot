import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Input } from "@/components/ui/input";
import { notify } from "@/lib/notifications";
import { invalidatePlanningSummariesAndActivity } from "@/lib/planning-cache-invalidation";
import { opportunitySearchQueryOptions, staticMetadataQueryOptions } from "@/lib/query-policies";
import { trpc } from "@/lib/trpc";
import { CalendarDays, ChevronLeft, ChevronRight, ExternalLink, Filter, Loader2, MapPin, Search, ShieldCheck, Target } from "lucide-react";
import { useMemo, useState } from "react";

type Category = "internship" | "competition" | "research";

type Opportunity = {
  id: string;
  title: string;
  summary: string;
  category: Category;
  participationMode: string;
  locationLabel: string;
  sourceDateLabel: string | null;
  careerDomains: string[];
  countryCodes: string[];
  eligibleGrades: string[];
  startAt: Date | null;
  endAt: Date | null;
  registrationOpensAt: Date | null;
  applicationDeadlineAt: Date | null;
  eligibilitySummary: string;
  applicationUrl: string;
  sourceUrl: string;
  sourceName: string;
  verifiedAt: Date;
  savedStatus: "saved" | "dismissed" | null;
  alignedCareers: string[];
  relevanceReasons: string[];
};

const categories: { value: Category; label: string }[] = [
  { value: "internship", label: "Internships" },
  { value: "competition", label: "Competitions" },
  { value: "research", label: "Research" },
];
export const OPPORTUNITY_SEARCH_DEBOUNCE_MS = 300;

const dateLabel = (value: Date | null) => value ? new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Not listed";
const dateRange = (start: Date | null, end: Date | null, sourceDateLabel: string | null) => sourceDateLabel ?? (start && end ? `${dateLabel(start)} – ${dateLabel(end)}` : "Dates on source page");

function OpportunityCard({ opportunity, onSetGoal, onSetState, isUpdating }: { opportunity: Opportunity; onSetGoal: (id: string) => void; onSetState: (id: string, status: "saved" | "dismissed") => void; isUpdating: boolean }) {
  const [showGoalConfirmation, setShowGoalConfirmation] = useState(false);
  const deadlineIsPast = Boolean(opportunity.applicationDeadlineAt && opportunity.applicationDeadlineAt.getTime() < Date.now());

  return <article className="p-4">
    <div className="flex flex-col justify-between gap-4 lg:flex-row">
      <div className="min-w-0">
        <div className="flex flex-wrap gap-2">
          <span className="status-tag">{opportunity.category}</span>
          <span className="status-tag">{opportunity.participationMode.replaceAll("_", " ")}</span>
          {opportunity.alignedCareers.length > 0 && <span className="status-tag">Aligned to {opportunity.alignedCareers.slice(0, 2).join(" · ")}</span>}
          {opportunity.savedStatus === "saved" && <span className="status-tag">Saved</span>}
        </div>
        <h2 className="mt-3 text-base font-semibold">{opportunity.title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{opportunity.summary}</p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" />{dateRange(opportunity.startAt, opportunity.endAt, opportunity.sourceDateLabel)}</span>
          <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" />{opportunity.locationLabel}</span>
          {opportunity.eligibleGrades.length > 0 && <span>Published grades: {opportunity.eligibleGrades.join(", ")}</span>}
          {opportunity.countryCodes.length > 0 && <span>Published countries: {opportunity.countryCodes.join(", ")}</span>}
        </div>
        {opportunity.applicationDeadlineAt && <p className="mt-3 text-xs text-muted-foreground">{deadlineIsPast ? "Organizer-published deadline (past):" : "Organizer-published application deadline:"} <span className="data-value">{dateLabel(opportunity.applicationDeadlineAt)}</span>. Confirm current status with the organizer before acting.</p>}
        {opportunity.registrationOpensAt && <p className="mt-3 text-xs text-muted-foreground">Registration is listed to open on <span className="data-value">{dateLabel(opportunity.registrationOpensAt)}</span>; verify the current status with the organizer.</p>}
        {opportunity.relevanceReasons.length > 0 && <details className="mt-3 border-l-2 border-primary/50 pl-3"><summary className="cursor-pointer text-xs font-medium text-primary">Why this may fit your saved information</summary><ul className="mt-2 space-y-1 text-xs leading-5 text-muted-foreground">{opportunity.relevanceReasons.map(reason => <li key={reason}>{reason}</li>)}</ul></details>}
        <details className="mt-3"><summary className="cursor-pointer text-xs font-medium text-primary">Source and eligibility details</summary><p className="mt-2 max-w-3xl text-xs leading-5 text-muted-foreground">{opportunity.eligibilitySummary}</p><p className="mt-2 text-xs text-muted-foreground">Listed by <a className="utility-link" href={opportunity.sourceUrl} target="_blank" rel="noreferrer">{opportunity.sourceName}</a>; checked on {dateLabel(opportunity.verifiedAt)}.</p></details>
      </div>
      <div className="flex shrink-0 flex-wrap items-start gap-2">
        <Button size="sm" variant="outline" asChild><a href={opportunity.applicationUrl} target="_blank" rel="noreferrer">Source page <ExternalLink className="size-3.5" /></a></Button>
        <Button size="sm" variant="outline" onClick={() => setShowGoalConfirmation(current => !current)}><Target className="size-3.5" />Set as goal</Button>
        <Button size="sm" variant={opportunity.savedStatus === "saved" ? "outline" : "default"} disabled={isUpdating} onClick={() => onSetState(opportunity.id, opportunity.savedStatus === "saved" ? "dismissed" : "saved")}>{isUpdating ? <Loader2 className="size-3.5" /> : opportunity.savedStatus === "saved" ? "Remove" : "Save"}</Button>
      </div>
    </div>
    {showGoalConfirmation && <aside className="mt-4 border-l-2 border-primary/60 bg-slate-50 p-3 dark:bg-slate-800"><p className="text-xs font-semibold">Add this verified listing as an editable goal?</p><p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">PathPilot will add the organizer links and eligibility summary. It will not set a deadline from listed program dates; confirm current details with the organizer before acting.</p><div className="mt-3 flex gap-2"><Button size="sm" onClick={() => onSetGoal(opportunity.id)}>Create goal</Button><Button size="sm" variant="outline" onClick={() => setShowGoalConfirmation(false)}>Cancel</Button></div></aside>}
  </article>;
}

export default function Opportunities() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const profile = trpc.pathpilot.profile.get.useQuery();
  const countryOptions = trpc.pathpilot.profile.countryOptions.useQuery(undefined, staticMetadataQueryOptions);
  const [category, setCategory] = useState<Category | undefined>();
  const [alignedOnly, setAlignedOnly] = useState(true);
  const [search, setSearch] = useState("");
  const [countryCode, setCountryCode] = useState<string | undefined>();
  const [grade, setGrade] = useState<string | undefined>();
  const [deadlineOnly, setDeadlineOnly] = useState(false);
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, OPPORTUNITY_SEARCH_DEBOUNCE_MS);
  const gradeOptions = useMemo(() => Array.from(new Set(["Grade 9", "Grade 10", "Grade 11", "Grade 12", profile.data?.grade].filter((value): value is string => Boolean(value)))).sort(), [profile.data?.grade]);
  const input = useMemo(() => ({ category, alignedOnly, search: debouncedSearch.trim() || undefined, countryCode, grade, deadlineOnly, page, pageSize: 12 }), [alignedOnly, category, countryCode, deadlineOnly, debouncedSearch, grade, page]);
  const opportunities = trpc.pathpilot.opportunities.list.useQuery(input, opportunitySearchQueryOptions);
  const updateState = trpc.pathpilot.opportunities.setState.useMutation({ onSuccess: () => utils.pathpilot.opportunities.list.invalidate() });
  const createGoal = trpc.pathpilot.opportunities.createGoal.useMutation({ onSuccess: result => { utils.pathpilot.goals.list.invalidate(); void invalidatePlanningSummariesAndActivity(utils); notify.success(result.created ? "Opportunity added as an editable goal." : "This opportunity is already linked to one of your goals."); } });
  const refreshCatalog = trpc.pathpilot.opportunities.refreshCuratedCatalog.useMutation({ onSuccess: result => { utils.pathpilot.opportunities.list.invalidate(); notify.success(`${result.imported} popular opportunities refreshed from their source directories.`); } });
  const result = opportunities.data;
  const items = (result?.items ?? []) as Opportunity[];
  const hasFilters = Boolean(category || search || countryCode || grade || deadlineOnly || !alignedOnly);
  const noResultDetail = deadlineOnly ? "No listing in this view has an organizer-published application deadline. Clear that filter to include listings whose deadline is not verified." : countryCode || grade ? "No listing in this view has matching organizer-published country or grade eligibility. Clear that filter to include listings with unknown eligibility." : "Try another search or category. PathPilot does not create substitute listings when a source has no matching records.";
  const resetPageAnd = (operation: () => void) => { operation(); setPage(1); };
  const resetFilters = () => { setCategory(undefined); setAlignedOnly(true); setSearch(""); setCountryCode(undefined); setGrade(undefined); setDeadlineOnly(false); setPage(1); };

  return <>
    <header className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="eyebrow">Popular opportunities</p><h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">Find opportunities that fit your direction.</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Search the verified catalog, then use transparent context from your saved directions and organizer-published details to review what may be relevant.</p></div>{user?.role === "admin" && <Button size="sm" variant="outline" disabled={refreshCatalog.isPending} onClick={() => refreshCatalog.mutate()}>{refreshCatalog.isPending ? <Loader2 className="size-3.5" /> : "Refresh popular catalog"}</Button>}</header>
    <section className="surface-panel mb-4 border-primary/30 p-4"><div className="flex gap-3"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" /><div><p className="text-sm font-semibold">A popular listing is not a personal eligibility decision.</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Country, grade, deadline, and relevance explanations use only organizer-published data or information you explicitly saved. PathPilot does not use behavioral signals, mentor content, diagnoses, or predictions to order opportunities.</p></div></div></section>
    <section className="surface-panel mb-4 overflow-hidden"><div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-700"><Filter className="size-4 text-primary" /><div><p className="text-sm font-semibold">Refine the verified catalog</p><p className="text-xs text-muted-foreground">Filters never assume local availability, grade eligibility, or a missing deadline.</p></div></div><div className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,0.75fr))]"><label className="relative"><span className="sr-only">Search verified opportunities</span><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={event => resetPageAnd(() => setSearch(event.target.value))} className="pl-9" placeholder="Search title or summary" /></label><label><span className="sr-only">Filter by verified country availability</span><select value={countryCode ?? ""} onChange={event => resetPageAnd(() => setCountryCode(event.target.value || undefined))} className="h-9 w-full border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"><option value="">Any verified country</option>{countryOptions.data?.map(country => <option key={country.code} value={country.code}>{country.label}</option>)}</select></label><label><span className="sr-only">Filter by organizer-published grade</span><select value={grade ?? ""} onChange={event => resetPageAnd(() => setGrade(event.target.value || undefined))} className="h-9 w-full border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"><option value="">Any published grade</option>{gradeOptions.map(option => <option key={option} value={option}>{option}</option>)}</select></label><label className="flex h-9 items-center gap-2 border border-input bg-background px-3 text-sm"><input type="checkbox" checked={deadlineOnly} onChange={event => resetPageAnd(() => setDeadlineOnly(event.target.checked))} className="size-3.5 accent-primary" />Organizer-published deadline</label></div><div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700"><div className="flex flex-wrap gap-2" aria-label="Opportunity categories"><Button size="sm" variant={!category ? "default" : "outline"} onClick={() => resetPageAnd(() => setCategory(undefined))}>All</Button>{categories.map(item => <Button key={item.value} size="sm" variant={category === item.value ? "default" : "outline"} onClick={() => resetPageAnd(() => setCategory(item.value))}>{item.label}</Button>)}</div><div className="flex flex-wrap gap-2"><Button size="sm" variant={alignedOnly ? "default" : "outline"} onClick={() => resetPageAnd(() => setAlignedOnly(current => !current))}>{alignedOnly ? "Showing career-aligned" : "Showing all directions"}</Button>{hasFilters && <Button size="sm" variant="outline" onClick={resetFilters}>Reset filters</Button>}</div></div></section>
    {refreshCatalog.error && <p role="alert" className="mb-4 border border-destructive/30 px-4 py-3 text-sm text-destructive">{refreshCatalog.error.message}</p>}
    {opportunities.isLoading ? <section className="surface-panel divide-y divide-slate-200 dark:divide-slate-700">{Array.from({ length: 5 }, (_, index) => <div key={index} className="p-4"><div className="h-4 w-2/5 bg-slate-200 dark:bg-slate-800" /><div className="mt-3 h-3 w-full bg-slate-200 dark:bg-slate-800" /></div>)}</section> : opportunities.error ? <section className="surface-panel border-destructive/30 p-4 text-sm text-destructive">{opportunities.error.message}</section> : !items.length ? <section className="surface-panel p-6"><p className="font-semibold">No opportunities match this view yet.</p><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{noResultDetail}</p>{hasFilters && <Button size="sm" variant="outline" className="mt-4" onClick={resetFilters}>Reset filters</Button>}</section> : <section className="surface-panel overflow-hidden"><div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center dark:border-slate-700"><div><p className="text-sm font-semibold">{result?.totalCount} verified {result?.totalCount === 1 ? "listing" : "listings"}</p><p className="data-value mt-1 text-xs text-muted-foreground">Page {result?.page} of {result?.totalPages}</p></div><details className="max-w-lg text-xs text-muted-foreground"><summary className="cursor-pointer font-medium text-primary">How relevance order works</summary><p className="mt-2 leading-5">{result?.relevanceMethod}</p></details></div><div className="divide-y divide-slate-200 dark:divide-slate-700">{items.map(opportunity => <OpportunityCard key={opportunity.id} opportunity={opportunity} isUpdating={updateState.isPending} onSetGoal={opportunityId => createGoal.mutate({ opportunityId })} onSetState={(opportunityId, status) => updateState.mutate({ opportunityId, status })} />)}</div>{(result?.totalPages ?? 0) > 1 && <footer className="flex items-center justify-between border-t border-slate-200 px-4 py-3 dark:border-slate-700"><Button size="sm" variant="outline" disabled={(result?.page ?? 1) <= 1} onClick={() => setPage(current => Math.max(1, current - 1))}><ChevronLeft className="size-3.5" />Previous</Button><p className="text-xs text-muted-foreground">Showing {items.length} of {result?.totalCount} matched listings</p><Button size="sm" variant="outline" disabled={!result?.hasNextPage} onClick={() => setPage(current => current + 1)}>Next<ChevronRight className="size-3.5" /></Button></footer>}{updateState.error && <p role="alert" className="border-t border-slate-200 px-4 py-3 text-sm text-destructive dark:border-slate-700">{updateState.error.message}</p>}{createGoal.error && <p role="alert" className="border-t border-slate-200 px-4 py-3 text-sm text-destructive dark:border-slate-700">{createGoal.error.message}</p>}</section>}
  </>;
}
