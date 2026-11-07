import { readFileSync } from "node:fs";
import postcss from "postcss";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const styles = postcss.parse(read("../client/src/design-system.css"));

function declarations(selector: string) {
  const values: Record<string, string> = {};
  styles.walkRules(selector, rule => {
    rule.walkDecls(declaration => {
      values[declaration.prop] = declaration.value;
    });
  });
  return values;
}

describe("shared visual control contracts", () => {
  it("sizes only the corner dismiss control, not consumer-provided close actions", () => {
    const dismiss = declarations('[data-slot="dialog-close"][data-dialog-dismiss="true"]');
    expect(dismiss.width).toBe("2.75rem");
    expect(dismiss.height).toBe("2.75rem");
    expect(declarations('[data-slot="dialog-close"]')).toEqual({});
    const source = read("../client/src/components/ui/dialog.tsx");
    expect(source.match(/data-dialog-dismiss="true"/g)).toHaveLength(1);
    expect(source.slice(source.indexOf("function DialogClose"), source.indexOf("function DialogOverlay")))
      .not.toContain("data-dialog-dismiss");
  });

  it("provides a semantic focus outline when keyboard navigation enters a tab panel", () => {
    const focus = declarations('[data-slot="tabs-content"]:focus-visible');
    expect(focus.outline).toBe("2px solid var(--ring)");
    expect(focus["outline-offset"]).toBe("3px");
  });

  it("keeps the two local font families nonblocking without adding remote fonts", () => {
    const fonts = postcss.parse(read("../client/src/typography.css"));
    const faces: string[] = [];
    fonts.walkAtRules("font-face", rule => {
      const values: Record<string, string> = {};
      rule.walkDecls(declaration => { values[declaration.prop] = declaration.value; });
      expect(values["font-display"]).toBe("swap");
      expect(values.src).toMatch(/^url\("\/fonts\/.*\.woff2"\)/);
      faces.push(values["font-family"]);
    });
    expect(faces).toEqual(['"DM Sans"', '"Source Serif 4"']);
  });
});
