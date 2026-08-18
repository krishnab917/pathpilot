import { buildBehavioralProfile } from "./behavioral";
import { calculateCareerCompatibility } from "./compatibility";
import type { AdaptiveResults, BehavioralEvent, BehavioralEvidence, DecisionRecord, PublicScenario, SimulationGraph, SimulationState } from "./contracts";
import { softwareV1Graph } from "./graphs/software-v1";
import { businessV1Graph, designV1Graph, healthV1Graph } from "./graphs/career-graphs";
import { communicationsV1Graph, educationV1Graph, engineeringV1Graph, environmentV1Graph, policyV1Graph, researchV1Graph } from "./graphs/expanded-career-graphs";
import { aerospaceEngineerAstronautV1Graph, doctorPhysicianV1Graph, entrepreneurStartupFounderV1Graph, lawyerV1Graph } from "./graphs/dedicated-set-a";
import { aiMachineLearningEngineerV1Graph, cybersecurityAnalystV1Graph, dataScientistV1Graph, mechanicalEngineerV1Graph, productManagerV1Graph } from "./graphs/dedicated-set-b";
import { architectV1Graph, environmentalScientistV1Graph, financialAnalystV1Graph, researchScientistV1Graph, uxProductDesignerV1Graph } from "./graphs/dedicated-set-c";

const clamp = (value: number) => Math.max(0, Math.min(10, value));
const dedicatedGraphsByCareerId: Record<string, SimulationGraph> = {
  "software-engineer": softwareV1Graph, "doctor-physician": doctorPhysicianV1Graph, lawyer: lawyerV1Graph, "entrepreneur-startup-founder": entrepreneurStartupFounderV1Graph, "aerospace-engineer-astronaut": aerospaceEngineerAstronautV1Graph,
  "ai-machine-learning-engineer": aiMachineLearningEngineerV1Graph, "product-manager": productManagerV1Graph, "cybersecurity-analyst": cybersecurityAnalystV1Graph, "data-scientist": dataScientistV1Graph, "mechanical-engineer": mechanicalEngineerV1Graph,
  architect: architectV1Graph, "ux-product-designer": uxProductDesignerV1Graph, "financial-analyst": financialAnalystV1Graph, "environmental-scientist": environmentalScientistV1Graph, "research-scientist": researchScientistV1Graph,
};
export const simulationGraphCatalog: SimulationGraph[] = [...Object.values(dedicatedGraphsByCareerId), healthV1Graph, designV1Graph, businessV1Graph, engineeringV1Graph, researchV1Graph, policyV1Graph, educationV1Graph, environmentV1Graph, communicationsV1Graph];
export const getSimulationGraphById = (graphId: string | null | undefined): SimulationGraph | null => simulationGraphCatalog.find(graph => graph.id === graphId) ?? null;
export const getSimulationGraph = (career: string): SimulationGraph => {
  if (dedicatedGraphsByCareerId[career]) return dedicatedGraphsByCareerId[career];
  const value = career.toLowerCase();
  if (/software|data|computer|web developer|cyber|machine learning|artificial intelligence|it specialist/.test(value)) return softwareV1Graph;
  if (/journal|report|communications|public relations|newsroom|broadcast|copywriter/.test(value)) return communicationsV1Graph;
  if (/teacher|educat|school counsel|learning design|instruction/.test(value)) return educationV1Graph;
  if (/environment|climate|conservation|ecolog|geolog|earth science|sustainab/.test(value)) return environmentV1Graph;
  if (/law|legal|policy|government|civic|urban plan|diplomat/.test(value)) return policyV1Graph;
  if (/research|scientist|chemist|physic|laboratory|lab tech/.test(value)) return researchV1Graph;
  if (/engineer|engineering|robotic|civil|mechanical|electrical|manufactur|construction/.test(value)) return engineeringV1Graph;
  if (/doctor|nurs|health|medical|therap|biolog|public health/.test(value)) return healthV1Graph;
  if (/design|artist|creative|ux|ui|media|writer/.test(value)) return designV1Graph;
  if (/business|market|finance|entrepreneur|manager|sales/.test(value)) return businessV1Graph;
  return softwareV1Graph;
};
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
export function chooseSimulationDecision(graph: SimulationGraph, state: SimulationState, decisionId: string, existingEvidence: BehavioralEvidence[], existingHistory: DecisionRecord[], existingEvents: BehavioralEvent[] = []) {
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
  const occurredAt = record.selectedAt;
  const events = [...existingEvents, ...(decision.consequences ?? [{ id: "decision-recorded", message: "Your decision changed the team’s next situation and added another learning signal.", kind: "learning" as const }]).map(item => ({ id: `${node.id}:${decision.id}:${item.id}:${existingEvents.length}`, nodeId: node.id, decisionId: decision.id, message: item.message, kind: item.kind, contexts: node.contexts, occurredAt }))];
  return { state: nextState, evidence, history, events, consequence: events.at(-1) ?? null, completed: Boolean(nextNode.terminal) };
}
export function buildAdaptiveResults(evidence: BehavioralEvidence[], discoveryMatches: Array<{ name: string; matchScore: number }> = []): AdaptiveResults {
  const behavioralProfile = buildBehavioralProfile(evidence);
  const compatibility = calculateCareerCompatibility(behavioralProfile, discoveryMatches);
  const strongest = behavioralProfile.strongestTraits.map(item => item.replaceAll("_", " "));
  const summary = strongest.length ? `Based on your decisions in this simulation, PathPilot observed consistent evidence of ${strongest.join(", ")}. This is a learning signal, not a prediction of career success.` : "PathPilot gathered an initial set of decision observations. Additional simulations will make the patterns more informative.";
  const recommendedNextSteps = Array.from(new Set([...(compatibility[0]?.growthTraits.map(item => `Practice ${item.replaceAll("_", " ")} in a small project or team activity.`) ?? []), "Reflect on one decision where you balanced speed, uncertainty, and impact."])).slice(0, 3);
  return { behavioralProfile, compatibility, summary, recommendedNextSteps };
}
