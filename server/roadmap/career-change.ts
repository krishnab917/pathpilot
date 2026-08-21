export function normalizeRoadmapCareer(value: string) {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

export function requiresRoadmapCareerChangeConfirmation(activeCareer: string | undefined, requestedCareer: string) {
  return Boolean(activeCareer && normalizeRoadmapCareer(activeCareer) !== normalizeRoadmapCareer(requestedCareer));
}
