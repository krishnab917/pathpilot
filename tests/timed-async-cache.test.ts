import { describe, expect, it } from "vitest";
import { createTimedAsyncCache } from "../server/ai/timed-async-cache";

describe("timed async cache", () => {
  it("shares one request and reuses a value only within its TTL", async () => {
    let now = 1_000;
    let calls = 0;
    const cache = createTimedAsyncCache(async () => ({ id: ++calls }), 5_000, () => now);

    const [first, concurrent] = await Promise.all([cache.get(), cache.get()]);
    expect(first.id).toBe(1);
    expect(concurrent.id).toBe(1);
    expect(calls).toBe(1);

    expect((await cache.get()).id).toBe(1);
    now += 5_001;
    expect((await cache.get()).id).toBe(2);
  });

  it("does not cache failed loads", async () => {
    let calls = 0;
    const cache = createTimedAsyncCache(async () => {
      calls += 1;
      if (calls === 1) throw new Error("temporary failure");
      return "recovered";
    }, 5_000);

    await expect(cache.get()).rejects.toThrow("temporary failure");
    await expect(cache.get()).resolves.toBe("recovered");
  });
});
