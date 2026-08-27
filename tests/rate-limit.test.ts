import { describe, expect, it } from "vitest";
import { AI_RATE_LIMIT_POLICIES, createAiRateLimiter, RateLimitExceededError, RateLimiterUnavailableError, type RateLimitStore } from "../server/rate-limit";

function memoryStore(): RateLimitStore & { consumed: Array<{ keyHash: string; action: string }>; leases: Set<string> } {
  const counters = new Map<string, number>();
  const leases = new Set<string>();
  const consumed: Array<{ keyHash: string; action: string }> = [];
  return {
    consumed,
    leases,
    async consume(input) {
      const key = `${input.keyHash}:${input.action}`;
      const next = (counters.get(key) ?? 0) + 1;
      counters.set(key, next);
      consumed.push({ keyHash: input.keyHash, action: input.action });
      return { allowed: next <= input.maxRequests, retryAfterSeconds: 19 };
    },
    async acquireLease(input) {
      if (leases.has(input.leaseHash)) return { acquired: false, retryAfterSeconds: 7 };
      leases.add(input.leaseHash);
      return { acquired: true, retryAfterSeconds: 0 };
    },
    async releaseLease(input) { leases.delete(input.leaseHash); },
  };
}

describe("shared authenticated AI rate limits", () => {
  it("permits normal Mentor use, returns a retry duration at the burst boundary, and releases completed leases", async () => {
    const store = memoryStore();
    const limiter = createAiRateLimiter(store);
    const policy = AI_RATE_LIMIT_POLICIES.mentor.find(window => window.name === "burst")!;
    for (let attempt = 0; attempt < policy.maxRequests; attempt += 1) {
      await expect(limiter.run({ userId: "user-a", action: "mentor", fingerprint: `message-${attempt}` }, async () => "ok")).resolves.toBe("ok");
    }
    await expect(limiter.run({ userId: "user-a", action: "mentor", fingerprint: "one-more" }, async () => "never"))
      .rejects.toMatchObject({ name: "RateLimitExceededError", retryAfterSeconds: 19 });
    expect(store.leases.size).toBe(0);
  });

  it("keys quotas by verified user and action so one student cannot consume another student’s or another operation’s budget", async () => {
    const store = memoryStore();
    const limiter = createAiRateLimiter(store);
    await limiter.run({ userId: "user-a", action: "mentor", fingerprint: "same" }, async () => "a");
    await limiter.run({ userId: "user-b", action: "mentor", fingerprint: "same" }, async () => "b");
    await limiter.run({ userId: "user-a", action: "project_guidance", fingerprint: "same" }, async () => "project");
    const mentorKeys = new Set(store.consumed.filter(entry => entry.action.startsWith("mentor:")).map(entry => entry.keyHash));
    expect(mentorKeys.size).toBe(2);
    expect(store.consumed.some(entry => entry.action.startsWith("project_guidance:"))).toBe(true);
    expect([...mentorKeys].every(key => /^[a-f0-9]{64}$/.test(key))).toBe(true);
  });

  it("rejects a matching in-flight operation before it can invoke AI or consume a second budget", async () => {
    const store = memoryStore();
    const limiter = createAiRateLimiter(store);
    const pending = new Promise<void>(() => undefined);
    void limiter.run({ userId: "user-a", action: "profile_analysis", fingerprint: "profile-v1" }, async () => pending);
    await expect(limiter.run({ userId: "user-a", action: "profile_analysis", fingerprint: "profile-v1" }, async () => "never"))
      .rejects.toBeInstanceOf(RateLimitExceededError);
    expect(store.consumed).toHaveLength(2);
  });

  it("fails closed for AI work when the shared limiter cannot be used", async () => {
    const unavailable: RateLimitStore = {
      consume: async () => { throw new RateLimiterUnavailableError(); },
      acquireLease: async () => { throw new RateLimiterUnavailableError(); },
      releaseLease: async () => undefined,
    };
    const operation = async () => { throw new Error("AI must not run"); };
    await expect(createAiRateLimiter(unavailable).run({ userId: "user-a", action: "mentor", fingerprint: "x" }, operation))
      .rejects.toBeInstanceOf(RateLimiterUnavailableError);
  });
});
