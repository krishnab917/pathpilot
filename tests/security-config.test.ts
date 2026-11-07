import { randomBytes } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { protectionSecret, SecurityConfigurationError } from "../server/security-config";
import { protectionHash } from "../server/rate-limit";
import { createContext } from "../server/_core/context";
import { createPlanningReportShareToken, hashPlanningReportShareToken, isPlanningReportShareToken } from "../server/report-share";

const auth = vi.hoisted(() => ({ getUser: vi.fn() }));
vi.mock("../server/supabase", async original => ({ ...await original<typeof import("../server/supabase")>(), createRequestSupabase: () => ({ auth }) }));
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
describe("private protection configuration without session changes", () => {
  it.each([undefined, "", "short", "a".repeat(64), "change-me-".repeat(8)])("rejects missing/invalid production secret %#", value => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("JWT_SECRET", value);
    expect(() => protectionSecret()).toThrow(SecurityConfigurationError);
  });
  it("requires the same configuration on preview even with test flags", () => {
    vi.stubEnv("NODE_ENV", "test"); vi.stubEnv("VERCEL_ENV", "preview"); vi.stubEnv("JWT_SECRET", "");
    expect(() => protectionSecret()).toThrow(SecurityConfigurationError);
  });
  it("uses stable process-random local identity only in explicit local development/test", () => {
    vi.stubEnv("NODE_ENV", "development"); vi.stubEnv("VERCEL", ""); vi.stubEnv("VERCEL_ENV", ""); vi.stubEnv("JWT_SECRET", "");
    expect(protectionSecret()).toHaveLength(64); expect(protectionHash("test identity")).toBe(protectionHash("test identity"));
  });
  it("preserves configured bytes and refuses unknown runtime configuration", () => {
    const secret = randomBytes(32).toString("hex"); vi.stubEnv("JWT_SECRET", secret);
    expect(protectionSecret()).toBe(secret);
    vi.stubEnv("JWT_SECRET", ""); vi.stubEnv("NODE_ENV", ""); expect(() => protectionSecret()).toThrow();
  });
  it("keeps Supabase verification authoritative with a missing protection key", async () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("JWT_SECRET", "");
    auth.getUser.mockResolvedValueOnce({ data: { user: { id: "example-owner", app_metadata: {}, user_metadata: {} } }, error: null });
    const options = { req: { headers: { authorization: "Bearer fictional-session" } }, res: {} } as any;
    expect((await createContext(options)).user?.id).toBe("example-owner");
    expect(auth.getUser).toHaveBeenCalledWith("fictional-session");
    auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: { message: "invalid" } });
    expect((await createContext(options)).user).toBeNull();
  });
  it("does not alter opaque report token generation/verification", () => {
    const token = createPlanningReportShareToken();
    expect(isPlanningReportShareToken(token)).toBe(true);
    expect(hashPlanningReportShareToken(token)).toBe(hashPlanningReportShareToken(token));
    expect(isPlanningReportShareToken("forged")).toBe(false);
  });
});
