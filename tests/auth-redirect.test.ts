import { getAuthRedirectUrl } from "../client/src/lib/auth-redirect";
import { describe, expect, it } from "vitest";

describe("Supabase email redirect construction", () => {
  it("uses the active HTTPS application origin rather than a localhost default", () => {
    expect(getAuthRedirectUrl("/auth", "https://pathpilot.manus.space")).toBe("https://pathpilot.manus.space/auth");
    expect(getAuthRedirectUrl("auth", "https://pathpilot.manus.space")).toBe("https://pathpilot.manus.space/auth");
  });

  it("permits HTTP only for local development and rejects insecure remote origins", () => {
    expect(getAuthRedirectUrl("/auth", "http://localhost:3000")).toBe("http://localhost:3000/auth");
    expect(() => getAuthRedirectUrl("/auth", "http://pathpilot.example")).toThrow("HTTPS");
  });
});
