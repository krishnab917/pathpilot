import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export type SimulationCareerOption = { id: string; name: string; category: string; description: string; simulationIntro: string; durationLabel: string };

export function CareerSimulationSelector({ careers, value, onChange }: { careers: readonly SimulationCareerOption[]; value: string; onChange: (careerId: string) => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  useEffect(() => {
    if (!value && careers[0]) onChange(careers[0].id);
  }, [careers, onChange, value]);
  const categories = useMemo(() => Array.from(new Set(careers.map(career => career.category))), [careers]);
  const visible = careers.filter(career => (category === "all" || career.category === category) && `${career.name} ${career.category} ${career.description}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <section aria-label="Choose a career simulation" className="mt-5 space-y-3"><div className="flex flex-col gap-2 sm:flex-row"><label className="relative flex-1"><span className="sr-only">Search supported career simulations</span><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" /><Input className="h-10 pl-9" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search supported careers" /></label><select aria-label="Filter career simulations by category" value={category} onChange={event => setCategory(event.target.value)} className="h-10 border border-slate-200 bg-background px-3 text-sm dark:border-slate-700"><option value="all">All categories</option>{categories.map(item => <option key={item} value={item}>{item}</option>)}</select></div><p aria-live="polite" className="text-xs text-muted-foreground">{visible.length} supported simulation{visible.length === 1 ? "" : "s"} shown. Unsupported careers are not substituted.</p><div role="radiogroup" aria-label="Supported career simulations" className="grid gap-2 sm:grid-cols-2">{visible.map(career => <label key={career.id} className={`cursor-pointer border p-3 ${value === career.id ? "border-primary bg-slate-50 dark:bg-slate-800" : "border-slate-200 dark:border-slate-700"}`}><input className="sr-only" type="radio" name="simulation-career" value={career.id} checked={value === career.id} onChange={() => onChange(career.id)} /><span className="text-sm font-semibold">{career.name}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{career.description}</span><span className="mt-2 block text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{career.category} · {career.durationLabel}</span></label>)}</div>{!visible.length && <p className="border-l-2 border-slate-300 bg-slate-50 p-3 text-xs leading-5 text-muted-foreground dark:bg-slate-800">No supported simulation matches this search. Clear the filters or explore a listed career; PathPilot will not substitute an unrelated simulation.</p>}</section>;
}
