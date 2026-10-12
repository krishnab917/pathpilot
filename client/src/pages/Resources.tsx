import { Link, useLocation } from "wouter";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { normalizePagePath } from "@shared/public-seo";

export function ResourceLinks() {
  return (
    <nav
      aria-label="Career planning resources"
      className="mx-auto flex max-w-7xl flex-wrap gap-x-6 gap-y-3 px-5 py-8 text-sm text-muted-foreground sm:px-8"
    >
      <Link href="/resources" className="underline underline-offset-4">
        Career exploration resources
      </Link>
      <Link href="/career-simulations" className="underline underline-offset-4">
        How career simulations work
      </Link>
    </nav>
  );
}

export default function Resources() {
  const [location] = useLocation();
  const path = normalizePagePath(location);
  const guide = path === "/resources/explore-careers-in-high-school";
  const simulation = path === "/career-simulations";
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-6">
        <Brand />
        <Link href="/" className="text-sm underline underline-offset-4">
          Product overview
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-12 sm:py-20">
        <p className="eyebrow">PathPilot resources</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
          {guide
            ? "How to start exploring careers in high school"
            : simulation
              ? "Try a small part of a career before choosing a direction."
              : "A useful starting point for what comes next."}
        </h1>
        <div className="mt-8 space-y-8 text-base leading-8 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-semibold [&_a]:underline [&_a]:underline-offset-4">
          {guide ? (
            <>
              <p>
                Start with two directions you are curious about. Compare the
                work people actually do, try one small activity from each, and
                use what you learn to choose a next step. You do not need to
                choose a lifelong career before you begin.
              </p>
              <p className="text-sm text-muted-foreground">
                By PathPilot · Updated October 12, 2026. General planning
                guidance, not an individual assessment or admissions advice.
              </p>
              <section>
                <h2>1. Look for activities, not just impressive job titles</h2>
                <p>
                  Write down three things you have enjoyed doing recently. Be
                  specific: explaining a difficult idea, debugging a program,
                  organizing an event, or comparing evidence. For each, note
                  what you enjoyed and what you would rather avoid. Use these
                  observations to pick two careers to investigate, not to label
                  yourself.
                </p>
                <p>
                  The{" "}
                  <a href="https://www.bls.gov/ooh/">
                    U.S. Bureau of Labor Statistics Occupational Outlook
                    Handbook
                  </a>{" "}
                  describes occupations, typical work, entry-level education,
                  pay, and outlook. Read the duties and work environment before
                  focusing on salary. These are U.S. occupation-level
                  descriptions, not a prediction of your personal outcome.
                </p>
              </section>
              <section>
                <h2>2. Compare the same questions for each direction</h2>
                <p>
                  Make a short comparison with four headings: everyday tasks,
                  working environment, preparation, and unanswered questions.
                  What would a normal day involve? Would you prefer that kind of
                  work? Which preparation could you realistically try now? What
                  would you need to ask someone in the field?
                </p>
                <p>
                  Use <a href="https://www.onetonline.org/">O*NET OnLine</a> to
                  investigate occupational tasks and skills. Treat descriptions
                  as a starting point for investigation, not a checklist that
                  you must already satisfy.
                </p>
              </section>
              <section>
                <h2>3. Try one manageable piece of work</h2>
                <p>
                  If you are comparing software and design, try fixing a small
                  interface problem and then sketching a clearer version of the
                  same screen. Give each activity a modest scope. Keep a note of
                  what you made, what was difficult, and whether you wanted to
                  continue. A{" "}
                  <Link href="/career-simulations">career simulation</Link> can
                  provide another structured example of representative work, but
                  it cannot reproduce an entire profession.
                </p>
              </section>
              <section>
                <h2>4. Turn the comparison into an action</h2>
                <p>
                  Choose a next step that answers a remaining question: a
                  beginner project, a conversation with a counselor, or an
                  opportunity whose eligibility you can verify. Check current
                  requirements, costs, dates, and supervision needs on the
                  opportunity provider's own website before applying. Do not
                  treat an interesting listing as a confirmed place or offer.
                </p>
              </section>
              <section>
                <h2>5. Keep evidence of learning, not a perfect story</h2>
                <p>
                  Save a brief record of what you tried, your role, a piece of
                  work, and what you would change next time. Those notes can
                  help you discuss interests and experiences when preparing for
                  college. They do not guarantee an admissions advantage. If the
                  activity did not fit, that is still useful information for
                  your next experiment.
                </p>
              </section>
              <section>
                <h2>How can a parent or counselor help?</h2>
                <p>
                  Ask “What surprised you?” and “What would you like to try
                  next?” before suggesting a career. Review only work the
                  student chooses to share. PathPilot's{" "}
                  <Link href="/parents">parent experience</Link> and{" "}
                  <Link href="/counselors">counselor experience</Link> explain
                  supportive discussion without implying automatic access to
                  private student records.
                </p>
              </section>
              <section>
                <h2>Put a next step into practice</h2>
                <p>
                  The <Link href="/students">student experience</Link> connects
                  discovery with opportunities, a roadmap, projects, goals, and
                  Mentor guidance. Start with one question you want to explore
                  rather than trying to use every feature at once.
                </p>
              </section>
            </>
          ) : simulation ? (
            <>
              <p>
                Career simulations are short, authored work situations that let
                you explore decisions and trade-offs associated with a
                profession. In PathPilot, they are part of career exploration,
                not a test that determines what you should become.
              </p>
              <section>
                <h2>What happens in a simulation?</h2>
                <p>
                  Choose an available career in the application, review the
                  assignment and information provided, and work through its
                  situations. Your actions lead to feedback and a completion
                  summary. The exact interactions vary by simulation. Examples
                  are fictional, not real workplace incidents or student
                  results.
                </p>
              </section>
              <section>
                <h2>What can you learn from it?</h2>
                <p>
                  Notice which tasks hold your attention, what information you
                  look for, and how you approach a trade-off. These are
                  observations from a short experience, not validated measures
                  of aptitude, personality, or professional ability. A
                  simulation simplifies real work and does not replace training,
                  work experience, or guidance from a professional.
                </p>
              </section>
              <section>
                <h2>What should you do afterward?</h2>
                <p>
                  Write down one activity you liked and one question you still
                  have. Compare another direction, explore a beginner project,
                  or discuss a next step with a counselor. Our{" "}
                  <Link href="/resources/explore-careers-in-high-school">
                    career exploration guide
                  </Link>{" "}
                  shows how to make that comparison concrete.
                </p>
              </section>
              <section>
                <h2>What stays private?</h2>
                <p>
                  This page describes the product without exposing personal runs
                  or results. Parents and counselors do not automatically
                  receive account access. See the{" "}
                  <Link href="/privacy">Privacy Policy</Link> for how saved
                  information is handled.
                </p>
              </section>
            </>
          ) : (
            <>
              <p>
                Explore a direction, try something manageable, and decide what
                to do next. These resources are free to read without an account.
              </p>
              <section>
                <h2>
                  <Link href="/resources/explore-careers-in-high-school">
                    Start exploring careers in high school
                  </Link>
                </h2>
                <p>
                  A five-step approach to comparing real work, trying a small
                  activity, and keeping useful notes for future planning.
                </p>
              </section>
              <section>
                <h2>
                  <Link href="/career-simulations">
                    Understand career simulations
                  </Link>
                </h2>
                <p>
                  What a short work experience can help you notice, its limits,
                  and how to turn reflection into a next step.
                </p>
              </section>
            </>
          )}
        </div>
        <Button asChild className="mt-10">
          <Link href="/students">Explore the student experience</Link>
        </Button>
        <nav
          aria-label="Related pages"
          className="mt-10 flex flex-wrap gap-5 text-sm underline underline-offset-4"
        >
          <Link href="/resources">All resources</Link>
          <Link href="/parents">For parents</Link>
          <Link href="/counselors">For counselors</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/support">Support</Link>
        </nav>
      </main>
    </div>
  );
}
