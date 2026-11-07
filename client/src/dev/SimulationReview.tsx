import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { SimulationWorkbench, SimulationWorkDebrief } from "../components/SimulationWorkbench";
import { Button } from "../components/ui/button";
import { simulationCareerCatalog } from "../../../server/simulation/catalog";
import { chooseSimulationDecision, getPublicScenario, getWorkSimulationGraph, initialSimulationState } from "../../../server/simulation/engine";
import { workDebrief } from "../../../server/simulation/work-graphs";
import type { BehavioralEvent, BehavioralEvidence, DecisionRecord } from "../../../server/simulation/contracts";
import type { WorkSubmission } from "../../../shared/simulation-work";
import "../index.css";

// Local fixture only. No authenticated routes, API calls, provider calls, or student records.
if (!import.meta.env.DEV) throw new Error("Simulation review is development-only.");
function Review() {
  const [career, setCareer] = useState(simulationCareerCatalog[0].id);
  const [generation, setGeneration] = useState(0);
  const [dark, setDark] = useState(false);
  return <main className="mx-auto max-w-5xl p-3 sm:p-6"><header className="mb-6 space-y-3"><h1 className="text-2xl font-semibold">Simulation review</h1><p className="text-sm text-muted-foreground">Local fictional fixtures. No account, API, or database writes. Submitted stages reset on page refresh; drafts survive within this tab.</p><div className="flex flex-wrap gap-3"><label className="min-w-0 flex-1 text-sm">Career<select className="mt-2 min-h-11 w-full min-w-0 border border-input bg-background px-2" value={career} onChange={event => setCareer(event.target.value)}>{simulationCareerCatalog.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><Button variant="outline" onClick={() => { document.documentElement.classList.toggle("dark", !dark); setDark(!dark); }}>{dark ? "Light theme" : "Dark theme"}</Button><Button variant="outline" onClick={() => setGeneration(value => value + 1)}>Restart fixture</Button></div></header><Run key={`${career}:${generation}`} career={career} generation={generation} /></main>;
}
function Run({ career, generation }: { career: string; generation: number }) {
  const graph = getWorkSimulationGraph(career);
  const [run, setRun] = useState(() => ({ state: initialSimulationState(graph), history: [] as DecisionRecord[], evidence: [] as BehavioralEvidence[], events: [] as BehavioralEvent[], completed: false }));
  const [error, setError] = useState("");
  const [failNext, setFailNext] = useState(false);
  const advance = (decision: string, work?: WorkSubmission) => {
    if (failNext) { setError("Fixture save failed. Your draft is still here; retry when ready."); setFailNext(false); return; }
    try { setRun(chooseSimulationDecision(graph, run.state, decision, run.evidence, run.history, run.events, work)); setError(""); } catch (cause) { setError(String(cause)); }
  };
  if (run.completed) return <div className="space-y-4"><h2 className="text-xl font-semibold">Assignment complete</h2><p>{run.events.at(-1)?.message}</p><SimulationWorkDebrief {...workDebrief(graph, run.history)!} /></div>;
  const scenario = getPublicScenario(graph, run.state);
  return <div className="space-y-5"><h2 className="text-xl font-semibold">{scenario.title}</h2><p className="text-sm leading-6 text-muted-foreground">{scenario.situation}</p><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={failNext} onChange={event => setFailNext(event.target.checked)} />Simulate next save failure (fixture only)</label>{scenario.work ? <SimulationWorkbench key={scenario.id} runId={`fixture-${career}-${generation}`} nodeId={scenario.id} task={scenario.work} pending={false} error={error} onSubmit={work => advance("submit-work", work)} /> : <div className="space-y-3">{scenario.decisions.map(item => <Button key={item.id} className="h-auto min-h-11 w-full whitespace-normal text-left" onClick={() => advance(item.id)}>{item.label}</Button>)}</div>}</div>;
}
createRoot(document.getElementById("root")!).render(<Review />);
