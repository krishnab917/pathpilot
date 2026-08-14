import { describe, expect, it } from "vitest";
import { needsRichMentorRenderer } from "../client/src/components/MentorMessageContent";

describe("mentor message renderer selection", () => {
  it("keeps ordinary guidance on the lightweight renderer", () => {
    expect(needsRichMentorRenderer("**Start small.**\n\n- Pick one project\n- Set a deadline")).toBe(false);
  });

  it("loads the rich renderer only for advanced Markdown content", () => {
    expect(needsRichMentorRenderer("```ts\nconst goal = true;\n```")).toBe(true);
    expect(needsRichMentorRenderer("| Step | Outcome |\n| --- | --- |\n| Plan | Focus |")).toBe(true);
    expect(needsRichMentorRenderer("[Resource](https://example.com)")).toBe(true);
  });
});
