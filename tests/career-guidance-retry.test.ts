import { describe, expect, it } from "vitest";
import { retryValidatedGuidance } from "../server/career-guidance";

describe("career guidance retry", () => {
  it("retries a transient invalid response before returning validated guidance", async () => {
    let calls = 0;
    const result = await retryValidatedGuidance(
      async () => { calls += 1; return calls === 1 ? "invalid" : "validated"; },
      value => {
        if (value !== "validated") throw new Error("invalid model response");
        return value;
      },
    );
    expect(result).toBe("validated");
    expect(calls).toBe(2);
  });

  it("does not return unvalidated guidance after retries are exhausted", async () => {
    await expect(retryValidatedGuidance(async () => "invalid", () => { throw new Error("invalid model response"); })).rejects.toThrow("invalid model response");
  });
});
