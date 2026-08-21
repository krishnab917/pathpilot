import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const authSource = readFileSync(resolve(process.cwd(), "client/src/pages/Auth.tsx"), "utf8");

describe("authentication accessibility", () => {
  it("announces successful account and recovery notices without changing alert handling for failures", () => {
    expect(authSource).toContain('role="alert"');
    expect(authSource).toContain('role="status" aria-live="polite"');
  });

  it("matches the saved registration password policy without blocking existing sign-ins", () => {
    expect(authSource).toContain("const PASSWORD_MIN_LENGTH = 12;");
    expect(authSource).toContain(
      'minLength={mode === "sign-up" ? PASSWORD_MIN_LENGTH : undefined}'
    );
    expect(authSource).toContain(
      "Use at least {PASSWORD_MIN_LENGTH} characters."
    );
  });
});
