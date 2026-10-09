import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PathTimeline } from "../client/src/components/PathTimeline";
import {
  FeedbackState,
  ProgressIndicator,
} from "../client/src/components/ProductPrimitives";

// Vitest's Node transform uses the classic JSX runtime for directly imported TSX.
vi.stubGlobal("React", React);

describe("PathPilot presentation contracts", () => {
  it("exposes the bounded saved progress to assistive technology", () => {
    for (const [value, expected] of [
      [35, 35],
      [140, 100],
      [-2, 0],
      [NaN, 0],
    ]) {
      const html = renderToStaticMarkup(
        React.createElement(ProgressIndicator, {
          value,
          label: "Project progress",
        })
      );
      expect(html).toContain(`aria-valuenow="${expected}"`);
      expect(html).toContain('aria-label="Project progress"');
    }
  });
  it("identifies only the first unfinished step as current without hiding other steps", () => {
    const steps = [100, 40, 0].map((progress, index) => ({
      id: String(index),
      title: `Step ${index}`,
      description: "Saved milestone",
      metadata: "Year 1",
      progress,
    }));
    const html = renderToStaticMarkup(
      React.createElement(PathTimeline, { steps })
    );
    expect(html.match(/aria-current="step"/g)).toHaveLength(1);
    expect(html).toContain('data-state="complete"');
    expect(html).toContain('data-state="upcoming"');
    expect(html).toContain("Step 2");
    const done = renderToStaticMarkup(
      React.createElement(PathTimeline, {
        steps: steps.map(step => ({ ...step, progress: 100 })),
      })
    );
    expect(done).not.toContain('aria-current="step"');
  });
  it("announces loading and errors, not ordinary empty content", () => {
    const props = {
      title: "Saved work",
      description: "Your work stays available.",
    };
    expect(
      renderToStaticMarkup(
        React.createElement(FeedbackState, { ...props, tone: "loading" })
      )
    ).toContain('role="status"');
    expect(
      renderToStaticMarkup(
        React.createElement(FeedbackState, { ...props, tone: "error" })
      )
    ).toContain('role="alert"');
    expect(
      renderToStaticMarkup(React.createElement(FeedbackState, props))
    ).not.toContain('role="alert"');
  });
});
