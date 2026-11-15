import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("goal editor mutation completion boundary", () => {
  it("only closes the matching editor after a form save, never a progress-only update", () => {
    // Source contract for the real browser reproduction: +25%, immediately Edit,
    // then the progress response used to discard the newly opened editor.
    const source = readFileSync(new URL("../client/src/components/UtilityWorkspaceSections.tsx", import.meta.url), "utf8");
    const goals = source.slice(source.indexOf("export function CompactGoals"));
    expect(goals).toContain("onSuccess: (_result, input)");
    expect(goals).toContain("if (input.title !== undefined) setEditId(current => current === input.id ? null : current)");
    expect(goals).not.toContain("onSuccess: () => { setEditId(null)");
  });
});
