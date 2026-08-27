import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import { afterEach, describe, expect, it, vi } from "vitest";
import { aiRateLimiter, RateLimitExceededError, RateLimiterUnavailableError } from "../server/rate-limit";
import { runLimitedAiRequest } from "../server/routers/pathpilot";

describe("protected AI limiter adapter", () => {
  afterEach(() => vi.restoreAllMocks());

  it("uses the verified context user, returns an HTTP 429 with Retry-After, and never starts the expensive operation when over quota", async () => {
    const rateLimiterRun = vi.spyOn(aiRateLimiter, "run").mockRejectedValue(new RateLimitExceededError(12.2));
    const setHeader = vi.fn();
    const operation = vi.fn(async () => "model response");

    let receivedError: unknown;
    try {
      await runLimitedAiRequest({ user: { id: "verified-account-a" }, res: { setHeader } }, "mentor", "request-fingerprint", operation);
    } catch (error) {
      receivedError = error;
    }

    expect(rateLimiterRun).toHaveBeenCalledWith({ userId: "verified-account-a", action: "mentor", fingerprint: "request-fingerprint" }, operation);
    expect(setHeader).toHaveBeenCalledWith("Retry-After", "13");
    expect(operation).not.toHaveBeenCalled();
    expect(getHTTPStatusCodeFromError(receivedError as any)).toBe(429);
    expect(receivedError).toMatchObject({ code: "TOO_MANY_REQUESTS" });
  });

  it("fails closed with a safe unavailable response before an expensive operation when the shared limiter is unavailable", async () => {
    vi.spyOn(aiRateLimiter, "run").mockRejectedValue(new RateLimiterUnavailableError());
    const operation = vi.fn(async () => "model response");

    await expect(runLimitedAiRequest({ user: { id: "verified-account-a" }, res: {} }, "roadmap_generation", "request-fingerprint", operation))
      .rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE", message: "AI request protection is temporarily unavailable. Please try again shortly." });
    expect(operation).not.toHaveBeenCalled();
  });
});
