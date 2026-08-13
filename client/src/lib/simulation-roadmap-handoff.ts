const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function roadmapPathForSimulation(simulationId: string) {
  if (!UUID.test(simulationId)) throw new Error("A valid simulation identifier is required for the roadmap handoff.");
  return `/app/roadmap?simulation=${encodeURIComponent(simulationId)}`;
}

export function simulationIdFromRoadmapSearch(search: string) {
  const simulationId = new URLSearchParams(search).get("simulation");
  return simulationId && UUID.test(simulationId) ? simulationId : undefined;
}
