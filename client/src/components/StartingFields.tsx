import { startingFields } from "@shared/discovery-intake";
import type { MatchingInput } from "@shared/career-matching";
import type { CareerField } from "@shared/career-taxonomy";
import { useMemo } from "react";
import { Button } from "./ui/button";

export function StartingFields({ input, onExplore }: { input: MatchingInput; onExplore?: (field: CareerField) => void }) {
  const fields = useMemo(() => startingFields(input), [input]);
  return <section aria-labelledby="starting-fields-title" className="space-y-4">
    <header><p className="eyebrow">A starting point, not a destination</p><h2 id="starting-fields-title" className="mt-2 text-2xl font-semibold">Four fields worth a closer look</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">These are suggestions to investigate, not aptitude ratings. With little information, the list is a set of examples rather than a personal verdict. All 108 careers remain available below.</p></header>
    <div className="divide-y divide-border border-y border-border">{fields.map(item => <article key={item.field} className="py-5">
      <p className="text-xs text-muted-foreground">{item.evidence}</p><h3 className="mt-1 text-lg font-semibold">{item.label}</h3>
      <ul className="mt-2 space-y-1 text-sm leading-6">{item.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>
      {item.cautions.map(caution => <p key={caution} className="mt-2 text-sm text-muted-foreground">{caution}</p>)}
      <p className="mt-2 text-sm leading-6">One way to explore: {item.nextStep}</p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.missing.length ? `Still unknown: ${item.missing.slice(0, 3).join(", ")}. Try a field exercise or revise your preferences.` : "Preferences are a starting point; repeated work and reflection can add context."} Field-level weights still need counselor review.</p>
      {onExplore ? <Button variant="outline" className="mt-3" onClick={() => onExplore(item.field)}>Explore this field</Button> : null}
    </article>)}</div>
  </section>;
}
