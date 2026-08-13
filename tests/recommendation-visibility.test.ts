import { describe, expect, it } from "vitest";
import { isVisibleInRecommendationQueue } from "../client/src/lib/recommendation-visibility";

describe("recommendation queue visibility", () => {
  it("hides dismissed and skipped history from the active student queue", () => {
    expect(isVisibleInRecommendationQueue("pending")).toBe(true);
    expect(isVisibleInRecommendationQueue("accepted")).toBe(true);
    expect(isVisibleInRecommendationQueue("skipped")).toBe(false);
    expect(isVisibleInRecommendationQueue("dismissed")).toBe(false);
  });
});
