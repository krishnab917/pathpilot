import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import { describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "../client/src/contexts/ThemeContext";
import Resources from "../client/src/pages/Resources";

vi.stubGlobal("React", React);
function render(path: string) {
  return renderToStaticMarkup(
    React.createElement(
      Router,
      { ssrPath: path },
      React.createElement(ThemeProvider, null, React.createElement(Resources))
    )
  );
}
describe("public resource direct navigation", () => {
  it.each([
    "/resources/explore-careers-in-high-school",
    "/resources/explore-careers-in-high-school/",
  ])("renders the guide, citations, and qualifications at %s", path => {
    const html = render(path);
    expect(html).toContain("How to start exploring careers in high school");
    expect(html).toContain("https://www.bls.gov/ooh/");
    expect(html).toContain("https://www.onetonline.org/");
    expect(html).toContain("They do not guarantee an admissions advantage.");
  });
  it.each(["/career-simulations", "/career-simulations/"])(
    "renders the simulation explanation rather than the resource index at %s",
    path => {
      const html = render(path);
      expect(html).toContain("Try a small part of a career");
      expect(html).toContain("not validated measures of aptitude");
      expect(html).toContain('href="/privacy"');
      expect(html).not.toContain("25 career");
    }
  );
});
