import { AIOperationLifecycle } from "@/components/AIOperationStatus";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import { useLocation } from "wouter";

type CareerMatch = {
  career: {
    name: string;
    description: string;
  };
  matchScore: number;
  reasoning: string;
  nextSteps: string[];
};

type AnalysisState = "idle" | "checking" | "analyzing" | "failed" | "complete";

const stages = ["Checking your profile", "Comparing career directions", "Preparing your matches"];

function safeFailureMessage(error?: unknown) {
  const status = typeof error === "object" && error !== null && "data" in error
    ? (error as { data?: { httpStatus?: unknown } }).data?.httpStatus
    : undefined;
  if (status === 429) {
    return "PathPilot is limiting repeated profile-analysis requests temporarily. Your previous result is still available. Please try again shortly.";
  }
  return "PathPilot couldn’t finish your profile analysis. Your saved profile is unchanged. Please try again.";
}

export function ReliableProfileAnalysis({ matches }: { matches: CareerMatch[] }) {
  const [state, setState] = useState<AnalysisState>(matches.length === 5 ? "complete" : "idle");
  const [failureMessage, setFailureMessage] = useState<string | null>(null);
  const inFlight = useRef(false);
  const utils = trpc.useUtils();
  const [, setLocation] = useLocation();
  const preflight = trpc.pathpilot.discovery.preflight.useMutation();
  const analyze = trpc.pathpilot.discovery.analyze.useMutation();
  const isWorking = state === "checking" || state === "analyzing";
  const hasSavedAnalysis = matches.length === 5;
  const recommendedDirection = matches[0];

  const startAnalysis = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setFailureMessage(null);
    setState("checking");

    try {
      await preflight.mutateAsync();
      setState("analyzing");
      await analyze.mutateAsync();
      await utils.pathpilot.dashboard.get.invalidate();
      setState("complete");
    } catch (error) {
      setState("failed");
      setFailureMessage(safeFailureMessage(error));
    } finally {
      inFlight.current = false;
    }
  };

  return (
    <section className="surface-panel p-5 sm:p-6" aria-labelledby="profile-analysis-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" aria-hidden="true" />
            <h2 id="profile-analysis-title" className="text-base font-semibold">Profile analysis</h2>
          </div>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Review the career directions that currently align with the interests and experiences in your profile. This is exploratory guidance, not a prediction.
          </p>
        </div>
        <Button onClick={() => void startAnalysis()} disabled={isWorking} className="shrink-0">
          {isWorking ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" /> : hasSavedAnalysis ? <RotateCcw className="mr-2 size-4" aria-hidden="true" /> : <Sparkles className="mr-2 size-4" aria-hidden="true" />}
          {isWorking ? "Analyzing profile" : hasSavedAnalysis ? "Refresh analysis" : "Analyze profile"}
        </Button>
      </div>

      {isWorking ? (
        <AIOperationLifecycle
          title={state === "checking" ? "Starting your profile analysis" : "Analyzing your profile"}
          detail={state === "checking" ? "Checking that your saved profile is ready before starting the analysis." : "Comparing your saved interests, skills, and activities with supported career directions. This can take up to about a minute."}
          stages={stages}
          activeStage={state === "checking" ? 0 : 1}
        />
      ) : null}

      {state === "failed" && failureMessage ? (
        <Alert role="alert" className="mt-4 border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100">
          <AlertCircle className="size-4" aria-hidden="true" />
          <AlertTitle>Analysis unavailable</AlertTitle>
          <AlertDescription className="mt-1 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{failureMessage}</span>
            <Button variant="outline" size="sm" onClick={() => void startAnalysis()} disabled={isWorking} className="border-amber-400 bg-transparent text-amber-950 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-100 dark:hover:bg-amber-900/60">
              <RotateCcw className="mr-2 size-3.5" aria-hidden="true" />
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {state === "complete" && !hasSavedAnalysis ? (
        <AIOperationLifecycle title="Profile analysis complete" detail="Your updated career directions are ready below." stages={stages} activeStage={3} complete />
      ) : null}

      {hasSavedAnalysis ? (
        <>
          {recommendedDirection ? (
            <article className="mt-5 border border-primary/35 bg-primary/5 p-4 sm:p-5" aria-labelledby="recommended-direction-title">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <p className="eyebrow">Recommended direction</p>
                  <h3 id="recommended-direction-title" className="mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground">{recommendedDirection.career.name}</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{recommendedDirection.reasoning}</p>
                  {recommendedDirection.nextSteps[0] ? <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-muted-foreground"><ArrowRight className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />Next step: {recommendedDirection.nextSteps[0]}</p> : null}
                  <p className="mt-3 text-xs leading-5 text-muted-foreground">This is your highest current profile-analysis direction based on the information you saved. It is a starting point for exploration, not a prediction.</p>
                </div>
                <Button size="sm" className="shrink-0" onClick={() => setLocation("/app/roadmap")}>Build a roadmap <ArrowRight className="size-3.5" /></Button>
              </div>
            </article>
          ) : null}
          <div className="mt-3 flex items-center justify-between gap-3"><p className="text-sm font-semibold">Explore all five directions</p><p className="text-xs text-muted-foreground">Compare the evidence before choosing your next action.</p></div>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {matches.map((match, index) => (
              <article key={`${match.career.name}-${index}`} className="border border-slate-200 bg-card p-4 dark:border-slate-700">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Direction {index + 1}</p>
                    <h3 className="mt-1 font-semibold text-foreground">{match.career.name}</h3>
                  </div>
                  <span className="font-mono text-sm font-semibold text-primary">{match.matchScore}%</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{match.career.description}</p>
                <p className="mt-3 border-l-2 border-primary/40 pl-3 text-sm leading-6 text-foreground">{match.reasoning}</p>
                {match.nextSteps[0] ? <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-muted-foreground"><ArrowRight className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />{match.nextSteps[0]}</p> : null}
              </article>
            ))}
          </div>
        </>
      ) : state === "idle" ? (
        <div className="mt-5 border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-muted-foreground dark:border-slate-600 dark:bg-slate-800/50">
          <CheckCircle2 className="mr-2 inline size-4 text-primary" aria-hidden="true" />
          Run an analysis when you are ready. You can refresh it later after adding new interests, skills, or activities.
        </div>
      ) : null}
    </section>
  );
}
