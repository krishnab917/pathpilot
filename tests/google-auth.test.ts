import { describe, expect, it, vi } from "vitest";
import { completeGoogleOAuthCallback, getGoogleAuthRedirectUrl, getSafePostAuthPath, startGoogleOAuth } from "../client/src/lib/google-auth";

describe("Google OAuth helpers", () => {
  it("uses the existing Supabase browser OAuth flow and a production-safe callback URL", async () => {
    const signInWithOAuth = vi.fn().mockResolvedValue({ error: null });
    await startGoogleOAuth({ signInWithOAuth }, "/app/roadmap", "https://pathpilot-s64joaqq.manus.space");
    expect(signInWithOAuth).toHaveBeenCalledWith({ provider: "google", options: { redirectTo: "https://pathpilot-s64joaqq.manus.space/auth/callback?next=%2Fapp%2Froadmap" } });
  });

  it("allows only known internal return paths and rejects open-redirect attempts", () => {
    expect(getSafePostAuthPath("/app/mentor")).toBe("/app/mentor");
    expect(getSafePostAuthPath("/onboarding")).toBe("/onboarding");
    expect(getSafePostAuthPath("https://malicious.example")).toBe("/app");
    expect(getSafePostAuthPath("//malicious.example")).toBe("/app");
    expect(getGoogleAuthRedirectUrl("https://malicious.example", "https://pathpilot-s64joaqq.manus.space")).toBe("https://pathpilot-s64joaqq.manus.space/auth/callback?next=%2Fapp");
  });

  it("establishes a Supabase PKCE callback session and returns only a safe internal destination", async () => {
    const exchangeCodeForSession = vi.fn().mockResolvedValue({ error: null });
    const getSession = vi.fn().mockResolvedValue({ data: { session: { user: { id: "student-a" } } }, error: null });
    await expect(completeGoogleOAuthCallback({ exchangeCodeForSession, getSession }, "https://pathpilot-s64joaqq.manus.space/auth/callback?code=opaque&next=/app/goals")).resolves.toEqual({ ok: true, next: "/app/goals" });
    expect(exchangeCodeForSession).toHaveBeenCalledWith("opaque");
  });

  it("returns a safe generic failure state for provider cancellation, exchange failure, or a missing session", async () => {
    const failed = { exchangeCodeForSession: vi.fn().mockResolvedValue({ error: new Error("provider detail") }), getSession: vi.fn() };
    await expect(completeGoogleOAuthCallback(failed, "https://pathpilot-s64joaqq.manus.space/auth/callback?code=opaque&next=https://malicious.example")).resolves.toEqual({ ok: false, next: "/app" });
    const canceled = { exchangeCodeForSession: vi.fn(), getSession: vi.fn() };
    await expect(completeGoogleOAuthCallback(canceled, "https://pathpilot-s64joaqq.manus.space/auth/callback#error=access_denied")).resolves.toEqual({ ok: false, next: "/app" });
  });
});
