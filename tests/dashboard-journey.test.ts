import { describe, expect, it } from "vitest";
import { buildDashboardJourney } from "../client/src/lib/dashboard-journey";

describe("dashboard journey", () => {
  it("starts a new student with simulation as the only current journey step and dominant action", () => {
    const journey = buildDashboardJourney({ hasResumableSimulation: false, hasCompletedSimulation: false, hasRoadmap: false });

    expect(journey.primary).toMatchObject({ title: "Complete your first simulation", cta: "Start simulation", section: "simulate" });
    expect(journey.steps.map(step => step.state)).toEqual(["current", "upcoming", "upcoming"]);
  });

  it("continues a saved in-progress simulation before suggesting later journey stages", () => {
    const journey = buildDashboardJourney({ hasResumableSimulation: true, hasCompletedSimulation: false, hasRoadmap: false });

    expect(journey.primary).toMatchObject({ title: "Continue your career simulation", cta: "Continue simulation", section: "simulate" });
    expect(journey.simulation).toMatchObject({ status: "In progress", cta: "Continue simulation" });
    expect(journey.steps.map(step => step.state)).toEqual(["current", "upcoming", "upcoming"]);
  });

  it("makes simulation-result review current after completion until a roadmap exists", () => {
    const journey = buildDashboardJourney({ hasResumableSimulation: false, hasCompletedSimulation: true, hasRoadmap: false });

    expect(journey.primary).toMatchObject({ title: "Review your simulation results", cta: "Review results", section: "simulate" });
    expect(journey.simulation).toMatchObject({ status: "Results available", cta: "Try another simulation" });
    expect(journey.steps.map(step => step.state)).toEqual(["complete", "current", "upcoming"]);
  });

  it("moves the current action to the roadmap after the student has both simulation evidence and a roadmap", () => {
    const journey = buildDashboardJourney({ hasResumableSimulation: false, hasCompletedSimulation: true, hasRoadmap: true });

    expect(journey.primary).toMatchObject({ title: "Continue your personalized roadmap", cta: "Open roadmap", section: "roadmap" });
    expect(journey.steps.map(step => step.state)).toEqual(["complete", "complete", "current"]);
  });
});
