import { describe, expect, it } from "vitest";
import { CareerGuidanceTimeoutError, CareerGuidanceValidationError, retryValidatedGuidance, withCareerGuidanceTimeout } from "../server/career-guidance";

describe("career guidance retry", () => {
  it("retries a transient invalid response before returning validated guidance", async () => {
    let calls = 0;
    const result = await retryValidatedGuidance(
      async () => { calls += 1; return calls === 1 ? "invalid" : "validated"; },
      value => {
        if (value !== "validated") throw new CareerGuidanceValidationError("invalid model response");
        return value;
      },
    );
    expect(result).toBe("validated");
    expect(calls).toBe(2);
  });

  it("does not return unvalidated guidance after retries are exhausted", async () => {
    await expect(retryValidatedGuidance(async () => "invalid", () => { throw new CareerGuidanceValidationError("invalid model response"); })).rejects.toThrow("invalid model response");
  });

  it("does not retry an upstream provider failure", async () => {
    let calls = 0;
    await expect(
      retryValidatedGuidance(
        async () => {
          calls += 1;
          throw new Error("provider unavailable");
        },
        value => value,
      ),
    ).rejects.toThrow("provider unavailable");
    expect(calls).toBe(1);
  });

  it("does not retry a bounded timeout", async () => {
    let calls = 0;
    await expect(
      retryValidatedGuidance(
        async () => {
          calls += 1;
          throw new CareerGuidanceTimeoutError();
        },
        value => value,
      ),
    ).rejects.toBeInstanceOf(CareerGuidanceTimeoutError);
    expect(calls).toBe(1);
  });

  it("rejects a stalled guidance operation within its bounded timeout", async () => {
    const pending = new Promise<never>(() => undefined);
    await expect(withCareerGuidanceTimeout(pending, 5)).rejects.toBeInstanceOf(CareerGuidanceTimeoutError);
  });
});
