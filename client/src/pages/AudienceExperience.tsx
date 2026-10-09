import {
  Fragment,
  useEffect,
  useRef,
  type ComponentPropsWithoutRef,
} from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutGroup,
  MotionConfig,
  motion,
  useReducedMotion,
} from "framer-motion";
import { ArrowDown, ArrowRight, Moon, Sun } from "lucide-react";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { LandingRoadmapJourney } from "@/components/LandingRoadmapJourney";
import {
  AudienceSection,
  AudienceOpportunities,
  AudienceDiscovery,
  AudienceProjects,
  AudienceGoals,
  AudienceMentor,
  AudienceCollege,
} from "@/components/AudienceProductTours";
import {
  audienceExperiences,
  audienceOrder,
  type Audience,
} from "@/lib/audience-experiences";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/_core/hooks/useAuth";
import "./landing-page.css";
import "./audience-experience.css";

export function AudienceRoleSwitcher({ audience }: { audience: Audience }) {
  const reduced = useReducedMotion();
  return (
    <div className="audience-role-switcher">
      <p className="text-xs font-medium text-muted-foreground">
        Viewing PathPilot as
      </p>
      <LayoutGroup id="audience-role-switcher">
        <nav aria-label="View PathPilot by audience">
          {audienceOrder.map(role => (
            <Link
              key={role}
              href={audienceExperiences[role].route}
              aria-current={role === audience ? "page" : undefined}
            >
              {role === audience && (
                <motion.span
                  aria-hidden="true"
                  layoutId="role-selection"
                  className="audience-role-fill"
                  transition={{ duration: reduced ? 0 : 0.2 }}
                />
              )}
              <span className="relative">
                {audienceExperiences[role].label}
              </span>
            </Link>
          ))}
        </nav>
      </LayoutGroup>
    </div>
  );
}

function Action({
  href,
  children,
  ...props
}: ComponentPropsWithoutRef<"a"> & { href: string }) {
  return href.startsWith("/") ? (
    <Link {...props} href={href}>
      {children}
      <ArrowRight className="size-4" aria-hidden="true" />
    </Link>
  ) : (
    <a {...props} href={href}>
      {children}
      <ArrowRight className="size-4" aria-hidden="true" />
    </a>
  );
}

export function AudienceExperience({ audience }: { audience: Audience }) {
  const config = audienceExperiences[audience];
  const heading = useRef<HTMLHeadingElement>(null);
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, navigate] = useLocation();
  const startHref = isAuthenticated ? "/app" : "/auth";
  const ctaHref = audience === "student" ? startHref : config.ctaHref;
  const sectionLabel = (
    section: (typeof config.sections)[number],
    title: string
  ) =>
    `${String(config.sections.indexOf(section) + 1).padStart(2, "0")} / ${title}`;
  const sections = {
    opportunities: (
      <AudienceSection
        id="audience-opportunities"
        label={sectionLabel(
          "opportunities",
          "Opportunities become possible next steps"
        )}
        title={config.opportunities}
        description={
          audience === "student"
            ? "A direction becomes useful when you can do something with it. Try the filters below."
            : audience === "parent"
              ? "An activity makes more sense when you understand why it interests them. Inspect a real public listing, then see what you could discuss together."
              : "Use the student's interests to narrow the options. A source-linked opportunity gives you something concrete to discuss, not another abstract recommendation."
        }
      >
        <AudienceOpportunities audience={audience} />
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-2xl text-xs leading-6 text-muted-foreground">
            Historical and public-source examples are labeled. Check the
            organizer for current dates and requirements.
          </p>
          <Button asChild variant="outline">
            <Link href="/app/opportunities">
              Open the student catalog <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </AudienceSection>
    ),
    discovery: (
      <AudienceSection
        id="audience-discovery"
        label={sectionLabel("discovery", "Career discovery and simulations")}
        title={config.discovery}
        description={config.purposes.discovery}
      >
        <AudienceDiscovery
          audience={audience}
          onStart={() => navigate(startHref)}
        />
      </AudienceSection>
    ),
    roadmap: (
      <LandingRoadmapJourney
        sectionNumber={String(config.sections.indexOf("roadmap") + 1).padStart(
          2,
          "0"
        )}
        audience={audience}
        startHref={audience === "student" ? startHref : "/students"}
      />
    ),
    projects: (
      <AudienceSection
        id="audience-projects"
        label={sectionLabel("projects", "Projects make an interest tangible")}
        title={config.work}
        description={config.purposes.projects}
      >
        <div className="audience-action-composition">
          <div className="audience-action-context">
            <p className="eyebrow">Direction → roadmap → project</p>
            <h3>
              {audience === "student"
                ? "Build a first version."
                : audience === "parent"
                  ? "Something you can ask to see."
                  : "A plan, applied."}
            </h3>
            <p>
              {audience === "student"
                ? "Keep the scope small. Try updating the example milestones, then decide what you would build first."
                : audience === "parent"
                  ? "Inspect an example milestone to understand the work behind the progress. The student controls what they share, and you can support the process without editing their project."
                  : "Inspect how the project connects to a skill and a goal. This is a conversation around student work, not a counselor assignment tool."}
            </p>
          </div>
          <AudienceProjects audience={audience} />
        </div>
      </AudienceSection>
    ),
    goals: (
      <AudienceSection
        id="audience-goals"
        label={sectionLabel("goals", "Goals keep the plan moving")}
        title={
          audience === "student"
            ? ["One commitment.", "Then the next."]
            : audience === "parent"
              ? ["Understand the progress.", "Support the person."]
              : ["A useful conversation", "ends with a next action."]
        }
        description={config.purposes.goals}
      >
        <div className="mx-auto max-w-4xl">
          <AudienceGoals audience={audience} />
        </div>
      </AudienceSection>
    ),
    mentor: (
      <AudienceSection
        id="audience-mentor"
        label={sectionLabel("mentor", "Guidance in the context of the work")}
        title={
          audience === "student"
            ? ["Have a plan.", "Still ask for help."]
            : audience === "parent"
              ? ["Room to think.", "Support when they're stuck."]
              : ["More context.", "Still room for your judgment."]
        }
        description={config.purposes.mentor}
      >
        <AudienceMentor audience={audience} />
      </AudienceSection>
    ),
    college: (
      <AudienceSection
        id="audience-college"
        label={sectionLabel("college", "The work behind college preparation")}
        title={config.college}
        description={config.collegeCopy}
      >
        <AudienceCollege audience={audience} />
        <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-7 text-muted-foreground">
          Career direction → opportunities → projects → goals → experiences →
          reflection. Preparation grows from the work, not a promised admissions
          result.
        </p>
      </AudienceSection>
    ),
  };
  useEffect(() => {
    const priorTitle = document.title;
    document.title = `PathPilot for ${config.label === "Parent" ? "Parents" : config.label === "Counselor" ? "Counselors" : "Students"} | Discover, build, prepare`;
    const existing = document.querySelector('meta[name="description"]');
    const meta = existing ?? document.createElement("meta");
    const old = meta.getAttribute("content");
    meta.setAttribute("name", "description");
    meta.setAttribute("content", config.description);
    if (!existing) document.head.appendChild(meta);
    // Full audience navigation starts with its own story, never an old scroll offset.
    window.scrollTo({ top: 0, behavior: "instant" });
    heading.current?.focus({ preventScroll: true });
    return () => {
      document.title = priorTitle;
      if (!existing) meta.remove();
      else if (old === null) meta.removeAttribute("content");
      else meta.setAttribute("content", old);
    };
  }, [config]);
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      <main
        className="landing-page audience-page min-h-screen bg-background"
        data-audience={audience}
      >
        <header className="landing-navigation">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
            <Brand />
            <nav
              aria-label="Main navigation"
              className="flex items-center gap-3 sm:gap-6"
            >
              <Link
                href="/"
                className="hidden text-sm text-muted-foreground hover:text-foreground sm:block"
              >
                Product overview
              </Link>
              {toggleTheme && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={toggleTheme}
                  aria-label={
                    theme === "dark" ? "Use light theme" : "Use dark theme"
                  }
                >
                  {theme === "dark" ? (
                    <Sun className="size-4" />
                  ) : (
                    <Moon className="size-4" />
                  )}
                </Button>
              )}
              <Button asChild variant="outline">
                <Link href="/auth">Sign in</Link>
              </Button>
            </nav>
          </div>
        </header>
        <section className="audience-hero">
          <div className="mx-auto max-w-6xl px-5 text-center sm:px-8">
            <p className="eyebrow">
              PathPilot for{" "}
              {audience === "student"
                ? "students"
                : audience === "parent"
                  ? "parents & guardians"
                  : "counselors"}{" "}
              / Discover · Build · Prepare
            </p>
            <h1 ref={heading} tabIndex={-1} className="outline-none">
              <span className="block text-balance">{config.headline[0]}</span>
              <span className="block text-balance text-primary">
                {config.headline[1]}
              </span>
            </h1>
            <p className="audience-hero-copy">{config.description}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button size="lg" asChild>
                <Action href={ctaHref}>{config.cta}</Action>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href={`#audience-${config.sections[0]}`}>
                  Take the product tour <ArrowDown className="size-4" />
                </a>
              </Button>
            </div>
            <AudienceRoleSwitcher audience={audience} />
            <p className="audience-boundary">{config.boundary}</p>
          </div>
        </section>
        {config.sections.map(section => (
          <Fragment key={section}>{sections[section]}</Fragment>
        ))}
        <section className="audience-final mx-auto max-w-5xl px-5 py-24 text-center sm:px-8">
          <p className="eyebrow">A next step, when you are ready</p>
          <h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
            {config.final}
          </h2>
          <Button asChild size="lg" className="mt-8">
            <Action href={ctaHref}>{config.cta}</Action>
          </Button>
          {audience !== "student" && (
            <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-muted-foreground">
              Students can choose to share a limited planning-report snapshot or
              publish selected portfolio details. Private notes and Mentor
              conversations are not automatically shared.{" "}
              <Link href="/privacy" className="underline underline-offset-4">
                Read the privacy policy.
              </Link>
            </p>
          )}
        </section>
        <footer className="border-t border-border px-5 py-10 sm:px-8">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6">
            <Brand compact />
            <nav
              aria-label="Footer navigation"
              className="flex flex-wrap gap-x-6 gap-y-4 text-sm text-muted-foreground"
            >
              <Link href="/">Overview</Link>
              {audienceOrder.map(role => (
                <Link key={role} href={audienceExperiences[role].route}>
                  {audienceExperiences[role].label}
                </Link>
              ))}
              <Link href="/schools">Schools</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/accessibility">Accessibility</Link>
              <Link href="/support">Support</Link>
              <a href="mailto:krishna@k12worx.org">Contact</a>
            </nav>
          </div>
        </footer>
      </main>
    </MotionConfig>
  );
}

export function StudentsExperience() {
  return <AudienceExperience key="student" audience="student" />;
}
export function ParentsExperience() {
  return <AudienceExperience key="parent" audience="parent" />;
}
export function CounselorsExperience() {
  return <AudienceExperience key="counselor" audience="counselor" />;
}
