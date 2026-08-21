import { useAuth } from "@/_core/hooks/useAuth";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import {
  landingCopy,
  landingExperientialEvidence,
  landingFeatureCards,
  landingProofPoints,
} from "@/lib/landing-copy";
import { scrollToLandingJourney } from "@/lib/landing-scroll";
import { startLogin } from "@/const";
import { ArrowRight, Compass, Map, Rocket, SearchCheck, Sparkles, Target } from "lucide-react";
import { Link } from "wouter";

const featureIcons = [Compass, SearchCheck, Rocket, Sparkles, Map] as const;

export default function Home() {
  const { isAuthenticated } = useAuth();
  const workspaceHref = isAuthenticated ? "/app" : undefined;
  const scrollToJourney = () => {
    scrollToLandingJourney({
      target: document.getElementById("how-it-works"),
      prefersReducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    });
  };
  const primaryAction = workspaceHref ? (
    <Link href={workspaceHref}>
      {landingCopy.hero.cta} <ArrowRight className="ml-2 size-4" />
    </Link>
  ) : (
    <>
      {landingCopy.hero.cta} <ArrowRight className="ml-2 size-4" />
    </>
  );

  return (
    <main className="min-h-screen overflow-hidden bg-[#fcfcfd]">
      <header className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Brand />
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link href="/app">
              <Button variant="outline" className="rounded-xl">
                Open workspace
              </Button>
            </Link>
          ) : (
            <Button
              variant="ghost"
              className="hidden rounded-xl sm:inline-flex"
              onClick={() => startLogin()}
            >
              Sign in
            </Button>
          )}
          <Button
            className="rounded-xl"
            onClick={() => (workspaceHref ? undefined : startLogin())}
            asChild={Boolean(workspaceHref)}
          >
            {primaryAction}
          </Button>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24">
        <div className="absolute left-1/2 top-0 -z-0 h-[520px] w-[760px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,#dbe4ff_0%,rgba(246,248,255,0.8)_36%,transparent_70%)] blur-2xl" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <h1 className="text-balance text-5xl font-semibold tracking-[-0.075em] sm:text-7xl">
            {landingCopy.hero.titleLead}{" "}
            <span className="text-primary">{landingCopy.hero.titleAccent}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-sm font-medium leading-6 text-foreground sm:text-base">
            {landingCopy.hero.proof}{" "}
            <a
              href={landingProofPoints[0].href}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              {landingCopy.hero.proofSource}
            </a>
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
            {landingCopy.hero.description}
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="h-12 rounded-xl px-6"
              onClick={scrollToJourney}
            >
              {landingCopy.hero.cta} <ArrowRight className="ml-2 size-4" />
            </Button>
            <a href="#how-it-works">
              <Button size="lg" variant="outline" className="h-12 rounded-xl px-6">
                See how it works
              </Button>
            </a>
          </div>
          <dl className="mx-auto mt-10 grid max-w-3xl divide-y divide-slate-200 border border-slate-200 bg-white text-left sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {landingProofPoints.map(point => (
              <div key={point.value} className="px-4 py-4 sm:px-5">
                <dt className="data-value text-lg font-semibold tracking-[-0.04em] text-foreground">
                  {point.value}
                </dt>
                <dd className="mt-1 text-xs leading-5 text-muted-foreground">
                  {point.label}
                </dd>
                <a
                  href={point.href}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-[10px] font-medium uppercase tracking-[0.08em] text-primary underline-offset-4 hover:underline"
                >
                  {point.source}
                </a>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="how-it-works" tabIndex={-1} className="border-y border-border/70 bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-xl">
            <div className="eyebrow">{landingCopy.story.eyebrow}</div>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.06em]">
              {landingCopy.story.title}
            </h2>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {landingCopy.story.description}
            </p>
          </div>
          <div className="mt-10 grid border border-slate-200 bg-white lg:grid-cols-[0.82fr_1.18fr]">
            <div className="border-b border-slate-200 p-6 lg:border-b-0 lg:border-r">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center border border-slate-200 bg-slate-50 text-primary">
                  <Compass className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{landingCopy.story.workflowTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    {landingCopy.story.workflowDescription}
                  </p>
                </div>
              </div>
              <dl className="mt-7 divide-y divide-slate-200 border-y border-slate-200 text-sm">
                {landingCopy.story.rows.map(row => (
                  <div key={row.label} className="flex items-center justify-between gap-4 py-3">
                    <dt className="text-muted-foreground">{row.label}</dt>
                    <dd className="text-right font-medium">{row.value}</dd>
                  </div>
                ))}
              </dl>
              <Link
                href="/auth"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary"
              >
                {landingCopy.hero.cta} <ArrowRight className="size-4" />
              </Link>
            </div>
            <div>
              <table className="w-full table-fixed text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  <tr>
                    <th className="w-[38%] px-3 py-3 sm:px-5">Stage</th>
                    <th className="px-3 py-3 sm:px-5">What it helps you do</th>
                    <th className="hidden px-5 py-3 sm:table-cell">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {landingFeatureCards.map((item, index) => {
                    const Icon = featureIcons[index];
                    return (
                      <tr key={item.step} className="border-b border-slate-200 last:border-0">
                        <td className="px-3 py-4 sm:px-5">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <span className="font-mono text-xs text-muted-foreground">{item.step}</span>
                            <Icon className="size-4 shrink-0 text-primary" />
                            <span className="font-medium">{item.title}</span>
                          </div>
                        </td>
                        <td className="px-3 py-4 text-xs leading-5 text-muted-foreground sm:px-5">
                          {item.copy}
                        </td>
                        <td className="hidden px-5 py-4 sm:table-cell">
                          <span className="border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.08em] text-slate-600">
                            {item.result}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="border-t border-slate-200 px-3 py-4 sm:px-5">
                <Button asChild className="h-10 rounded-xl px-4">
                  <Link href="/auth">
                    {landingCopy.story.stageCta}
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
                <p className="mt-4 max-w-3xl text-xs leading-5 text-muted-foreground">
                  {landingExperientialEvidence.text}{" "}
                  <a
                    href={landingExperientialEvidence.href}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {landingExperientialEvidence.source}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="relative overflow-hidden rounded-[32px] bg-foreground px-6 py-12 text-center text-background sm:px-12 sm:py-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(78,119,255,0.5),transparent_42%)]" />
          <div className="relative">
            <span className="mx-auto grid size-10 place-items-center rounded-xl bg-white/10 text-white">
              <Target className="size-5" />
            </span>
            <h2 className="mx-auto mt-5 max-w-2xl text-4xl font-semibold tracking-[-0.06em]">
              {landingCopy.closing.title}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/65">
              {landingCopy.closing.description}
            </p>
            <Button
              className="mt-8 rounded-xl bg-white text-foreground hover:bg-white/90"
              onClick={() => (workspaceHref ? undefined : startLogin())}
              asChild={Boolean(workspaceHref)}
            >
              {primaryAction}
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/70 py-7">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 text-xs text-muted-foreground sm:px-8">
          <Brand compact />
          <p>PathPilot · A place to explore what comes next.</p>
        </div>
      </footer>
    </main>
  );
}
