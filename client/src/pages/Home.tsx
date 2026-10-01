import { useAuth } from "@/_core/hooks/useAuth";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LandingWalkthrough } from "@/components/LandingWalkthrough";
import {
  landingAudiences,
  landingCopy,
  landingQuestions,
} from "@/lib/landing-copy";
import { scrollToLandingJourney } from "@/lib/landing-scroll";
import { ArrowDown, ArrowRight, Check } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect, type ComponentPropsWithoutRef } from "react";

function StoryLink({
  target,
  children,
  ...props
}: { target: string } & Omit<
  ComponentPropsWithoutRef<"a">,
  "href" | "target"
>) {
  return (
    <a
      {...props}
      href={"#" + target}
      onClick={event => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
          return;
        event.preventDefault();
        if (
          scrollToLandingJourney({
            target: document.getElementById(target),
            prefersReducedMotion: window.matchMedia(
              "(prefers-reduced-motion: reduce)"
            ).matches,
          })
        )
          window.history.replaceState(window.history.state, "", "#" + target);
      }}
    >
      {children}
    </a>
  );
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const startHref = isAuthenticated ? "/app" : "/auth";
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "PathPilot | Discover your career. Build your path.";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#fcfcfd]">
      <header className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Brand />
        <nav
          aria-label="Main navigation"
          className="flex items-center gap-5 text-sm"
        >
          <StoryLink
            target="how-it-works"
            className="hidden sm:inline hover:text-primary"
          >
            How it works
          </StoryLink>
          <StoryLink
            target="audiences"
            className="hidden md:inline hover:text-primary"
          >
            Who it's for
          </StoryLink>
          <Button variant="outline" className="rounded-xl" asChild>
            <Link href={startHref}>
              {isAuthenticated ? "Open workspace" : "Sign in"}
            </Link>
          </Button>
        </nav>
      </header>
      <section className="mx-auto max-w-7xl px-5 pb-16 pt-14 sm:px-8 sm:pt-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="eyebrow">A place to explore what's next</p>
          <h1 className="mt-5 text-balance text-4xl font-semibold tracking-[-0.065em] sm:text-6xl lg:text-7xl">
            {landingCopy.hero.titleLead}{" "}
            <span className="text-primary">{landingCopy.hero.titleAccent}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
            {landingCopy.hero.description}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" className="rounded-xl" asChild>
              <Link href={startHref}>
                Start exploring
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-xl" asChild>
              <StoryLink target="how-it-works">
                See how it works
                <ArrowDown className="size-4" />
              </StoryLink>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            No chosen career needed. Start with a curiosity.
          </p>
        </div>
        <div
          id="audiences"
          tabIndex={-1}
          className="mt-16 scroll-mt-8 border-t border-slate-200 pt-8"
        >
          <h2 className="text-xl font-semibold tracking-tight">
            Who are you exploring PathPilot for?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Start with what brings you here.
          </p>
          <nav
            aria-label="Choose your PathPilot audience"
            className="mt-5 grid divide-y divide-slate-200 border-y border-slate-200 md:grid-cols-3 md:divide-x md:divide-y-0"
          >
            {landingAudiences.map(audience => (
              <StoryLink
                key={audience.id}
                target={audience.id}
                className="group px-4 py-6 transition-colors hover:bg-slate-50 focus-visible:outline-primary"
              >
                <p className="eyebrow">{audience.label}</p>
                <div className="mt-3 flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold tracking-tight">
                    {audience.invitation}
                  </h3>
                  <ArrowDown
                    aria-hidden="true"
                    className="mt-1 size-4 shrink-0 text-primary"
                  />
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {audience.reason}
                </p>
              </StoryLink>
            ))}
          </nav>
        </div>
      </section>
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 md:grid-cols-2 md:gap-16">
          <div>
            <p className="eyebrow">The question behind the career choice</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
              {landingCopy.problem.title}
            </h2>
          </div>
          <div className="space-y-5 text-base leading-8 text-muted-foreground">
            <p>{landingCopy.problem.description}</p>
            <p>{landingCopy.problem.response}</p>
            <StoryLink
              target="how-it-works"
              className="inline-flex items-center gap-2 font-medium text-primary"
            >
              See the student journey
              <ArrowRight className="size-4" />
            </StoryLink>
          </div>
        </div>
      </section>
      <section
        id="how-it-works"
        tabIndex={-1}
        className="mx-auto max-w-7xl scroll-mt-6 px-5 py-16 sm:px-8 sm:py-20"
      >
        <p className="eyebrow">
          Discover → Explore → Experience → Build your path
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
          From a first question to a next step.
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
          Take a look at the journey. These public examples show what you can
          explore; your own workspace keeps your profile, choices, and progress
          together.
        </p>
        <LandingWalkthrough onStart={() => navigate(startHref)} />
      </section>
      {landingAudiences.map((audience, index) => (
        <section
          key={audience.id}
          id={audience.id}
          tabIndex={-1}
          aria-labelledby={audience.id + "-title"}
          className={
            "scroll-mt-6 border-t border-slate-200 " +
            (index % 2 === 0 ? "bg-white" : "")
          }
        >
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="eyebrow">
                {index === 0
                  ? "For students"
                  : index === 1
                    ? "For parents"
                    : "For schools and counselors"}
              </p>
              <StoryLink
                target="audiences"
                className="text-xs text-muted-foreground hover:text-primary"
              >
                Choose another starting point ↑
              </StoryLink>
            </div>
            <div className="mt-7 grid gap-10 lg:grid-cols-2 lg:gap-20">
              <div>
                <h2
                  id={audience.id + "-title"}
                  className="text-3xl font-semibold tracking-[-0.045em] sm:text-4xl"
                >
                  {audience.title}
                </h2>
                <p className="mt-5 text-base leading-8 text-muted-foreground">
                  {audience.description}
                </p>
                <ul className="mt-6 space-y-4">
                  {audience.points.map(point => (
                    <li key={point} className="flex gap-3 text-sm leading-6">
                      <Check
                        aria-hidden="true"
                        className="mt-1 size-4 shrink-0 text-primary"
                      />
                      {point}
                    </li>
                  ))}
                </ul>
                <div className="mt-7 flex flex-wrap items-center gap-5">
                  <Button
                    className="h-auto whitespace-normal rounded-xl py-3"
                    asChild
                  >
                    <Link href={index === 0 ? startHref : audience.href}>
                      {audience.cta}
                      <ArrowRight className="size-4 shrink-0" />
                    </Link>
                  </Button>
                  {index === 2 ? (
                    <Link href="/counselors" className="text-sm text-primary">
                      For counselors →
                    </Link>
                  ) : (
                    <StoryLink
                      target="how-it-works"
                      className="text-sm text-primary"
                    >
                      Explore the experience →
                    </StoryLink>
                  )}
                </div>
              </div>
              <article className="self-center border-l-2 border-primary/40 pl-6 sm:pl-8">
                <p className="text-xs leading-5 text-muted-foreground">
                  Illustrative scenario · Not a customer testimonial
                </p>
                <h3 className="mt-4 text-2xl font-semibold tracking-tight">
                  {audience.storyTitle}
                </h3>
                <p className="mt-5 text-sm leading-7 text-muted-foreground">
                  {audience.story}
                </p>
                <p className="mt-5 text-sm leading-7">{audience.next}</p>
              </article>
            </div>
          </div>
        </section>
      ))}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <p className="eyebrow">Why PathPilot</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight">
          Exploration that gives you somewhere to go.
        </h2>
        <div className="mt-9 grid gap-8 md:grid-cols-3">
          {[
            [
              "Experience before commitment",
              "Go beyond a job title. A simulation gives you decisions to consider and questions to bring to someone who knows the field.",
            ],
            [
              "A path you can return to",
              "Saved decisions and metrics, roadmap steps, opportunities, and goals help connect a moment of curiosity to continued exploration.",
            ],
            [
              "Guidance, with room for judgment",
              "The career mentor and project assistant can help you think through a next step. You decide what fits, with support from the people who know you.",
            ],
          ].map(([title, description]) => (
            <div key={title} className="border-t border-slate-200 pt-5">
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 md:grid-cols-[0.7fr_1.3fr] md:gap-16">
          <div>
            <p className="eyebrow">A few natural questions</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">
              Before you begin.
            </h2>
          </div>
          <Accordion type="single" collapsible>
            {landingQuestions.map((item, index) => (
              <AccordionItem key={item.question} value={String(index)}>
                <AccordionTrigger className="text-left leading-6">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="leading-7 text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="rounded-[32px] bg-foreground px-6 py-12 text-center text-background sm:p-16">
          <h2 className="mx-auto max-w-2xl text-balance text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
            {landingCopy.closing.title}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 opacity-80">
            {landingCopy.closing.description}
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-6">
            <Button
              variant="secondary"
              size="lg"
              className="rounded-xl"
              asChild
            >
              <Link href={startHref}>
                Start your PathPilot
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <a
              href="mailto:krishna@k12worx.org?subject=PathPilot%20for%20our%20school"
              className="text-sm underline underline-offset-4"
            >
              Bring PathPilot to your school
            </a>
          </div>
        </div>
      </section>
      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div>
            <Brand />
            <p className="mt-3 text-xs text-muted-foreground">
              Discover your career and build the path to reach it.
            </p>
          </div>
          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap gap-x-5 gap-y-3 text-xs text-muted-foreground"
          >
            {[
              ["/schools", "Schools"],
              ["/counselors", "Counselors"],
              ["/parents", "Parents"],
              ["/privacy", "Privacy"],
              ["/terms", "Terms"],
              ["/accessibility", "Accessibility"],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="hover:text-primary">
                {label}
              </Link>
            ))}
            <a
              href="mailto:krishna@k12worx.org"
              className="hover:text-primary"
            >
              Contact
            </a>
          </nav>
        </div>
      </footer>
    </main>
  );
}
