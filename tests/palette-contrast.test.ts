import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(
  new URL("../client/src/color-system.css", import.meta.url),
  "utf8"
);
function luminance(hex: string) {
  const values = hex
    .match(/[a-f\d]{2}/gi)!
    .map(v => parseInt(v, 16) / 255)
    .map(v => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
}
function contrast(a: string, b: string) {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
describe("candidate semantic palette contrast", () => {
  for (const name of ["B", "C"])
    for (const dark of [false, true]) {
      it(`${name} ${dark ? "dark" : "light"} preserves text and essential control contrast`, () => {
        const selector = `:root[data-palette="${name}"]${dark ? ".dark" : ""} {`;
        const block = css
          .slice(css.indexOf(selector) + selector.length)
          .split("}")[0];
        const tokens = Object.fromEntries(
          [...block.matchAll(/--([\w-]+):\s*(#[a-f\d]{6})/gi)].map(m => [
            m[1],
            m[2],
          ])
        );
        for (const [fg, bg] of [
          ["foreground", "background"],
          ["foreground", "card"],
          ["muted-foreground", "secondary"],
          ["primary-foreground", "primary"],
          ["selection-foreground", "selection"],
          ["success", "success-subtle"],
          ["warning", "warning-subtle"],
          ["destructive", "card"],
          ["destructive-foreground", "destructive"],
        ]) {
          expect(
            contrast(tokens[fg], tokens[bg]),
            `${fg} on ${bg}`
          ).toBeGreaterThanOrEqual(4.5);
        }
        for (const [fg, bg] of [
          ["input", "background"],
          ["input", "card"],
          ["ring", "background"],
          ["ring", "secondary"],
          ["progress", "secondary"],
        ]) {
          expect(
            contrast(tokens[fg], tokens[bg]),
            `${fg} on ${bg}`
          ).toBeGreaterThanOrEqual(3);
        }
      });
    }
});
