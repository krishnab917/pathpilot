import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { checkWork, workSubmissionSchema, type PublicWorkTask, type WorkReceipt, type WorkSubmission } from "../../../shared/simulation-work";

type Props = { runId: string; nodeId: string; task: PublicWorkTask; pending: boolean; error?: string; localOnly?: boolean; onSubmit: (work: WorkSubmission) => void };

export function SimulationWorkbench({ runId, nodeId, task, pending, error, localOnly = false, onSubmit }: Props) {
  const storageKey = `pathpilot-work-v1:${runId}:${nodeId}`;
  const [draft, setDraft] = useState<WorkSubmission>(() => {
    try {
      const saved = workSubmissionSchema.safeParse(localOnly ? null : JSON.parse(sessionStorage.getItem(storageKey) ?? "null"));
      if (saved.success && saved.data.nodeId === nodeId) return saved.data;
    } catch { /* Storage is optional; saving a stage still uses the existing API. */ }
    return { nodeId, inspected: [], values: {}, trials: [] };
  });
  const [opened, setOpened] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<ReturnType<typeof checkWork> | null>(null);
  const [localError, setLocalError] = useState("");
  const submitted = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
  useEffect(() => { if (!pending) submitted.current = false; }, [pending, error]);
  useEffect(() => { if (localOnly) return; try { sessionStorage.setItem(storageKey, JSON.stringify(draft)); } catch { /* Continue without draft caching. */ } }, [draft, storageKey, localOnly]);

  const inspect = (id: string) => {
    setOpened(id);
    setDraft(value => ({ ...value, inspected: Array.from(new Set([...value.inspected, id])) }));
  };
  const evaluate = () => {
    try {
      const result = checkWork(task, draft.values);
      setFeedback(result); setLocalError("");
      setDraft(value => ({ ...value, trials: [...value.trials, { ...value.values }].slice(-4) }));
    } catch (cause) { setLocalError(cause instanceof Error ? cause.message : "Complete the work before checking it."); }
  };
  const submit = () => {
    if (pending || submitted.current) return;
    try {
      checkWork(task, draft.values);
      if (!draft.inspected.length) throw new Error("Open an assignment resource before submitting.");
      submitted.current = true; setLocalError(""); onSubmit(draft);
    } catch (cause) { submitted.current = false; setLocalError(cause instanceof Error ? cause.message : "Please check your work."); }
  };
  const used = task.kind === "allocate" ? Object.values(draft.values).reduce((sum, value) => sum + (Number(value) || 0), 0) : null;
  return <section className="min-w-0 space-y-5" aria-busy={pending}>
    <div><p className="eyebrow">Work stage {task.stage} of {task.totalStages} · Fictional assignment</p><h3 ref={heading} tabIndex={-1} className="mt-2 text-lg font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">Your workbench</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{task.instruction}</p></div>
    {task.previousOutcome ? <p role="status" className="border-l-2 border-primary bg-muted p-3 text-sm leading-6">{task.previousOutcome}</p> : null}
    <div className="grid min-w-0 gap-5 lg:grid-cols-[0.8fr_1.2fr]">
      <aside className="min-w-0"><h4 className="text-sm font-semibold">Assignment resources</h4><div className="mt-3 flex flex-wrap gap-2">{task.evidence.map(item => <Button type="button" key={item.id} variant={opened === item.id ? "default" : "outline"} className="h-auto min-h-11 whitespace-normal text-left" aria-pressed={opened === item.id} onClick={() => inspect(item.id)} disabled={pending}>{item.title}{draft.inspected.includes(item.id) ? " · Opened" : ""}</Button>)}</div><div className="mt-3 min-w-0 border border-border bg-muted/40 p-4 text-sm leading-6 break-words" aria-live="polite">{task.evidence.find(item => item.id === opened)?.content ?? "Open the notes and review criteria to inspect the evidence before working."}</div><p className="mt-3 text-xs leading-5 text-muted-foreground">Use only the fictional information supplied here. There is no countdown. You can check and revise before submitting.</p></aside>
      <div className="min-w-0 border border-border p-4"><h4 className="text-sm font-semibold">{task.kind === "sequence" ? "Workflow order" : task.kind === "allocate" ? "Resource ledger" : task.kind === "calculate" ? "Calculation sheet" : "Working artifact"}</h4>{used !== null ? <p className="mt-2 text-sm" role="status">Allocated {used} / {task.budget} {task.unit}. Remaining {task.budget! - used}.</p> : null}<div className="mt-4 space-y-4">{task.fields.map(field => <label key={field.id} className="block min-w-0"><span className="block text-sm font-medium">{field.label}</span>{field.options ? <select className="mt-2 min-h-11 w-full min-w-0 rounded-md border border-input bg-background px-2 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring" value={draft.values[field.id] ?? ""} disabled={pending} onChange={event => { setFeedback(null); setDraft(value => ({ ...value, values: { ...value.values, [field.id]: event.target.value } })); }}><option value="" disabled>{task.kind === "sequence" ? "Choose position" : "Assign a value"}</option>{field.options.map(option => <option key={option} value={option}>{task.kind === "sequence" ? `Position ${option}` : option}</option>)}</select> : <input type="number" min={0} max={task.budget ?? 1000000} step="0.01" inputMode="decimal" className="mt-2 min-h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring" disabled={pending} value={draft.values[field.id] ?? ""} onChange={event => { setFeedback(null); setDraft(value => ({ ...value, values: { ...value.values, [field.id]: event.target.value } })); }} />}</label>)}</div></div>
    </div>
    {feedback ? <div role="status" className="border border-border bg-muted/30 p-4"><h4 className="text-sm font-semibold">Workbench check</h4><ul className="mt-2 space-y-2 text-sm leading-6">{feedback.map(item => <li key={item.label}><span className="font-medium">{item.passed ? "Meets check" : "Review needed"}: {item.label}.</span> {item.explanation}</li>)}</ul><p className="mt-3 text-xs text-muted-foreground">These checks apply only to this simplified assignment. Revise any field, or submit open checks and learn from the next stage.</p></div> : null}
    {localError || error ? <p role="alert" className="text-sm text-destructive">{localError || error}</p> : null}
    <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={pending} onClick={evaluate}>Check artifact</Button><Button disabled={pending} onClick={submit}>{pending ? "Saving work…" : "Submit work and continue"}</Button></div><p className="text-xs leading-5 text-muted-foreground">{localOnly ? "This field exercise stays on this screen only. It is not saved to your profile or simulation history." : "Drafts stay in this tab when browser storage is available. Submitted stages are saved to your simulation history."}</p>
  </section>;
}

export function SimulationWorkDebrief({ receipts, nextStep, note }: { receipts: WorkReceipt[]; nextStep?: string; note: string }) {
  return <section className="surface-panel min-w-0 space-y-5 p-4 sm:p-5"><div><p className="eyebrow">Your assignment record</p><h2 className="mt-2 text-xl font-semibold">What you made and what changed</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{note}</p></div>{receipts.map((receipt, index) => <article key={index} className="border-t border-border pt-4"><h3 className="font-semibold">{receipt.title}</h3><p className="mt-2 text-sm">{receipt.checks.filter(check => check.passed).length} of {receipt.checks.length} assignment checks met. {receipt.tests} recorded workbench checks{receipt.revised ? "; revised after a check" : ""}.</p><p className="mt-2 text-xs leading-5 text-muted-foreground">Opened: {receipt.inspected.join(", ")}. Opening a resource does not establish that it was understood.</p><dl className="mt-3 space-y-2">{receipt.artifact.map(item => <div key={item.label} className="flex flex-wrap justify-between gap-2 border-b border-border pb-2 text-sm"><dt>{item.label}</dt><dd className="font-medium">{item.value}</dd></div>)}</dl><ul className="mt-3 space-y-2 text-sm leading-6">{receipt.checks.map(check => <li key={check.label}><strong>{check.passed ? "Met" : "Revisit"}: {check.label}.</strong> {check.explanation}</li>)}</ul></article>)}<p className="border-l-2 border-primary p-3 text-sm leading-6"><strong>Try next:</strong> {nextStep}</p><a href="/app/portfolio" className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">Open Projects to plan your next experiment</a></section>;
}
