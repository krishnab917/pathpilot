import { Check, Loader2 } from "lucide-react";

export function AIOperationStatus({ title, detail, complete = false }: { title: string; detail: string; complete?: boolean }) {
  return <div role="status" aria-live="polite" className="mt-3 flex items-start gap-2 border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800">{complete ? <Check className="mt-0.5 size-3.5 shrink-0 text-primary" /> : <Loader2 className="mt-0.5 size-3.5 shrink-0 text-primary" />}<div><p className="font-semibold text-foreground">{title}</p><p className="mt-0.5 leading-5 text-muted-foreground">{detail}</p></div></div>;
}

export function AIOperationLifecycle({ title, detail, stages, activeStage, complete = false }: { title: string; detail: string; stages: string[]; activeStage: number; complete?: boolean }) {
  return <section role="status" aria-live="polite" className="mt-3 border border-slate-200 bg-slate-50 px-3 py-3 text-xs dark:border-slate-700 dark:bg-slate-800"><p className="font-semibold text-foreground">{title}</p><p className="mt-0.5 leading-5 text-muted-foreground">{detail}</p><ol className="mt-3 grid gap-1.5 sm:grid-cols-3">{stages.map((stage, index) => { const isComplete = complete || index < activeStage; const isActive = !complete && index === activeStage; return <li key={stage} className={isActive ? "flex items-center gap-2 font-semibold text-foreground" : "flex items-center gap-2 text-muted-foreground"}>{isComplete ? <Check className="size-3.5 shrink-0 text-primary" /> : isActive ? <Loader2 className="size-3.5 shrink-0 text-primary" /> : <span aria-hidden="true" className="size-3.5 shrink-0 border border-slate-300 dark:border-slate-600" />}{stage}</li>; })}</ol></section>;
}
