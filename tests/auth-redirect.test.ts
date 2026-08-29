import { getAuthRedirectUrl } from "../client/src/lib/auth-redirect";
import { describe, expect, it } from "vitest";

describe("Supabase email redirect construction", () => {
  it("uses the active HTTPS application origin rather than a localhost default", () => {
    expect(getAuthRedirectUrl("/auth", "https://pathpilotapp.com")).toBe("https://pathpilotapp.com/auth");
    expect(getAuthRedirectUrl("auth", "https://pathpilot-s64joaqq.manus.space")).toBe("https://pathpilot-s64joaqq.manus.space/auth");
    expect(getAuthRedirectUrl("/auth/update-password", "https://pathpilotapp.com")).toBe("https://pathpilotapp.com/auth/update-password");
  });

  it("permits HTTP only for local development and rejects insecure remote origins", () => {
    expect(getAuthRedirectUrl("/auth", "http://localhost:3000")).toBe("http://localhost:3000/auth");
    expect(() => getAuthRedirectUrl("/auth", "http://pathpilot.example")).toThrow("HTTPS");
  });

  it("rejects external paths rather than constructing an open redirect", () => {
    expect(() => getAuthRedirectUrl("https://malicious.example", "https://pathpilotapp.com")).toThrow("active application origin");
    expect(() => getAuthRedirectUrl("//malicious.example", "https://pathpilotapp.com")).toThrow("active application origin");
  });
});
