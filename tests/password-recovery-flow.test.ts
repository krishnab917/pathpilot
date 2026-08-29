import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const authSource = readFileSync(resolve(root, "client/src/pages/Auth.tsx"), "utf8");
const routeSource = readFileSync(resolve(root, "client/src/App.tsx"), "utf8");
const updateSource = readFileSync(resolve(root, "client/src/pages/UpdatePassword.tsx"), "utf8");

describe("password recovery completion", () => {
  it("sends reset links to the dedicated canonical update-password route", () => {
    expect(authSource).toContain('getAuthRedirectUrl("/auth/update-password")');
    expect(routeSource).toContain('path="/auth/update-password"');
  });

  it("requires a valid Supabase recovery session and never reveals raw provider errors", () => {
    expect(updateSource).toContain("useSupabaseAuth()");
    expect(updateSource).toContain("if (!session)");
    expect(updateSource).toContain("This reset link is no longer available.");
    expect(updateSource).toContain('updateUser({ password })');
    expect(updateSource).toContain("We couldn’t update your password. Request a new reset link and try again.");
    expect(updateSource).not.toContain("updateError.message");
  });

  it("enforces the existing 12-character password minimum and clears the recovery session after success", () => {
    expect(updateSource).toContain("const PASSWORD_MIN_LENGTH = 12");
    expect(updateSource).toContain("password.length < PASSWORD_MIN_LENGTH");
    expect(updateSource).toContain("await supabase.auth.signOut()");
    expect(updateSource).toContain("Go to sign in");
  });
});
