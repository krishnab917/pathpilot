import React from "react";
import { renderToPipeableStream } from "react-dom/server";
import { PassThrough } from "node:stream";
import { mkdirSync, writeFileSync, readdirSync, readFileSync, cpSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { ThemeProvider } from "../client/src/contexts/ThemeContext";
import { TooltipProvider } from "../client/src/components/ui/tooltip";
import Workspace from "../client/src/pages/Workspace";
import Home from "../client/src/pages/Home";
import Auth from "../client/src/pages/Auth";
import { Button } from "../client/src/components/ui/button";
import { Input } from "../client/src/components/ui/input";
import {
  FeedbackState,
  ProgressIndicator,
} from "../client/src/components/ProductPrimitives";
import { opportunityExamples } from "../client/src/lib/landing-opportunities";
import { roadmapStorySteps } from "../client/src/lib/landing-story";

// Test-only rendering of the real screens. No production auth changes, network,
// student data, mutation execution, or persistence. HTML is an unhydrated review.
const fixture = vi.hoisted(() => ({
  data: {} as Record<string, unknown>,
  signedIn: true,
}));
vi.stubGlobal("React", React);
vi.mock("../client/src/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: fixture.signedIn,
    loading: false,
    user: { name: "Example student", id: "palette-fixture" },
    logout: vi.fn(),
  }),
}));
vi.mock("../client/src/lib/trpc", () => {
  const blocked = () => {
    throw new Error("Palette fixtures cannot execute requests");
  };
  const node = (path: string[] = []): unknown =>
    new Proxy(() => {}, {
      get: (_, key: string) => {
        if (key === "useQuery")
          return () => ({
            data: fixture.data[path.join(".")],
            isLoading: false,
            isFetching: false,
            error: null,
            refetch: blocked,
          });
        if (key === "useMutation")
          return () => ({
            isPending: false,
            error: null,
            mutate: blocked,
            mutateAsync: blocked,
          });
        if (key === "useUtils") return () => node();
        return node([...path, key]);
      },
    });
  return { trpc: node() };
});

const profile = {
  userId: "palette-fixture",
  name: "Example student",
  countryCode: "US",
  grade: "Grade 11",
  interests: ["Software"],
  skills: ["Design"],
  careerGoals: "Try building useful tools",
};
const matches = [
  "Software Engineer",
  "Data Scientist",
  "UX Designer",
  "Cybersecurity Analyst",
  "Research Scientist",
].map((name, i) => ({
  id: `match-${i}`,
  matchScore: 80 - i * 4,
  reasoning:
    "Illustrative profile result for color review, not a student assessment.",
  strengths: ["Interest in practical problem solving"],
  missingSkills: ["Build and test a small project"],
  realityCheck: "Try the work before deciding.",
  nextSteps: ["Explore a simulation"],
  career: {
    id: `career-${i}`,
    name,
    description: "Explore the work, build skills, and reflect on what fits.",
    salaryRange: "Varies by location",
    educationRequirements: "Varies by role",
    requiredSkills: ["Problem solving"],
    dailyResponsibilities: ["Build and review work"],
    relatedCareers: [],
  },
}));
const goals = [
  "Test the planner with a classmate",
  "Review an opportunity",
  "Finish the interface exercise",
].map((title, i) => ({
  id: `goal-${i}`,
  title,
  description: "Illustrative commitment",
  category: "Project",
  priority: "medium",
  estimatedHours: 2,
  deadline: null,
  progress: [25, 0, 100][i],
  status: i === 2 ? "completed" : "in_progress",
  resources: [],
}));
const roadmap = {
  id: "roadmap-fixture",
  targetCareer: "Software Engineer",
  milestones: roadmapStorySteps.map((step, i) => ({
    id: step.id,
    title: step.title,
    description: step.description,
    category: step.kind.toLowerCase(),
    progress: step.progress,
    year: 1,
    estimatedHours: 4,
    deadline: null,
    status: i === 0 ? "completed" : "in_progress",
    resources: [],
  })),
};

function seed() {
  fixture.data = {
    "pathpilot.profile.get": profile,
    "pathpilot.profile.countryOptions": [{ code: "US", name: "United States" }],
    "pathpilot.dashboard.get": {
      profile,
      matches,
      roadmap,
      goals,
      activeGoals: goals.slice(0, 2),
      readiness: 35,
      recentSimulation: null,
      resumableSimulation: null,
      intelligence: {
        currentDirection: { career: "Software Engineer" },
        nextAction: {
          title: "Build a study planner",
          description: "Turn your direction into a manageable project.",
          rationale: "Apply a skill you have been exploring.",
          cta: "Open roadmap",
          section: "roadmap",
        },
      },
    },
    "pathpilot.reportShares.list": [],
    "pathpilot.projects.list": [
      {
        id: "project-fixture",
        name: "Study planner",
        description:
          "A small tool for organizing tasks. Illustrative work for palette review.",
        skills: ["HTML", "Prototyping"],
        status: "in_progress",
        progress: 35,
        milestones: [],
        roadmapMilestoneId: "build",
      },
    ],
    "pathpilot.mentor.get": {
      conversation: { id: "fixture", user_id: "palette-fixture" },
      messages: [
        {
          id: "1",
          role: "user",
          content: "How could I start testing my planner?",
        },
        {
          id: "2",
          role: "assistant",
          content:
            "Start with one task. Ask a classmate to try it, note where they get stuck, and choose one improvement.",
        },
      ],
    },
    "pathpilot.opportunities.list": {
      items: opportunityExamples.map(item => ({
        ...item,
        participationMode: "details_on_source",
        sourceDateLabel: null,
        countryCodes: [],
        eligibleGrades: [],
        startAt: null,
        endAt: null,
        registrationOpensAt: null,
        applicationDeadlineAt: null,
        verifiedAt: new Date("2026-10-08"),
        savedStatus: null,
        alignedCareers: [],
        relevanceReasons: [],
      })),
      totalCount: 4,
      page: 1,
      totalPages: 1,
      hasNextPage: false,
      relevanceMethod: "Public records; fixture-based color review.",
    },
  };
}

function States() {
  return React.createElement(
    "main",
    { className: "mx-auto max-w-4xl space-y-6 p-8" },
    React.createElement(
      "h1",
      { className: "text-3xl font-semibold" },
      "Shared controls and feedback"
    ),
    React.createElement(
      "div",
      { className: "surface-panel space-y-5 p-6" },
      React.createElement(
        "label",
        null,
        "Project name",
        React.createElement(Input, { defaultValue: "Study planner" })
      ),
      React.createElement(
        "div",
        { className: "flex flex-wrap gap-3" },
        React.createElement(Button, null, "Save changes"),
        React.createElement(Button, { variant: "outline" }, "Cancel"),
        React.createElement(Button, { disabled: true }, "Saving"),
        React.createElement(Button, { variant: "destructive" }, "Delete")
      ),
      React.createElement(ProgressIndicator, {
        value: 60,
        label: "Example project progress",
      }),
      React.createElement(
        "p",
        {
          style: {
            color: "var(--success)",
            background: "var(--success-subtle)",
            padding: 12,
          },
        },
        "✓ Changes saved"
      ),
      React.createElement(
        "p",
        {
          style: {
            color: "var(--warning)",
            background: "var(--warning-subtle)",
            padding: 12,
          },
        },
        "Attention: check the organizer's requirements"
      )
    ),
    React.createElement(FeedbackState, {
      tone: "error",
      title: "That change could not be saved",
      description: "Your input is still here. Try again when you are ready.",
      action: React.createElement(Button, { variant: "outline" }, "Retry"),
    }),
    React.createElement(FeedbackState, {
      tone: "loading",
      title: "Building your roadmap",
      description:
        "Your existing plan stays available while this request runs.",
    }),
    React.createElement(FeedbackState, {
      title: "Your next idea can start here",
      description: "Create a project to define what you want to build.",
      action: React.createElement(Button, null, "Add a project"),
    })
  );
}

async function render(node: React.ReactNode): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = new PassThrough();
    let html = "";
    stream.on("data", chunk => {
      html += chunk;
    });
    stream.on("end", () => resolve(html));
    const result = renderToPipeableStream(node, {
      onAllReady: () => result.pipe(stream),
      onError: reject,
    });
  });
}

describe("isolated real-screen palette review", () => {
  it("renders real product screens with test-only data and no live services", async () => {
    seed();
    const output = process.env.PALETTE_REVIEW_OUTPUT;
    const screens = [
      "home",
      "overview",
      "opportunities",
      "roadmap",
      "discover",
      "portfolio",
      "goals",
      "mentor",
      "settings",
      "auth",
      "states",
    ];
    if (output) {
      mkdirSync(output, { recursive: true });
      cpSync("client/public/fonts", join(output, "fonts"), { recursive: true });
      const css = readdirSync("dist/public/assets")
        .filter(file => file.endsWith(".css"))
        .map(file => readFileSync(join("dist/public/assets", file), "utf8"))
        .join("\n");
      writeFileSync(join(output, "app.css"), css);
    }
    for (const screen of screens) {
      fixture.signedIn = screen !== "home" && screen !== "auth";
      const path =
        screen === "home"
          ? "/"
          : screen === "overview"
            ? "/app"
            : `/app/${screen}`;
      const Component =
        screen === "home"
          ? Home
          : screen === "auth"
            ? Auth
            : screen === "states"
              ? States
              : Workspace;
      const html = await render(
        React.createElement(
          Router,
          { ssrPath: path },
          React.createElement(
            ThemeProvider,
            null,
            React.createElement(
              TooltipProvider,
              null,
              React.createElement(Component)
            )
          )
        )
      );
      expect(html, screen).not.toContain("We could not load your workspace");
      expect(html, screen).toMatch(/<h[12]/);
      if (output)
        writeFileSync(
          join(output, `${screen}.html`),
          `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="app.css"><title>PathPilot palette review · ${screen}</title><style>body{margin:0}.review-tools{position:relative;z-index:100;padding:12px 20px;background:var(--card);color:var(--foreground);border-bottom:1px solid var(--border);display:flex;flex-wrap:wrap;gap:12px;font:13px system-ui}.review-tools select{background:var(--background);color:var(--foreground);padding:6px;border:1px solid var(--input)}.review-tools a{color:var(--primary)}.feature-card{opacity:1}</style></head><body><div class="review-tools"><strong>Color review · fixture data · read-only</strong><label>Palette <select id="palette"><option>A</option><option>B</option><option>C</option></select></label><label>Theme <select id="theme"><option>light</option><option>dark</option></select></label><label>Screen <select id="screen">${screens.map(s => `<option ${s === screen ? "selected" : ""}>${s}</option>`).join("")}</select></label></div>${html}<script>const p=new URLSearchParams(location.search);const palette=document.getElementById('palette'),theme=document.getElementById('theme');palette.value=p.get('palette')||'A';theme.value=p.get('theme')||'light';function apply(){document.documentElement.dataset.palette=palette.value;document.documentElement.classList.toggle('dark',theme.value==='dark');history.replaceState(null,'','?palette='+palette.value+'&theme='+theme.value)}palette.onchange=theme.onchange=apply;apply();document.getElementById('screen').onchange=e=>location.href=e.target.value+'.html?palette='+palette.value+'&theme='+theme.value;document.querySelectorAll('main button').forEach(b=>b.addEventListener('click',e=>e.preventDefault()));</script></body></html>`
        );
    }
  });
});
