import { describe, expect, it } from "vitest";
import { onboardingDraft, profile } from "../server/db";

describe("onboarding query normalizers", () => {
  it("returns null for a missing student profile instead of undefined", () => {
    expect(profile(null)).toBeNull();
    expect(profile(undefined)).toBeNull();
  });

  it("returns null for a missing onboarding draft instead of undefined", () => {
    expect(onboardingDraft(null)).toBeNull();
    expect(onboardingDraft(undefined)).toBeNull();
  });

  it("preserves populated draft payloads", () => {
    expect(onboardingDraft({ current_step: 2, payload: { grade: "11" } })).toEqual({ currentStep: 2, payload: { grade: "11" } });
  });
});
