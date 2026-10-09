import { useRef, useState } from "react";
import { motion, useReducedMotion, useScroll } from "framer-motion";
import { ArrowDown, ArrowRight, Check, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressIndicator } from "@/components/ProductPrimitives";
import { MentorMessageContent } from "@/components/MentorMessageContent";
import {
  preparationChapters,
  projectExampleTasks,
  exampleProjectProgress,
} from "@/lib/landing-story";
import { Link } from "wouter";

export { LandingRoadmapJourney as LandingRoadmapShowcase } from "./LandingRoadmapJourney";

export function ProjectExample() {
  const [completed, setCompleted] = useState([true, false, false]);
  return (
    <div className="landing-example-work">
      <p className="eyebrow">Project workspace / Study planner</p>
      <p className="mt-4 text-sm leading-7 text-muted-foreground">
        Scope: Add a task, give it a due date, and mark it done. Start with one
        screen.
      </p>
      <fieldset className="mt-6">
        <legend className="text-sm font-semibold">
          Try updating the example milestones
        </legend>
        {projectExampleTasks.map((task, index) => (
          <label key={task} className="landing-project-task">
            <input
              type="checkbox"
              checked={completed[index]}
              onChange={event =>
                setCompleted(current =>
                  current.map((done, i) =>
                    i === index ? event.target.checked : done
                  )
                )
              }
            />
            <span
              className={
                completed[index] ? "text-muted-foreground line-through" : ""
              }
            >
              {task}
            </span>
            {completed[index] && (
              <Check
                aria-hidden="true"
                className="ml-auto size-4 text-primary"
              />
            )}
          </label>
        ))}
      </fieldset>
      <ProgressIndicator
        value={exampleProjectProgress(completed)}
        label="Example milestone completion"
      />
      <p role="status" className="mt-3 text-xs leading-6 text-muted-foreground">
        {completed.filter(Boolean).length} of 3 example milestones checked.
        Nothing is saved.
      </p>
    </div>
  );
}

function MentorExample() {
  const [expanded, setExpanded] = useState(false);
  const reduceMotion = useReducedMotion();
  return (
    <div className="landing-example-work">
      <p className="eyebrow">AI Mentor / Example conversation</p>
      <div className="mt-5 border-l-2 border-primary/40 pl-4">
        <p className="mb-2 text-xs font-semibold">Student</p>
        <MentorMessageContent content="My roadmap includes a project, but I only have a little time this week. Where should I start with a study planner?" />
      </div>
      <Button
        variant="outline"
        className="mt-5"
        aria-expanded={expanded}
        aria-controls="landing-mentor-answer"
        onClick={() => setExpanded(value => !value)}
      >
        {expanded ? "Hide example guidance" : "Read example guidance"}
        <ArrowDown aria-hidden="true" className="size-4" />
      </Button>
      <div id="landing-mentor-answer" hidden={!expanded}>
        {expanded && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            className="mt-5"
          >
            <p className="mb-2 text-xs font-semibold">AI Mentor</p>
            <MentorMessageContent
              content={
                "Choose one small part you can finish and learn from. For your planner idea:\n\n1. Sketch the task screen.\n2. Ask someone how they would use it.\n3. Note one change to try next.\n\nYou can make the sketch your next goal before committing to the whole build."
              }
            />
          </motion.div>
        )}
      </div>
      <p className="mt-5 text-xs leading-6 text-muted-foreground">
        Written example, not a live AI response.
      </p>
    </div>
  );
}

export function LandingActionJourney({ startHref }: { startHref: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [chapter, setChapter] = useState(0);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start center", "end center"],
  });
  const descriptions = [
    {
      eyebrow: "Projects / Put the skill to work",
      title: "Don't just say you're interested. Build something.",
      copy: "Open a project from a roadmap milestone. Keep its scope, notes, and milestones together. Start small enough to finish a version and learn from it.",
    },
    {
      eyebrow: "Goals / Keep the next action small",
      title: "Turn the plan into something you do.",
      copy: "Set a commitment, choose a priority, and update your progress. A relevant opportunity can become an editable goal with its source links, so the action stays connected to why you chose it.",
    },
    {
      eyebrow: "AI Mentor / Support along the way",
      title: "You have a plan. You can still ask for help.",
      copy: "Think through a roadmap step, a workload decision, or how to approach an opportunity. Mentor uses your saved plan as context. You review the guidance and decide what to act on.",
    },
    {
      eyebrow: "Experiences / Reflection / College preparation",
      title: "Have something real to draw on.",
      copy: "A project you can explain. An experience you chose for a reason. Notes about what you tried and what changed. Those give you concrete material to reflect on when preparing college applications.",
    },
  ];
  return (
    <section id="college-preparation" tabIndex={-1} className="scroll-mt-24">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="landing-section-heading">
          <p className="eyebrow">
            04 / From an interest to something you've done
          </p>
          <h2>
            Build the experiences.
            <br />
            <span className="text-primary">Bring them to college.</span>
          </h2>
          <p>
            You don't need an application story before you have experiences.
            Follow one direction through a project, a goal, a question, and
            something to reflect on.
          </p>
          <p className="!text-xs">
            One illustrative software-project story, not a customer result or a
            promise of admission.
          </p>
        </div>
        <div ref={container} className="landing-preparation-journey mt-14">
          <aside
            className="landing-story-record"
            aria-label="Illustrative journey overview"
          >
            <div className="landing-window-bar">
              <span className="flex items-center gap-2">
                <FileText aria-hidden="true" className="size-4" /> What you take
                forward
              </span>
            </div>
            <div className="p-6 sm:p-8">
              <p className="eyebrow">Starting interest</p>
              <h3 className="mt-3 text-3xl font-semibold tracking-tight">
                “I like making
                <br />
                things work.”
              </h3>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Software → a roadmap → a study planner → experiences worth
                reflecting on.
              </p>
              <ol className="landing-record-items">
                {preparationChapters.map((item, index) => (
                  <li
                    key={item.id}
                    data-current={chapter === index}
                    data-revealed={reduceMotion || chapter >= index}
                  >
                    <span className="landing-record-index" aria-hidden="true">
                      0{index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{item.record}</p>
                      <p className="mt-1 text-xs leading-6 text-muted-foreground">
                        {item.detail}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-6 text-xs text-muted-foreground">
                Scroll to follow the example. This is a story, not a readiness
                score.
              </p>
            </div>
            <div className="landing-story-track" aria-hidden="true">
              <motion.div
                style={{ scaleX: reduceMotion ? 1 : scrollYProgress }}
              />
            </div>
          </aside>
          <nav
            aria-label="Preparation story chapters"
            className="landing-mobile-story-nav"
          >
            {preparationChapters.map((item, index) => (
              <a
                key={item.id}
                href={"#story-" + item.id}
                aria-current={chapter === index ? "step" : undefined}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="landing-story-chapters">
            {preparationChapters.map((item, index) => (
              <motion.article
                key={item.id}
                id={"story-" + item.id}
                className="landing-story-chapter"
                onViewportEnter={() => setChapter(index)}
                viewport={{ margin: "-25% 0px -45% 0px" }}
              >
                <div className="landing-story-chapter-title">
                  <span aria-hidden="true">0{index + 1}</span>
                  <p className="eyebrow">{descriptions[index].eyebrow}</p>
                </div>
                <h3 className="mt-5 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
                  {descriptions[index].title}
                </h3>
                <p className="mt-5 text-base leading-8 text-muted-foreground">
                  {descriptions[index].copy}
                </p>
                <div className="mt-7">
                  {item.id === "project" && <ProjectExample />}
                  {item.id === "goal" && (
                    <div className="landing-example-work">
                      <p className="eyebrow">Goal / Next action</p>
                      <h4 className="mt-4 text-xl font-semibold">
                        Test the planner with a classmate
                      </h4>
                      <dl className="mt-5 flex flex-wrap gap-10 text-sm">
                        <div>
                          <dt className="text-xs text-muted-foreground">
                            Priority
                          </dt>
                          <dd className="mt-2">Medium</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">
                            Example status
                          </dt>
                          <dd className="mt-2">Not started</dd>
                        </div>
                      </dl>
                      <p className="mt-5 text-sm leading-7 text-muted-foreground">
                        Ask them to add a task. Write down where they get stuck
                        before changing the design.
                      </p>
                    </div>
                  )}
                  {item.id === "guidance" && <MentorExample />}
                  {item.id === "reflection" && (
                    <div className="landing-example-work landing-reflection">
                      <p className="eyebrow">Illustrative portfolio draft</p>
                      <h4 className="mt-4 text-2xl font-semibold tracking-tight">
                        Study planner: what I built and why
                      </h4>
                      <p className="mt-5 text-sm leading-8">
                        “I built a simple task planner to practice interface
                        design. Testing the first version helped me see why
                        clear labels matter. I changed the task form after
                        watching someone use it.”
                      </p>
                      <p className="mt-5 text-xs leading-6 text-muted-foreground">
                        Methods: HTML, CSS, JavaScript, feedback from a
                        classmate. Project notes stay private. A separate
                        portfolio draft is public only if you choose to publish
                        it.
                      </p>
                    </div>
                  )}
                </div>
              </motion.article>
            ))}
          </div>
        </div>
        <div className="landing-college-resolution">
          <p className="eyebrow">Direction. Action. Experience. Reflection.</p>
          <h3>
            Not a shortcut to college.
            <br />A stronger place to start.
          </h3>
          <p>
            PathPilot supports the work behind your preparation. It is not an
            admissions predictor, an application submission service, or a
            promise of acceptance.
          </p>
          <Button size="lg" asChild>
            <Link href={startHref}>
              Start building your path{" "}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
