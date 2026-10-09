import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { LandingDiscoveryPreview } from "@/components/LandingDiscoveryPreview";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CareerSimulationSelector } from "@/components/CareerSimulationSelector";
import { LandingOpportunitiesPreview } from "@/components/LandingOpportunitiesPreview";
import { DashboardJourneyPanel } from "@/components/DashboardJourneyPanel";
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

export function LandingWalkthrough({ onStart }: { onStart: () => void }) {
  const reduceMotion = useReducedMotion();
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
      className="landing-walkthrough mt-9 gap-0"
    >
      <TabsList
        aria-label="PathPilot product walkthrough"
        className="grid h-auto w-full grid-cols-2 gap-0 rounded-none border border-border bg-card p-0 sm:grid-cols-3 lg:grid-cols-6"
      >
        {landingJourneySteps.map((item, index) => (
          <TabsTrigger
            key={item.id}
            value={item.id}
            className="h-full justify-start whitespace-normal rounded-none border-0 border-b-2 border-transparent px-3 py-4 text-left text-xs data-[state=active]:border-primary data-[state=active]:bg-secondary data-[state=active]:text-primary data-[state=active]:shadow-none"
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
          className="m-0 border-x border-b border-border bg-card"
        >
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.24 }}
            className="grid lg:min-h-[510px] lg:grid-cols-[0.7fr_1.3fr]"
          >
            <div className="border-b border-border p-5 sm:p-8 lg:border-b-0 lg:border-r">
              <p className="eyebrow">
                Step 0{index + 1} · {item.label}
              </p>
              <h3 className="mt-4 text-2xl font-semibold tracking-[-0.045em] sm:text-3xl">
                {item.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                {item.description}
              </p>
              <p className="mt-6 border-t border-border pt-4 text-xs leading-6">
                <span className="font-semibold">Then: </span>
                {item.next}
              </p>
            </div>
            <div className="min-w-0 bg-secondary/50 p-5 sm:p-7">
              {item.id === "discover" && (
                <LandingDiscoveryPreview
                  onExplore={id => {
                    setCareer(id);
                    setStep("explore");
                  }}
                />
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
                          className="flex gap-3 border-t border-border pt-3 text-xs leading-6"
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
                    Illustrative roadmap step · See the full showcase below
                  </p>
                  <h4 className="mt-5 text-lg font-semibold">
                    Build a study planner
                  </h4>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Choose one useful task, make a first version, and record
                    what you learned.
                  </p>
                  <ol className="mt-6 space-y-4 border-l border-border pl-5">
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
                  <div className="mt-5">
                    <LandingOpportunitiesPreview />
                  </div>
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
          </motion.div>
        </TabsContent>
      ))}
      <div className="flex items-center justify-between gap-3 border-x border-b border-border bg-card px-4 py-3">
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
