import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CareerSimulationSelector, type SimulationCareerOption } from "../client/src/components/CareerSimulationSelector";
vi.stubGlobal("React", React);

const careers: SimulationCareerOption[] = [
  { id: "software", name: "Software Engineer", category: "Technology", icon: "code", description: "Debug software", simulationIntro: "Incident", durationLabel: "3–7 minutes" },
  { id: "teacher", name: "Teacher", category: "Education", icon: "flask", description: "Plan a lesson", simulationIntro: "Lesson", durationLabel: "3–7 minutes" },
];
describe("simulation selection feedback", () => {
  it.each(careers)("identifies $name explicitly next to launch", career => {
    const html = renderToStaticMarkup(React.createElement(CareerSimulationSelector, { careers, value: career.id, onChange: () => {} }));
    expect(html).toContain(`Selected: ${career.name}.`);
    expect(html).toContain("Start simulation opens this career, not the search results.");
    expect(html).toContain('aria-label="Selected simulation"');
  });
  it("does not invent a selection for an unknown saved ID", () => {
    const html = renderToStaticMarkup(React.createElement(CareerSimulationSelector, { careers, value: "unknown", onChange: () => {} }));
    expect(html).toContain("Choose a career before starting.");
    expect(html).not.toContain("Selected: Software Engineer.");
  });
});
