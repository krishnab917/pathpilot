export type RecommendationStatus = "pending" | "accepted" | "skipped" | "dismissed";

export function isVisibleInRecommendationQueue(status: RecommendationStatus) {
  return status !== "dismissed" && status !== "skipped";
}
