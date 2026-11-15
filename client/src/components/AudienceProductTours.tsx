import { useId, useState, type ReactNode } from "react";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Check, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProgressIndicator } from "@/components/ProductPrimitives";
import { OpportunityRecord } from "@/components/OpportunityRecord";
import { MentorMessageContent } from "@/components/MentorMessageContent";
import { LandingOpportunitiesPreview } from "@/components/LandingOpportunitiesPreview";
import { LandingWalkthrough } from "@/components/LandingWalkthrough";
import { ProjectExample } from "@/components/LandingActionJourney";
import {
  audienceExperiences,
  discoveryConversations,
  type Audience,
} from "@/lib/audience-experiences";
import {
  filterOpportunityExamples,
  previewCareers,
  publicOpportunityDetails,
  type PreviewCategory,
} from "@/lib/landing-opportunities";
import {
  landingCareerExamples,
  landingSimulationExcerpt,
} from "@/lib/landing-product-examples";
import { projectExampleTasks } from "@/lib/landing-story";

export function AudienceSection({
  id,
  label,
  title,
  children,
  description,
}: {
  id: string;
  label: string;
  title: readonly string[];
  children: ReactNode;
  description?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <section id={id} tabIndex={-1} className="audience-feature scroll-mt-24">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-20">
        <div className="landing-section-heading">
          <p className="eyebrow">{label}</p>
          <h2>
            {title[0]}
            <br />
            <span className="text-primary">{title[1]}</span>
          </h2>
          {description && <p>{description}</p>}
        </div>
        <motion.div
          className="mt-10"
          initial={reduced ? false : { y: 12 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
        >
          {children}
        </motion.div>
      </div>
    </section>
  );
}

function Change({
  children,
  identity,
}: {
  children: ReactNode;
  identity: string | number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      key={identity}
      initial={reduced ? false : { opacity: 0.65, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.2 }}
    >
      {children}
    </motion.div>
  );
}

export function AudienceOpportunities({ audience }: { audience: Audience }) {
  const [career, setCareer] = useState("Software Engineer");
  const [category, setCategory] = useState<PreviewCategory | "">(
    audience === "counselor" ? "research" : ""
  );
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");
  const group = useId();
  const reduced = useReducedMotion();
  const results = filterOpportunityExamples(search, category, true, career);
  const record = results.find(item => item.id === selected) ?? results[0];
  if (audience === "student") return <LandingOpportunitiesPreview />;
  const parent = audience === "parent";
  return (
    <LayoutGroup id={group}>
      <div className="landing-product-window">
        <div className="landing-window-bar">
          <span>PathPilot / Opportunities</span>
          <span className="landing-example-label">Public catalog sample</span>
        </div>
        <div className="audience-opportunity-controls">
          <label className="field-label">
            {parent
              ? "A direction your student might explore"
              : "Direction to discuss"}
            <select
              className="audience-select mt-2"
              value={career}
              onChange={e => setCareer(e.target.value)}
            >
              {previewCareers.map(c => (
                <option key={c.name}>{c.name}</option>
              ))}
            </select>
          </label>
          {parent ? (
            <p className="text-sm leading-7 text-muted-foreground">
              Choose a listing to see what it involves, then consider what you
              might ask together. This is a public example, not your student's
              activity.
            </p>
          ) : (
            <label className="field-label">
              Search titles and summaries
              <Input
                className="mt-2"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search a source or interest"
              />
            </label>
          )}
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Experience type"
          >
            {(
              [
                ["", "All"],
                ["research", "Research"],
                ["competition", "Competitions"],
                ["internship", "Internships"],
              ] as const
            ).map(([value, label]) => (
              <Button
                key={value}
                size="sm"
                variant="outline"
                aria-pressed={category === value}
                onClick={() => setCategory(value)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
        <div className="audience-opportunity-inspector">
          <div className="audience-record-list">
            <p
              role="status"
              className="px-5 py-4 text-xs text-muted-foreground"
            >
              {results.length} source-linked examples. Select one to inspect.
            </p>
            {results.map(item => (
              <motion.div key={item.id} layout={reduced ? false : "position"}>
                <button
                  className="audience-record-choice"
                  aria-pressed={record?.id === item.id}
                  onClick={() => setSelected(item.id)}
                >
                  <span className="text-xs text-muted-foreground">
                    {item.category}
                  </span>
                  <strong>{item.title}</strong>
                  <span className="text-xs leading-5 text-muted-foreground">
                    {item.locationLabel}
                  </span>
                  <ArrowRight aria-hidden="true" className="size-4" />
                </button>
              </motion.div>
            ))}
            {!record && (
              <div className="p-5">
                <p className="text-sm leading-6">
                  No match in this small public sample. Try another direction or
                  experience type.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setCareer("Software Engineer");
                    setCategory("");
                    setSearch("");
                  }}
                >
                  Reset examples
                </Button>
              </div>
            )}
          </div>
          <div className="min-w-0 p-5 sm:p-7" aria-live="polite">
            {record ? (
              <Change identity={record.id}>
                <OpportunityRecord
                  headingLevel={3}
                  opportunity={publicOpportunityDetails(record, [career])}
                  notice={record.recordNote}
                />
                <div className="audience-context-note mt-6">
                  <p className="eyebrow">
                    {parent
                      ? "Make room for their decision"
                      : "Before suggesting it"}
                  </p>
                  <h4 className="mt-3 text-lg font-semibold">
                    {parent
                      ? "What would you want to get out of this?"
                      : "Is this a useful next experiment?"}
                  </h4>
                  <p className="mt-3 text-sm leading-7">
                    {parent
                      ? "Ask about the work itself, then check the time, travel, eligibility, and any guardian requirements together. Interest comes before the application."
                      : "Connect the listing to a skill the student wants to test. Check eligibility, timing, and workload before discussing it as a possible next step."}
                  </p>
                </div>
                <Button asChild variant="outline" className="mt-5">
                  <a
                    href={record.applicationUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Check the organizer <ArrowUpRight className="size-4" />
                  </a>
                </Button>
              </Change>
            ) : (
              <p className="text-muted-foreground">
                A source record and discussion context will appear here when the
                filters match.
              </p>
            )}
          </div>
        </div>
        <p className="border-t border-border p-5 text-xs leading-6 text-muted-foreground">
          Real public records, not live availability or personalized
          recommendations. Broad career-domain matching and local keyword search
          demonstrate the catalog. Discussion prompts are tour guidance, not an
          additional parent or counselor feature.
        </p>
      </div>
    </LayoutGroup>
  );
}

export function AudienceDiscovery({
  audience,
  onStart,
}: {
  audience: Audience;
  onStart: () => void;
}) {
  const [selected, setSelected] = useState(audience === "counselor" ? 1 : 0);
  const [showNext, setShowNext] = useState(false);
  if (audience === "student") return <LandingWalkthrough onStart={onStart} />;
  const item = discoveryConversations[selected],
    career = landingCareerExamples[selected];
  return (
    <div className="landing-product-window">
      <div className="landing-window-bar">
        <span>PathPilot / Career discovery</span>
        <span className="landing-example-label">
          Illustrative student responses
        </span>
      </div>
      <div className="audience-split">
        <div className="p-6 sm:p-8">
          <p className="eyebrow">
            {audience === "parent"
              ? "Listen for the interest"
              : "Start with the student's words"}
          </p>
          <h3 className="mt-4 text-2xl font-semibold">
            {audience === "parent"
              ? "What have they been curious about?"
              : "What would you explore in a conversation?"}
          </h3>
          <div
            className="mt-6 space-y-3"
            role="group"
            aria-label="Illustrative student responses"
          >
            {discoveryConversations.map((x, i) => (
              <button
                key={x.quote}
                className="landing-interest-choice"
                aria-pressed={selected === i}
                onClick={() => {
                  setSelected(i);
                  setShowNext(false);
                }}
              >
                <span>“{x.quote}”</span>
                <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
              </button>
            ))}
          </div>
          <p className="mt-5 text-xs leading-6 text-muted-foreground">
            Example connections, not an assessment. Actual discovery also uses a
            student's background, skills, activities, and preferences.
          </p>
        </div>
        <div className="bg-secondary/40 p-6 sm:p-8" aria-live="polite">
          <Change identity={selected}>
            <p className="eyebrow">{item.interest}</p>
            <h3 className="mt-4 text-3xl font-semibold">{career.name}</h3>
            <p className="mt-4 text-sm leading-7">{career.description}</p>
            <div className="audience-context-note mt-6">
              <p className="text-xs font-semibold">
                {audience === "parent"
                  ? "A conversation, not a conclusion"
                  : "A question to test the direction"}
              </p>
              <p className="mt-3 text-lg leading-7">{item.question}</p>
            </div>
            <Button
              variant="outline"
              className="mt-5"
              aria-expanded={showNext}
              aria-controls="discovery-next"
              onClick={() => setShowNext(v => !v)}
            >
              {audience === "parent"
                ? "See what they could try"
                : "Connect it to a next step"}
            </Button>
            <div
              id="discovery-next"
              hidden={!showNext}
              className="mt-4 text-sm leading-7"
            >
              {item.next}
              <p className="mt-3 text-xs text-muted-foreground">
                Actual simulation context: {career.simulationIntro}
              </p>
            </div>
          </Change>
        </div>
      </div>
      <details className="border-t border-border p-6">
        <summary className="cursor-pointer text-sm font-semibold">
          See an actual Software Engineer simulation excerpt
        </summary>
        <h4 className="mt-5 font-semibold">{landingSimulationExcerpt.title}</h4>
        <p className="mt-3 text-sm leading-7">
          {landingSimulationExcerpt.situation}
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          Students make decisions in their workspace. This excerpt is not an
          executable simulation.
        </p>
      </details>
    </div>
  );
}

export function AudienceProjects({ audience }: { audience: Audience }) {
  const [selected, setSelected] = useState(audience === "counselor" ? 2 : 1);
  if (audience === "student") return <ProjectExample />;
  const parent = audience === "parent";
  const notes = parent
    ? [
        "A sketch lets the student explain the idea before building everything.",
        "The first version is still being built. Ask what works now, not only when it will be finished.",
        "Testing gives them feedback to think about. You can offer to try it if they want.",
      ]
    : [
        "Skill → project: apply the interface exercise to one useful task.",
        "Project → roadmap: keep the first version small enough to review.",
        "Project → goal: ask a classmate to try one task, then record a change.",
      ];
  return (
    <div className="landing-example-work">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="eyebrow">Project workspace / Illustrative record</p>
        <span className="status-tag">In progress</span>
      </div>
      <h3 className="mt-5 text-3xl font-semibold">Study planner</h3>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">
        Scope: one task screen. Direction: Software Engineer. Linked roadmap
        milestone: build a study planner.
      </p>
      <div className="mt-5">
        <ProgressIndicator value={33} label="Example milestone completion" />
      </div>
      <div
        role="group"
        aria-label={
          parent
            ? "Inspect example project work"
            : "Inspect project relationships"
        }
        className="mt-6 space-y-2"
      >
        {projectExampleTasks.map((task, i) => (
          <button
            className="audience-work-choice"
            key={task}
            aria-pressed={selected === i}
            onClick={() => setSelected(i)}
          >
            <span>
              {i === 0 ? (
                <Check aria-label="Completed in example" className="size-4" />
              ) : (
                <span className="data-value text-xs">0{i + 1}</span>
              )}
            </span>
            <span>{task}</span>
            <span className="text-xs text-muted-foreground">
              {i === 0 ? "Complete" : i === 1 ? "Current" : "Next"}
            </span>
          </button>
        ))}
      </div>
      <div className="audience-context-note mt-5" aria-live="polite">
        <p className="text-xs font-semibold">
          {parent
            ? "What this lets you understand"
            : "The connection to discuss"}
        </p>
        <Change identity={selected}>
          <p className="mt-2 text-sm leading-7">{notes[selected]}</p>
        </Change>
      </div>
      <p className="mt-4 text-xs leading-6 text-muted-foreground">
        Inspection only. Private project details are visible to you only if the
        student chooses to show them. A published portfolio is a separate,
        limited view.
      </p>
    </div>
  );
}

export function AudienceGoals({ audience }: { audience: Audience }) {
  const [progress, setProgress] = useState(25);
  const [focus, setFocus] = useState(audience === "parent" ? 1 : 0);
  const parent = audience === "parent";
  const goals = [
    "Test the planner with a classmate",
    "Review one opportunity’s requirements",
    "Record what changed after feedback",
  ];
  return (
    <div className="landing-example-work">
      <p className="eyebrow">
        Goals /{" "}
        {audience === "student"
          ? "Try a local example"
          : "Illustrative student commitments"}
      </p>
      {audience === "student" ? (
        <>
          <h3 className="mt-5 text-2xl font-semibold">{goals[0]}</h3>
          <p className="mt-3 text-sm leading-7">
            Priority: medium. Ask them to add a task and note where they get
            stuck.
          </p>
          <div className="mt-6">
            <ProgressIndicator value={progress} label="Example goal progress" />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              disabled={progress === 100}
              onClick={() => setProgress(v => Math.min(100, v + 25))}
            >
              {progress === 100
                ? "Complete in this example"
                : "Add 25% progress"}
            </Button>
            <Button variant="outline" onClick={() => setProgress(25)}>
              Reset example
            </Button>
          </div>
          <p role="status" className="mt-4 text-xs text-muted-foreground">
            {progress === 100
              ? "Example complete. In your workspace, update progress after doing the work."
              : "Nothing is saved. This demonstrates the existing progress control."}
          </p>
        </>
      ) : (
        <>
          <h3 className="mt-5 text-2xl font-semibold">
            {parent
              ? "Notice the next commitment."
              : "Choose a discussion priority."}
          </h3>
          <div
            className="mt-5 space-y-2"
            role="group"
            aria-label="Example goals"
          >
            {goals.map((goal, i) => (
              <button
                className="audience-work-choice"
                key={goal}
                aria-pressed={focus === i}
                onClick={() => setFocus(i)}
              >
                <span className="data-value text-xs">0{i + 1}</span>
                <span>{goal}</span>
                <span className="text-xs">{[25, 0, 100][i]}%</span>
              </button>
            ))}
          </div>
          <div className="mt-6">
            <ProgressIndicator
              value={[25, 0, 100][focus]}
              label="Saved progress in this example"
            />
          </div>
          <div className="audience-context-note mt-5" aria-live="polite">
            <p className="text-xs font-semibold">
              {parent
                ? "Support without taking over"
                : "Leave with a next step"}
            </p>
            <p className="mt-3 text-sm leading-7">
              {parent
                ? [
                    "Ask whether they need someone to try the first version.",
                    "Offer help checking time or travel requirements, if they want it.",
                    "Ask what they learned, not just whether they finished.",
                  ][focus]
                : [
                    "Agree what useful feedback would look like; the student chooses who to ask.",
                    "Discuss which requirements to verify before making an application plan.",
                    "Use the reflection to discuss a next experiment, not a readiness label.",
                  ][focus]}
            </p>
          </div>
          <p className="mt-4 text-xs leading-6 text-muted-foreground">
            Selecting a goal changes this tour's focus, not a student's
            progress. A shared planning report contains limited summary
            information, not this full private goal list.
          </p>
        </>
      )}
    </div>
  );
}

export function AudienceMentor({ audience }: { audience: Audience }) {
  const [shown, setShown] = useState(false);
  const [lens, setLens] = useState(audience === "counselor" ? 1 : 0);
  const student = audience === "student",
    parent = audience === "parent";
  return (
    <div className="landing-product-window">
      <div className="landing-window-bar">
        <span className="flex items-center gap-2">
          <MessageCircle className="size-4" /> PathPilot / Career mentor
        </span>
        <span className="landing-example-label">Written example</span>
      </div>
      <div className="audience-mentor-layout">
        <div className="p-6 sm:p-8">
          <div className="ml-auto max-w-xl rounded-lg bg-primary p-4 text-primary-foreground">
            <p className="mb-2 text-xs font-semibold">Student question</p>
            <MentorMessageContent content="I want to build the planner in my roadmap, but I only have a little time this week. Where should I start?" />
          </div>
          <Button
            variant="outline"
            className="mt-6"
            aria-expanded={shown}
            aria-controls="audience-mentor-answer"
            onClick={() => setShown(v => !v)}
          >
            {shown
              ? "Hide written response"
              : student
                ? "See an example next step"
                : parent
                  ? "See how guidance could help"
                  : "Review the guidance example"}
          </Button>
          <div
            id="audience-mentor-answer"
            hidden={!shown}
            className="mt-5 rounded-lg bg-secondary p-5"
          >
            <p className="mb-3 text-xs font-semibold">
              Mentor / Written example, not live AI
            </p>
            <MentorMessageContent content="Start with one task screen. Sketch how a student adds a task, then ask someone to walk through it. Record one thing you would change. You can make that small test your next goal before building the full planner." />
          </div>
          <p className="mt-5 text-xs leading-6 text-muted-foreground">
            No question is sent and no answer is generated here. Actual Mentor
            uses saved student context; its suggestions can be wrong and need
            judgment.
          </p>
        </div>
        <aside className="audience-mentor-context p-6">
          <p className="eyebrow">
            {student
              ? "Why the question has context"
              : parent
                ? "Support the thinking"
                : "Guidance is not a decision"}
          </p>
          {student ? (
            <dl className="mt-5 space-y-5 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Direction</dt>
                <dd>Software Engineer</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Roadmap</dt>
                <dd>A first project</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Next action</dt>
                <dd>A manageable test</dd>
              </div>
            </dl>
          ) : (
            <>
              <div
                className="mt-5 flex flex-wrap gap-2"
                role="group"
                aria-label="Guidance perspective"
              >
                {(parent
                  ? ["The question", "Your role"]
                  : ["Context", "Human judgment"]
                ).map((label, i) => (
                  <Button
                    key={label}
                    size="sm"
                    variant="outline"
                    aria-pressed={lens === i}
                    onClick={() => setLens(i)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <Change identity={lens}>
                <p className="mt-5 text-sm leading-7">
                  {parent
                    ? lens === 0
                      ? "The student is working out how to make a project manageable. That is different from asking AI to choose their future."
                      : "If they want to discuss it, ask which suggestion makes sense to them. You do not receive their private Mentor conversation."
                    : lens === 0
                      ? "The question refers to the student's plan and available time. Context makes the guidance relevant; it does not make it authoritative."
                      : "Help the student evaluate the suggestion against their circumstances. No private Mentor history is shared automatically with a counselor."}
                </p>
              </Change>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

export function AudienceCollege({ audience }: { audience: Audience }) {
  const [selected, setSelected] = useState(
    audience === "student" ? 0 : audience === "parent" ? 1 : 2
  );
  const labels = ["An experience", "A project", "A reflection"];
  const records = [
    [
      "Investigate a source-linked opportunity",
      "Check whether the work interests you and whether the organizer’s requirements fit. Looking at a listing is not the same as participating.",
    ],
    [
      "Build and test a study planner",
      "A first version, feedback, and an improvement give you something specific to explain. A published portfolio can show selected project details.",
    ],
    [
      "Explain what changed",
      "Example: Testing showed me that the task labels were unclear. I simplified the screen and tried it again.",
    ],
  ];
  const prompts =
    audience === "student"
      ? [
          "Why do I want to try this?",
          "What did I actually make?",
          "What did I learn?",
        ]
      : audience === "parent"
        ? [
            "What draws you to the work?",
            "Could you show me a version?",
            "What surprised you?",
          ]
        : [
            "What is the student's reason for choosing it?",
            "What evidence can they discuss?",
            "What might they explore next?",
          ];
  return (
    <div className="audience-college-record landing-product-window">
      <div className="landing-window-bar">
        <span>Direction → action → experience → reflection</span>
        <span className="landing-example-label">Illustrative preparation</span>
      </div>
      <div className="audience-split">
        <div className="p-6 sm:p-9">
          <p className="eyebrow">What you take forward</p>
          <div
            className="mt-6 space-y-3"
            role="group"
            aria-label="College preparation evidence"
          >
            {labels.map((label, i) => (
              <button
                key={label}
                className="audience-work-choice"
                aria-pressed={selected === i}
                onClick={() => setSelected(i)}
              >
                <span className="data-value text-xs">0{i + 1}</span>
                <strong>{label}</strong>
                <ArrowRight className="size-4" />
              </button>
            ))}
          </div>
          <p className="mt-6 text-xs leading-6 text-muted-foreground">
            A way to connect the work, not an admissions score, application
            builder, or guaranteed outcome.
          </p>
        </div>
        <div className="bg-secondary/40 p-6 sm:p-9" aria-live="polite">
          <Change identity={selected}>
            <p className="eyebrow">{labels[selected]}</p>
            <h3 className="mt-4 text-3xl font-semibold tracking-tight">
              {records[selected][0]}
            </h3>
            <p className="mt-5 text-base leading-8">{records[selected][1]}</p>
            <div className="audience-context-note mt-6">
              <p className="text-xs font-semibold">
                {audience === "student"
                  ? "A question for your notes"
                  : "A question for your conversation"}
              </p>
              <p className="mt-3 text-xl font-medium">{prompts[selected]}</p>
            </div>
          </Change>
        </div>
      </div>
    </div>
  );
}
