import { buildBehavioralProfile } from "./behavioral";
import { calculateCareerCompatibility } from "./compatibility";
import type { AdaptiveResults, BehavioralEvidence, DecisionRecord, PublicScenario, SimulationGraph, SimulationState } from "./contracts";
import { softwareV1Graph } from "./graphs/software-v1";

const clamp = (value: number) => Math.max(0, Math.min(10, value));
export const getSimulationGraph = (_career: string): SimulationGraph => softwareV1Graph;
export const initialSimulationState = (graph: SimulationGraph): SimulationState => ({ currentNodeId: graph.startNodeId, previousNodeIds: [], decisionCount: 0, timePressure: 1, projectHealth: 5, teamTrust: 3, riskExposure: 1, discoveredInformation: [], unresolvedEvents: [] });
export function getPublicScenario(graph: SimulationGraph, state: SimulationState): PublicScenario {
  const node = graph.nodes[state.currentNodeId];
  if (!node || node.terminal) throw new Error("The simulation has no active scenario.");
  return { id: node.id, title: node.title, situation: node.situation, decisionNumber: state.decisionCount + 1, expectedDecisionRange: "about 8–10 decisions", decisions: node.decisions.map(decision => ({ id: decision.id, label: decision.label })) };
}
function applyPatch(state: SimulationState, patch: Record<string, unknown> | undefined) {
  if (!patch) return state;
  const next = { ...state, discoveredInformation: [...state.discoveredInformation], unresolvedEvents: [...state.unresolvedEvents] };
  for (const key of ["timePressure", "projectHealth", "teamTrust", "riskExposure"] as const) if (typeof patch[key] === "number") next[key] = clamp(next[key] + patch[key] as number);
  for (const key of ["discoveredInformation", "unresolvedEvents"] as const) if (Array.isArray(patch[key])) next[key] = Array.from(new Set([...next[key], ...patch[key].filter((value): value is string => typeof value === "string")]));
  return next;
}
export function chooseSimulationDecision(graph: SimulationGraph, state: SimulationState, decisionId: string, existingEvidence: BehavioralEvidence[], existingHistory: DecisionRecord[]) {
  const node = graph.nodes[state.currentNodeId];
  if (!node || node.terminal) throw new Error("The simulation is not waiting for a decision.");
  const decision = node.decisions.find(item => item.id === decisionId);
  if (!decision) throw new Error("That decision is not available for the current scenario.");
  const patched = applyPatch(state, decision.statePatch);
  const nextNodeId = typeof decision.next === "function" ? decision.next(patched) : decision.next;
  const nextNode = graph.nodes[nextNodeId];
  if (!nextNode) throw new Error("The simulation graph contains an invalid transition.");
  const nextState: SimulationState = { ...patched, currentNodeId: nextNodeId, previousNodeIds: [...state.previousNodeIds, node.id], decisionCount: state.decisionCount + 1 };
  const record: DecisionRecord = { nodeId: node.id, decisionId: decision.id, contexts: node.contexts, difficulty: node.difficulty, selectedAt: new Date().toISOString() };
  const evidence = [...existingEvidence, ...decision.signals.map(signal => ({ ...signal, nodeId: node.id, decisionId: decision.id, difficulty: node.difficulty }))];
  const history = [...existingHistory, record];
  return { state: nextState, evidence, history, completed: Boolean(nextNode.terminal) };
}
export function buildAdaptiveResults(evidence: BehavioralEvidence[], careers: Array<{ name: string; matchScore: number }>): AdaptiveResults {
  const behavioralProfile = buildBehavioralProfile(evidence);
  const compatibility = calculateCareerCompatibility(careers, behavioralProfile);
  const strongest = behavioralProfile.strongestTraits.map(item => item.replaceAll("_", " "));
  const summary = strongest.length ? `Based on your decisions in this simulation, PathPilot observed consistent evidence of ${strongest.join(", ")}. This is a learning signal, not a prediction of career success.` : "PathPilot gathered an initial set of decision observations. Additional simulations will make the patterns more informative.";
  const recommendedNextSteps = Array.from(new Set([...(compatibility[0]?.growthTraits.map(item => `Practice ${item.replaceAll("_", " ")} in a small project or team activity.`) ?? []), "Reflect on one decision where you balanced speed, uncertainty, and impact."])).slice(0, 3);
  return { behavioralProfile, compatibility, summary, recommendedNextSteps };
}
