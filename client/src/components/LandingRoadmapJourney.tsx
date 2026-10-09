import { useRef, useState } from "react";
import {
  adultRoadmapChapters,
  audienceExperiences,
  type Audience,
} from "@/lib/audience-experiences";
import { motion, useReducedMotion, useScroll } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressIndicator } from "@/components/ProductPrimitives";
import { roadmapStorySteps } from "@/lib/landing-story";

export const roadmapTour = [
  {
    id: "direction",
    label: "Direction",
    title: "Start with something you want to explore.",
    copy: "You don't have to choose a career for life. Pick a direction worth trying and use it to give your next steps a purpose.",
    surface: "Career direction",
    record: "Software Engineer",
    detail:
      "An illustrative direction: making useful tools and learning how software works.",
    takeaway: "A direction you can test, not a decision you can't change.",
  },
  {
    id: "milestone",
    label: "Milestone",
    title: "Make the next step smaller.",
    copy: "A roadmap breaks a direction into skills, projects, and experiences. See your current focus and keep track of the work as you go.",
    surface: "Roadmap / Skill milestone",
    record: roadmapStorySteps[0].title,
    detail: roadmapStorySteps[0].description,
    takeaway: roadmapStorySteps[0].output,
  },
  {
    id: "experience",
    label: "Experience",
    title: "Find somewhere to try it.",
    copy: "Look for a competition, research experience, or internship connected to your interests. Check the source, eligibility, and dates before making plans.",
    surface: "Opportunities / Source-linked listing",
    record: "NASA Space Apps Challenge 2026",
    detail:
      "A real catalog example: space and science challenges. Check current participation details with the organizer.",
    takeaway: "An experience to investigate, with a source you can check.",
  },
  {
    id: "project",
    label: "Project",
    title: "Give the skill a real use.",
    copy: "Open a project from your roadmap. Keep its scope, milestones, and notes together so the work has a manageable shape.",
    surface: "Projects / In progress",
    record: roadmapStorySteps[1].title,
    detail: roadmapStorySteps[1].description,
    takeaway: roadmapStorySteps[1].output,
  },
  {
    id: "goal",
    label: "Goal",
    title: "Decide what you'll do next.",
    copy: "A goal turns the plan into a commitment. Set a priority, update progress, and ask Mentor for guidance when you get stuck.",
    surface: "Goals / Next action",
    record: "Test the planner with a classmate",
    detail:
      "Priority: medium. Commitment: one short feedback session. Example status: not started.",
    takeaway: "One action you can take, instead of a plan you only look at.",
  },
  {
    id: "preparation",
    label: "Preparation",
    title: "Have something real to reflect on.",
    copy: "Your project, experiences, and notes give you material to discuss when preparing for college. What did you try? What changed? What would you do next?",
    surface: "Project notes / Reflection",
    record: "What I learned from building",
    detail:
      "Example note: Testing showed me that a simpler task screen was easier to use. My next version will focus on that.",
    takeaway: "Experiences you can explain. Not an admissions prediction.",
  },
] as const;

/** Scroll changes the tour focus only. It never advances saved/example completion. */
export function LandingRoadmapJourney({
  startHref,
  audience = "student",
  sectionNumber = "03",
}: {
  startHref: string;
  audience?: Audience;
  sectionNumber?: string;
}) {
  const tour =
    audience === "student"
      ? roadmapTour
      : roadmapTour.map((step, i) => ({
          ...step,
          title: adultRoadmapChapters[audience][i][0],
          copy: adultRoadmapChapters[audience][i][1],
          takeaway: adultRoadmapChapters[audience][i][2],
        }));
  const container = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start center", "end center"],
  });
  const item = tour[active];
  return (
    <section id="roadmap-preview" tabIndex={-1} className="landing-roadmap">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="landing-section-heading">
          <p className="eyebrow">
            {sectionNumber} / A direction becomes a plan
          </p>
          <h2>
            {audience === "student"
              ? "A path you can"
              : audienceExperiences[audience].roadmap[0]}
            <br />
            <span className="text-primary">
              {audience === "student"
                ? "actually work through."
                : audienceExperiences[audience].roadmap[1]}
            </span>
          </h2>
          <p>
            {audience === "student"
              ? "Follow one interest from a first skill to something you can explain."
              : "Follow a student-owned plan, with questions to discuss at each stage. This is an illustrative workspace tour, not a shared account."}{" "}
            Scroll through the story, or choose a stage.
          </p>
        </div>
        <nav aria-label="Roadmap tour stages" className="landing-tour-nav mt-8">
          {tour.map((step, index) => (
            <a
              key={step.id}
              href={"#path-" + step.id}
              aria-current={active === index ? "step" : undefined}
              onClick={() => setActive(index)}
            >
              {String(index + 1).padStart(2, "0")} <span>{step.label}</span>
            </a>
          ))}
        </nav>
        <div ref={container} className="landing-roadmap-tour mt-10">
          <div className="landing-tour-chapters">
            {tour.map((step, index) => (
              <motion.article
                key={step.id}
                id={"path-" + step.id}
                tabIndex={-1}
                className="landing-tour-chapter"
                data-active={active === index}
                onViewportEnter={() => {
                  if (!reduceMotion) setActive(index);
                }}
                viewport={{ margin: "-35% 0px -45% 0px" }}
              >
                <p className="eyebrow">
                  0{index + 1} / {step.label}
                </p>
                <h3 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                  {step.title}
                </h3>
                <p className="mt-5 text-base leading-8 text-muted-foreground">
                  {step.copy}
                </p>
                <div className="landing-tour-inline mt-6">
                  <TourRecord item={tour[index]} audience={audience} />
                </div>
              </motion.article>
            ))}
          </div>
          <aside
            className="landing-tour-product"
            aria-label="Illustrative roadmap product tour"
          >
            <div className="landing-window-bar">
              <span>PathPilot / Your path</span>
              <span className="landing-example-label">Illustrative plan</span>
            </div>
            <div className="p-6 sm:p-8">
              <p className="eyebrow">Software Engineer</p>
              {audience !== "student" && (
                <div className="audience-context-note mt-4">
                  <p className="text-xs font-semibold">
                    {audience === "parent"
                      ? "Read the plan together"
                      : "Current conversation priority"}
                  </p>
                  <p className="mt-2 text-sm">
                    {audience === "parent"
                      ? "Completed skill → active project → upcoming experience. Ask your student what they want to show you."
                      : "Scope the study planner before adding another commitment. The student owns the next action."}
                  </p>
                </div>
              )}
              <ol
                className="landing-tour-plan mt-5"
                aria-label="Example roadmap milestones"
              >
                {roadmapStorySteps
                  .filter(
                    step => audience !== "counselor" || step.progress < 100
                  )
                  .map(step => (
                    <li
                      key={step.id}
                      data-current={step.progress > 0 && step.progress < 100}
                    >
                      <span className="text-xs text-muted-foreground">
                        {audience === "parent"
                          ? step.progress === 100
                            ? "Already tried"
                            : step.progress > 0
                              ? "Working on now"
                              : "Worth discussing next"
                          : step.kind}
                      </span>
                      <span className="text-sm font-medium">{step.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {step.progress === 100
                          ? "Complete"
                          : step.progress > 0
                            ? "In progress"
                            : "Upcoming"}
                      </span>
                    </li>
                  ))}
              </ol>
              <div className="mt-6">
                <ProgressIndicator
                  value={20}
                  label="Project progress in this example"
                />
              </div>
              <motion.div
                key={item.id}
                initial={reduceMotion ? false : { y: 8 }}
                animate={{ y: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.24 }}
                className="mt-7"
              >
                <TourRecord item={item} audience={audience} />
              </motion.div>
              <p className="mt-5 text-xs leading-6 text-muted-foreground">
                Illustrative plan, not a student result. Selecting a milestone
                does not mark it complete. The line below follows this tour, not
                your progress.
              </p>
              <Button asChild className="mt-5">
                <Link href={startHref}>
                  {audience === "student"
                    ? "Build your own path"
                    : "Try the student experience"}{" "}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
            <div className="landing-story-track" aria-hidden="true">
              <motion.div
                style={{ scaleX: reduceMotion ? 1 : scrollYProgress }}
              />
            </div>
          </aside>
        </div>
        <div className="landing-tour-mobile-cta">
          <Button asChild>
            <Link href={startHref}>
              {audience === "student"
                ? "Build your own path"
                : "Try the student experience"}{" "}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            Illustrative plan. Exploring this tour does not save or complete
            work.
          </p>
        </div>
      </div>
    </section>
  );
}

function TourRecord({
  item,
  audience,
}: {
  item: { surface: string; record: string; detail: string; takeaway: string };
  audience: Audience;
}) {
  return (
    <div className="landing-tour-record surface-panel p-5">
      <p className="eyebrow">{item.surface}</p>
      <h4 className="mt-3 text-xl font-semibold tracking-tight">
        {item.record}
      </h4>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">
        {item.detail}
      </p>
      <div className="mt-4 border-t border-border pt-4">
        <p className="text-xs font-medium text-primary">
          {audience === "student"
            ? "What you take forward"
            : audience === "parent"
              ? "A question to ask together"
              : "A discussion prompt"}
        </p>
        <p className="mt-2 text-sm leading-6">{item.takeaway}</p>
      </div>
    </div>
  );
}
