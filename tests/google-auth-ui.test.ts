import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const authSource = readFileSync(resolve(process.cwd(), "client/src/pages/Auth.tsx"), "utf8");
const callbackSource = readFileSync(resolve(process.cwd(), "client/src/pages/AuthCallback.tsx"), "utf8");
const appSource = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");

describe("Google authentication UI", () => {
  it("keeps email/password controls and adds a duplicate-safe Google alternative", () => {
    expect(authSource).toContain("Continue with Google");
    expect(authSource).toContain("or continue with email");
    expect(authSource).toContain("Create an account");
    expect(authSource).toContain("Forgot password?");
    expect(authSource).toContain("disabled={pending}");
    expect(authSource).toContain("Connecting to Google…");
  });

  it("retains the established email/password, confirmation, reset, and safe return behavior", () => {
    expect(authSource).toContain("supabase.auth.signInWithPassword");
    expect(authSource).toContain("supabase.auth.signUp");
    expect(authSource).toContain("supabase.auth.resetPasswordForEmail");
    expect(authSource).toContain("emailRedirectTo: getAuthRedirectUrl()");
    expect(authSource).toContain("navigate(intendedPath);");
  });

  it("uses no client-side Google secret and sends OAuth failures through a safe callback screen", () => {
    expect(authSource).toContain("startGoogleOAuth(supabase.auth, intendedPath)");
    expect(authSource).not.toMatch(/GOOGLE.*SECRET|client_secret|provider_token/i);
    expect(callbackSource).toContain("Google sign-in couldn’t be completed.");
    expect(callbackSource).not.toContain("error.message");
    expect(appSource).toContain('path="/auth/callback" component={AuthCallback}');
  });
});
