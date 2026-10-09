import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { Router } from "wouter";
import { describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "../client/src/contexts/ThemeContext";
import { AudienceExperience } from "../client/src/pages/AudienceExperience";
import Home from "../client/src/pages/Home";
import {
  audienceOrder,
  audienceExperiences,
  adultRoadmapChapters,
} from "../client/src/lib/audience-experiences";
import {
  AudienceProjects,
  AudienceGoals,
  AudienceMentor,
} from "../client/src/components/AudienceProductTours";
import {
  publicOpportunityDetails,
  opportunityExamples,
} from "../client/src/lib/landing-opportunities";

vi.stubGlobal("React", React);
vi.mock("../client/src/_core/hooks/useAuth", () => ({
  useAuth: () => ({ isAuthenticated: false }),
}));
const render = (node: React.ReactElement) =>
  renderToStaticMarkup(
    React.createElement(
      Router,
      { ssrPath: "/" },
      React.createElement(ThemeProvider, null, node)
    )
  );

describe("audience product experiences", () => {
  it("keeps the homepage a standalone product overview with early dedicated audience routes", () => {
    const html = render(React.createElement(Home));
    expect(html).toContain('id="product-overview"');
    expect(html).toContain("Discover your career.");
    expect(html).toContain("Build the path to reach it.");
    expect(html.indexOf('id="audiences"')).toBeLessThan(
      html.indexOf('id="opportunities"')
    );
    const choices = html.match(
      /<nav aria-label="Choose your PathPilot audience"[\s\S]*?<\/nav>/
    )?.[0];
    expect(choices).toBeDefined();
    for (const role of audienceOrder) {
      expect(choices).toContain(`href="${audienceExperiences[role].route}"`);
      expect(choices).toContain(audienceExperiences[role].label);
    }
    expect(html).toContain("strengthen the substance of their college");
    expect(html).toContain("without promising admissions results");
  });
  it("orders the actual DOM by audience priorities without dropping any capability", () => {
    const orders = {
      student: [
        "discovery",
        "opportunities",
        "roadmap",
        "projects",
        "goals",
        "college",
        "mentor",
      ],
      parent: [
        "discovery",
        "roadmap",
        "projects",
        "goals",
        "college",
        "opportunities",
        "mentor",
      ],
      counselor: [
        "discovery",
        "opportunities",
        "roadmap",
        "goals",
        "projects",
        "college",
        "mentor",
      ],
    };
    for (const audience of audienceOrder) {
      expect(audienceExperiences[audience].sections).toEqual(orders[audience]);
      const html = render(
        React.createElement(AudienceExperience, { audience })
      );
      const positions = orders[audience].map(section =>
        html.indexOf(
          `id="${section === "roadmap" ? "roadmap-preview" : `audience-${section}`}"`
        )
      );
      expect(positions.every(position => position >= 0)).toBe(true);
      expect(positions).toEqual([...positions].sort((a, b) => a - b));
      expect(html).toContain('href="#audience-discovery"');
    }
  });
  for (const audience of audienceOrder) {
    it(`renders a complete, distinct ${audience} journey without live requests`, () => {
      const html = render(
        React.createElement(AudienceExperience, { audience })
      );
      expect(html).toContain(audienceExperiences[audience].headline[0]);
      expect(html).toMatch(
        /<a[^>]*data-slot="button"[^>]*class="[^"]*bg-primary/
      );
      for (const id of [
        "audience-opportunities",
        "audience-discovery",
        "roadmap-preview",
        "audience-projects",
        "audience-goals",
        "audience-mentor",
        "audience-college",
      ])
        expect(html).toContain(`id="${id}"`);
      expect(html).toContain('aria-label="View PathPilot by audience"');
      expect(html.match(/aria-current="page"/g)).toHaveLength(1);
      expect(html).toContain('aria-valuenow="20"');
      expect(html).toContain("not live AI");
      expect(html).toContain("not a promised admissions result");
      const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(x => x[1]);
      expect(new Set(ids).size).toBe(ids.length);
    });
  }
  it("uses dedicated routes, preserving the school referral and authenticated routes", () => {
    const app = readFileSync("client/src/App.tsx", "utf8");
    for (const route of [
      "/students",
      "/parents",
      "/counselors",
      "/schools",
      "/app/:section",
      "/auth",
    ])
      expect(app).toContain(`path="${route}"`);
    const home = readFileSync("client/src/pages/Home.tsx", "utf8");
    expect(home).toContain("href={audienceExperiences[role].route}");
    expect(audienceOrder.map(x => audienceExperiences[x].route)).toEqual([
      "/students",
      "/parents",
      "/counselors",
    ]);
  });
  it("changes the controls and information, not only headings", () => {
    const student = render(
      React.createElement(AudienceExperience, { audience: "student" })
    );
    const parent = render(
      React.createElement(AudienceExperience, { audience: "parent" })
    );
    const counselor = render(
      React.createElement(AudienceExperience, { audience: "counselor" })
    );
    expect(student).toContain("Try updating the example milestones");
    expect(parent).not.toContain("Try updating the example milestones");
    expect(parent).toContain("Inspect example project work");
    expect(counselor).toContain("Inspect project relationships");
    expect(parent).toContain("A direction your student might explore");
    expect(counselor).toContain("Direction to discuss");
    expect(counselor).toContain("Current conversation priority");
    expect(parent).toContain("Read the plan together");
    expect(student).toContain("Add 25% progress");
    expect(parent).not.toContain("Add 25% progress");
  });
  it("keeps privacy and role boundaries explicit", () => {
    for (const audience of ["parent", "counselor"] as const) {
      const html = render(
        React.createElement(AudienceExperience, { audience })
      );
      expect(html).toContain("not automatically shared");
      expect(html).toContain("not this full private goal list");
      expect(html).toContain("not an additional parent or counselor feature");
      expect(adultRoadmapChapters[audience]).toHaveLength(6);
    }
  });
  it("highlights the active milestone even when a role hides completed work", () => {
    for (const audience of audienceOrder) {
      const html = render(
        React.createElement(AudienceExperience, { audience })
      );
      const current = [
        ...html.matchAll(/<li[^>]*data-current="true"[^>]*>([\s\S]*?)<\/li>/g),
      ];
      expect(current).toHaveLength(1);
      expect(current[0][1]).toContain("Build a study planner");
      expect(current[0][1]).toContain("In progress");
    }
    const css = readFileSync("client/src/pages/landing-page.css", "utf8");
    expect(css).toContain('.landing-tour-plan li[data-current="true"]');
    expect(css).not.toContain(".landing-tour-plan li:nth-child(2)");
  });
  it("allows student goal actions to wrap on narrow phones", () => {
    const html = render(
      React.createElement(AudienceGoals, { audience: "student" })
    );
    expect(html).toContain('class="mt-5 flex flex-wrap gap-3"');
    expect(html).toContain("Add 25% progress");
    expect(html).toContain("Reset example");
  });
  it("keeps every feature’s audience purpose explicit and avoids unsupported promises", () => {
    for (const config of Object.values(audienceExperiences)) {
      expect(Object.keys(config.purposes)).toHaveLength(7);
      const text = JSON.stringify(config).toLowerCase();
      for (const claim of [
        "ferpa compliant",
        "guaranteed admission",
        "unlock your potential",
        "parent dashboard access",
      ])
        expect(text).not.toContain(claim);
    }
  });
  it("adapts the public record without inventing dates or student status", () => {
    for (const item of opportunityExamples) {
      const record = publicOpportunityDetails(item, ["Software Engineer"]);
      expect(record.title).toBe(item.title);
      expect(record.sourceUrl).toBe(item.sourceUrl);
      expect(record.applicationDeadlineAt).toBeNull();
      expect(record.savedStatus).toBeNull();
      expect(record).not.toHaveProperty("verifiedAt");
    }
  });
  it("does not wire public demonstration actions to private services", () => {
    const source = readFileSync(
      "client/src/components/AudienceProductTours.tsx",
      "utf8"
    );
    for (const forbidden of [
      "trpc.",
      "fetch(",
      "supabase",
      ".mutate(",
      "localStorage",
    ])
      expect(source).not.toContain(forbidden);
    for (const component of [AudienceProjects, AudienceGoals, AudienceMentor]) {
      const html = render(
        React.createElement(component, { audience: "parent" })
      );
      expect(html).not.toContain('type="submit"');
    }
  });
});
