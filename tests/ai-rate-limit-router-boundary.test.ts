import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "server/routers/pathpilot.ts"), "utf8");

describe("AI rate-limit router boundary", () => {
  it("uses authenticated server context—not client input—to key every current generative AI action", () => {
    expect(source).toContain('aiRateLimiter.run({ userId: ctx.user.id, action, fingerprint }');
    expect(source).toContain('runLimitedAiRequest(ctx, "profile_analysis"');
    expect(source).toContain('runLimitedAiRequest(ctx, "roadmap_generation"');
    expect(source).toContain('runLimitedAiRequest(ctx, "mentor"');
    expect(source).toContain('runLimitedAiRequest(ctx, "project_guidance"');
    expect(source).not.toMatch(/input\.userId\s*(?:,|\})/);
  });

  it("returns tRPC 429 guidance and keeps rate-limit failures out of generic provider-error wrappers", () => {
    expect(source).toContain('code: "TOO_MANY_REQUESTS"');
    expect(source).toContain('"Retry-After"');
    expect(source).toContain('if (error instanceof TRPCError) throw error;');
  });

  it("checks validated project guidance and current profile analysis before it charges an AI generation budget", () => {
    expect(source.indexOf("getCachedProjectGuidance")).toBeLessThan(source.indexOf('runLimitedAiRequest(ctx, "project_guidance"'));
    expect(source.indexOf("existingMatches.length === 5")).toBeLessThan(source.indexOf('runLimitedAiRequest(ctx, "profile_analysis"'));
  });
});
