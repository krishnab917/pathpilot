import { readFileSync } from "node:fs";
import postcss from "postcss";
import { expect, it } from "vitest";

it("keeps responsive planning tables and actions in the compact layout through tablet widths", () => {
  const css = postcss.parse(readFileSync(new URL("../client/src/design-system.css", import.meta.url), "utf8"));
  const rules: string[] = [];
  css.walkAtRules("media", media => {
    if (media.params !== "(max-width: 1023px)") return;
    media.walkRules(rule => { if (rule.selector.includes(".pp-responsive-table")) rules.push(rule.toString()); });
  });
  expect(rules.join("\n")).toContain("min-width: 0");
  expect(rules.join("\n")).toContain("grid-template-columns: repeat(2, minmax(0, 1fr))");
  expect(rules.join("\n")).toContain("grid-column: 1 / -1");
  expect(rules.join("\n")).toContain("flex-wrap: wrap");
});
