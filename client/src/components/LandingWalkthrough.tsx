import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  FlaskConical,
  Target,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CareerSimulationSelector } from "@/components/CareerSimulationSelector";
import {
  CurrentPlanFocus,
  DashboardJourneyPanel,
} from "@/components/DashboardJourneyPanel";
import { buildDashboardJourney } from "@/lib/dashboard-journey";
import { landingJourneySteps } from "@/lib/landing-copy";
import {
  landingCareerExamples,
  landingSimulationExcerpt,
} from "@/lib/landing-product-examples";

const previewJourney = buildDashboardJourney({
  hasCompletedSimulation: true,
  hasResumableSimulation: false,
  hasRoadmap: true,
});
const opportunityCategories = [
  {
    title: "Internships",
    description: "Explore work and learning experiences.",
    icon: Compass,
  },
  {
    title: "Competitions",
    description: "Find a challenge to put your interests into practice.",
    icon: Trophy,
  },
  {
    title: "Research",
    description: "Look for opportunities to investigate a question.",
    icon: FlaskConical,
  },
];

export function LandingWalkthrough({ onStart }: { onStart: () => void }) {
  const [step, setStep] = useState("discover");
  const [career, setCareer] = useState(landingCareerExamples[0].id);
  const currentIndex = landingJourneySteps.findIndex(item => item.id === step);
  const selectedCareer = landingCareerExamples.find(
    item => item.id === career
  )!;

  return (
    <Tabs
      value={step}
      onValueChange={setStep}
      activationMode="manual"
      className="mt-9 gap-0"
    >
      <TabsList
        aria-label="PathPilot product walkthrough"
        className="grid h-auto w-full grid-cols-2 gap-0 rounded-none border border-slate-200 bg-white p-0 sm:grid-cols-3 lg:grid-cols-6"
      >
        {landingJourneySteps.map((item, index) => (
          <TabsTrigger
            key={item.id}
            value={item.id}
            className="h-full justify-start whitespace-normal rounded-none border-0 border-b-2 border-transparent px-3 py-4 text-left text-xs data-[state=active]:border-primary data-[state=active]:bg-slate-50 data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            <span className="data-value shrink-0 text-[10px]">
              0{index + 1}
            </span>
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {landingJourneySteps.map((item, index) => (
        <TabsContent
          key={item.id}
          value={item.id}
          className="m-0 border-x border-b border-slate-200 bg-white"
        >
          <div className="grid lg:min-h-[510px] lg:grid-cols-[0.7fr_1.3fr]">
            <div className="border-b border-slate-200 p-5 sm:p-8 lg:border-b-0 lg:border-r">
              <p className="eyebrow">
                Step 0{index + 1} · {item.label}
              </p>
              <h3 className="mt-4 text-2xl font-semibold tracking-[-0.045em] sm:text-3xl">
                {item.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                {item.description}
              </p>
              <p className="mt-6 border-t border-slate-200 pt-4 text-xs leading-6">
                <span className="font-semibold">Then: </span>
                {item.next}
              </p>
            </div>
            <div className="min-w-0 bg-slate-50/50 p-5 sm:p-7">
              {item.id === "discover" && (
                <figure>
                  <figcaption className="text-xs leading-5 text-muted-foreground">
                    Topics from PathPilot's student onboarding
                  </figcaption>
                  <div className="mt-6 flex items-center gap-3">
                    <Compass className="size-5 text-primary" />
                    <p className="text-lg font-semibold">What pulls you in?</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Choose the subjects and fields that make you curious. More
                    than one is welcome.
                  </p>
                  <ul
                    aria-label="Example interests"
                    className="mt-5 flex flex-wrap gap-2"
                  >
                    {[
                      "Technology",
                      "Science",
                      "Business",
                      "Medicine",
                      "Engineering",
                      "Arts",
                      "Law",
                      "Environment",
                    ].map(topic => (
                      <li
                        key={topic}
                        className="status-tag px-3 py-2 normal-case text-xs"
                      >
                        {topic}
                      </li>
                    ))}
                  </ul>
                  <dl className="mt-6 divide-y divide-slate-200 border-y border-slate-200 text-sm">
                    {[
                      ["Your context", "Grade, country, and education system"],
                      ["Your strengths", "Skills you have started building"],
                      ["Your activities", "Where you learn and contribute"],
                      [
                        "Your direction",
                        "The kind of work that matters to you",
                      ],
                    ].map(([title, description]) => (
                      <div
                        key={title}
                        className="grid gap-1 py-3 sm:grid-cols-[1fr_1.6fr]"
                      >
                        <dt className="font-medium">{title}</dt>
                        <dd className="text-xs leading-5 text-muted-foreground">
                          {description}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </figure>
              )}
              {item.id === "explore" && (
                <div>
                  <p className="text-xs leading-5 text-muted-foreground">
                    The actual PathPilot career selector, showing three
                    technology examples. Try searching or selecting one.
                  </p>
                  <CareerSimulationSelector
                    careers={landingCareerExamples}
                    value={career}
                    onChange={setCareer}
                  />
                  <p
                    aria-live="polite"
                    className="mt-4 border-l-2 border-primary pl-3 text-xs leading-6"
                  >
                    <strong>{selectedCareer.name}: </strong>
                    {selectedCareer.simulationIntro}
                  </p>
                </div>
              )}
              {item.id === "experience" && (
                <figure>
                  <figcaption className="text-xs leading-5 text-muted-foreground">
                    Actual opening excerpt · Software Engineer simulation
                  </figcaption>
                  <h4 className="mt-5 text-lg font-semibold">
                    {landingSimulationExcerpt.title}
                  </h4>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {landingSimulationExcerpt.situation}
                  </p>
                  <ol className="mt-5 space-y-3">
                    {landingSimulationExcerpt.choices.map(
                      (choice, choiceIndex) => (
                        <li
                          key={choice}
                          className="flex gap-3 border-t border-slate-200 pt-3 text-xs leading-6"
                        >
                          <span className="data-value text-primary">
                            0{choiceIndex + 1}
                          </span>
                          {choice}
                        </li>
                      )
                    )}
                  </ol>
                  <p className="mt-5 text-xs leading-5 text-muted-foreground">
                    A preview to read here. In your workspace, your choices
                    change the scenario and are saved with your progress.
                  </p>
                </figure>
              )}
              {item.id === "roadmap" && (
                <div>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Actual roadmap-focus component · Illustrative project step
                  </p>
                  <CurrentPlanFocus
                    title="Build a small project you can explain"
                    description="Choose a simple problem, make a first version, and record what you learned."
                    rationale="This example connects a technology interest to a manageable project. Your own roadmap uses your chosen career and saved context."
                    cta="Build your own path"
                    onClick={onStart}
                  />
                  <ol className="mt-6 space-y-4 border-l border-slate-300 pl-5">
                    {[
                      ["Skill", "Learn something you can apply."],
                      ["Project", "Use it to make or investigate something."],
                      ["Experience", "Try it in a different setting."],
                    ].map(([title, description]) => (
                      <li key={title}>
                        <p className="text-sm font-semibold">{title}</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {description}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {item.id === "opportunities" && (
                <figure>
                  <figcaption className="text-xs leading-5 text-muted-foreground">
                    Inside Opportunities · Browse by category, country, and
                    grade
                  </figcaption>
                  <ul className="mt-5 divide-y divide-slate-200 border-y border-slate-200">
                    {opportunityCategories.map(
                      ({ title, description, icon: Icon }) => (
                        <li key={title} className="flex items-start gap-4 py-5">
                          <Icon
                            aria-hidden="true"
                            className="mt-1 size-5 shrink-0 text-primary"
                          />
                          <div>
                            <p className="text-sm font-semibold">{title}</p>
                            <p className="mt-1 text-xs leading-6 text-muted-foreground">
                              {description}
                            </p>
                          </div>
                        </li>
                      )
                    )}
                  </ul>
                  <p className="mt-5 flex items-center gap-2 text-sm font-medium">
                    <Target className="size-4 text-primary" />
                    Save an opportunity. Make it a goal.
                  </p>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground">
                    Listings include source and eligibility details. Check
                    current deadlines and availability with the organizer before
                    acting.
                  </p>
                </figure>
              )}
              {item.id === "continue" && (
                <div>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Actual workspace journey component · Example after a
                    simulation and roadmap
                  </p>
                  <DashboardJourneyPanel
                    journey={previewJourney}
                    onNavigate={onStart}
                  />
                  <p className="mt-4 text-xs leading-6 text-muted-foreground">
                    Preview actions open your own workspace or sign-in. No
                    sample progress is saved.
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      ))}
      <div className="flex items-center justify-between gap-3 border-x border-b border-slate-200 bg-white px-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          disabled={currentIndex === 0}
          onClick={() => setStep(landingJourneySteps[currentIndex - 1].id)}
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Previous
        </Button>
        <span className="data-value text-xs text-muted-foreground">
          {currentIndex + 1} / {landingJourneySteps.length}
        </span>
        {currentIndex < landingJourneySteps.length - 1 ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep(landingJourneySteps[currentIndex + 1].id)}
          >
            Next step
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        ) : (
          <Button size="sm" onClick={onStart}>
            Start exploring
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        )}
      </div>
    </Tabs>
  );
}
