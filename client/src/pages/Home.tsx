import { MotionConfig } from "framer-motion";
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
import { LandingOpportunitiesPreview } from "@/components/LandingOpportunitiesPreview";
import { LandingPlanExcerpt } from "@/components/LandingPlanExcerpt";
import {
  LandingActionJourney,
  LandingRoadmapShowcase,
} from "@/components/LandingActionJourney";
import {
  landingAudiences,
  landingCopy,
  landingQuestions,
  landingOutcomes,
} from "@/lib/landing-copy";
import { scrollToLandingJourney } from "@/lib/landing-scroll";
import { ArrowDown, ArrowRight, Check } from "lucide-react";
import { Link, useLocation } from "wouter";
import { type ComponentPropsWithoutRef } from "react";
import "./landing-page.css";
import { audienceExperiences, audienceOrder } from "@/lib/audience-experiences";
import { ResourceLinks } from "./Resources";

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

  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      <main className="landing-page min-h-screen bg-background">
        <header className="landing-navigation">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
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
              <StoryLink
                target="college-preparation"
                className="hidden lg:inline hover:text-primary"
              >
                Build toward college
              </StoryLink>
              <Button variant="outline" className="rounded-xl" asChild>
                <Link href={startHref}>
                  {isAuthenticated ? "Open workspace" : "Sign in"}
                </Link>
              </Button>
            </nav>
          </div>
        </header>
        <section
          id="product-overview"
          aria-label="PathPilot product overview"
          className="landing-hero px-5 pb-12 pt-8 sm:px-8 sm:pt-10"
        >
          <div className="landing-focused-hero mx-auto max-w-7xl">
            <div className="landing-hero-intro min-w-0">
              <p className="eyebrow">
                Product overview / Discover · Build · Prepare
              </p>
              <h1 className="landing-hero-title mt-5 font-semibold">
                {landingCopy.hero.titleLead}{" "}
                <span className="text-primary">
                  {landingCopy.hero.titleAccent}
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                {landingCopy.hero.description}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button size="lg" className="rounded-xl" asChild>
                  <StoryLink target="audiences">
                    Find your PathPilot experience
                    <ArrowRight className="size-4" />
                  </StoryLink>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-xl"
                  asChild
                >
                  <StoryLink target="opportunities">
                    Try Opportunities
                    <ArrowDown className="size-4" />
                  </StoryLink>
                </Button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                A place to find a direction, or start building on one.
              </p>
              <p className="mt-5 max-w-xl text-sm leading-6 text-muted-foreground">
                Roadmaps, projects, goals, and AI Mentor help turn exploration
                into experiences you can reflect on in college applications,
                without promising admissions results.
              </p>
            </div>
            <LandingPlanExcerpt />
          </div>
          <div
            id="audiences"
            tabIndex={-1}
            className="mx-auto mt-10 max-w-7xl scroll-mt-8 pt-6"
          >
            <h2 className="text-xl font-semibold tracking-tight">
              Who are you exploring PathPilot for?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              One product. Three ways to explore what it can do for you.
            </p>
            <nav
              aria-label="Choose your PathPilot audience"
              className="mt-5 grid divide-y divide-border border-y border-border md:grid-cols-3 md:divide-x md:divide-y-0"
            >
              {audienceOrder.map(role => (
                <Link
                  key={role}
                  href={audienceExperiences[role].route}
                  className="group px-4 py-6 transition-colors hover:bg-secondary focus-visible:outline-primary"
                >
                  <p className="eyebrow">{audienceExperiences[role].label}</p>
                  <div className="mt-3 flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold tracking-tight">
                      {audienceExperiences[role].invitation}
                    </h3>
                    <ArrowRight
                      aria-hidden="true"
                      className="mt-1 size-4 shrink-0 text-primary"
                    />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {audienceExperiences[role].overview}
                  </p>
                </Link>
              ))}
            </nav>
          </div>
        </section>
        <section
          id="opportunities"
          tabIndex={-1}
          className="landing-opportunity-showcase px-5 py-16 sm:px-8 sm:py-24"
        >
          <div className="mx-auto max-w-7xl">
            <div className="landing-opportunity-heading">
              <div>
                <p className="eyebrow">
                  01 / Something you can actually pursue
                </p>
                <h2>
                  Find your next
                  <br />
                  <span className="text-primary">“I could try that.”</span>
                </h2>
              </div>
              <div>
                <p className="text-base leading-7 text-muted-foreground">
                  A direction becomes more useful when you can do something with
                  it. Search real public listings and see how PathPilot connects
                  interests to experiences.
                </p>
                <Link
                  href="/app/opportunities"
                  className="mt-5 inline-flex items-center gap-2 font-medium text-primary"
                >
                  Open Opportunities <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
            <div className="mt-10">
              <LandingOpportunitiesPreview />
            </div>
            <p className="mt-5 max-w-3xl text-sm leading-6 text-muted-foreground">
              Find something worth investigating. In your workspace, save a
              listing or turn it into an editable goal after checking the
              organizer's requirements.
            </p>
          </div>
        </section>
        <section
          id="how-it-works"
          tabIndex={-1}
          className="landing-discovery-section mx-auto max-w-7xl scroll-mt-24 px-5 py-16 sm:px-8 sm:py-28"
        >
          <p className="eyebrow">
            02 / Discover → Explore → Simulate → Reflect
          </p>
          <h2 className="pp-section-title mt-4 max-w-3xl">
            Figure out what's worth exploring. Then try it.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            Get career directions with reasons to consider them, skills to
            build, and a first step. Try work situations in simulations and
            reflect on your choices. You leave with more than a quiz result: you
            have something to test and a reason to keep exploring.
          </p>
          <LandingWalkthrough onStart={() => navigate(startHref)} />
        </section>
        <LandingRoadmapShowcase startHref={startHref} />
        <LandingActionJourney startHref={startHref} />
        <section className="border-y border-border bg-card">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 md:grid-cols-2 md:gap-16">
            <div>
              <p className="eyebrow">More than a career suggestion</p>
              <h2 className="pp-section-title mt-4">
                What do you actually leave with?
              </h2>
              <p className="mt-5 text-base leading-8 text-muted-foreground">
                A job title doesn't tell you what the work feels like. PathPilot
                connects exploring a career to something you can learn, build,
                or try next.
              </p>
              <StoryLink
                target="how-it-works"
                className="mt-6 inline-flex items-center gap-2 font-medium text-primary"
              >
                See the student journey <ArrowRight className="size-4" />
              </StoryLink>
            </div>
            <dl className="divide-y divide-border">
              {landingOutcomes.map(([title, description]) => (
                <div key={title} className="py-5 first:pt-0">
                  <dt className="text-lg font-semibold">{title}</dt>
                  <dd className="mt-2 text-sm leading-7 text-muted-foreground">
                    {description}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
        {landingAudiences.map((audience, index) => (
          <section
            key={audience.id}
            id={audience.id}
            tabIndex={-1}
            aria-labelledby={audience.id + "-title"}
            className={
              "scroll-mt-6 border-t border-border " +
              (index % 2 === 0 ? "bg-card" : "")
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
                    className="pp-section-title"
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
                      <Link
                        href={audienceExperiences[audienceOrder[index]].route}
                        className="text-sm text-primary"
                      >
                        Explore the experience →
                      </Link>
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
          <h2 className="pp-section-title mt-4">
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
              <div key={title} className="border-t border-border pt-5">
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {description}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-9 border-t border-border pt-5 text-sm leading-7 text-muted-foreground">
            Your workspace is tied to your account. You choose whether to
            publish a portfolio or create a shareable planning report; report
            links can be revoked.{" "}
            <Link
              href="/privacy"
              className="text-primary underline underline-offset-4"
            >
              Read how PathPilot handles your information.
            </Link>
          </p>
        </section>
        <section className="border-y border-border bg-card">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 md:grid-cols-[0.7fr_1.3fr] md:gap-16">
            <div>
              <p className="eyebrow">A few natural questions</p>
              <h2 className="pp-section-title mt-4">
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
          <div className="rounded-xl bg-foreground px-6 py-10 text-center text-background sm:p-12">
            <h2 className="pp-section-title mx-auto max-w-2xl text-balance">
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
        <ResourceLinks />
        <footer className="border-t border-border">
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
                ["/students", "Students"],
                ["/schools", "Schools"],
                ["/counselors", "Counselors"],
                ["/parents", "Parents"],
                ["/privacy", "Privacy"],
                ["/terms", "Terms"],
                ["/accessibility", "Accessibility"],
                ["/support", "Support"],
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
    </MotionConfig>
  );
}
