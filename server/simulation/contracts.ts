export const traitKeys = ["analytical_thinking", "problem_solving", "systems_thinking", "attention_to_detail", "collaboration", "communication", "ownership", "adaptability", "ethical_reasoning", "long_term_thinking"] as const;
export type TraitKey = typeof traitKeys[number];
export type ContextTag = "technical" | "uncertainty" | "time_pressure" | "interpersonal" | "ethical" | "resource_constraint" | "failure" | "planning" | "execution";
export type ConfidenceLevel = "low" | "moderate" | "high";
export const terminalOutcomeCategories = ["practice_next_step", "evidence_review", "feedback_conversation"] as const;
export type TerminalOutcomeCategory = typeof terminalOutcomeCategories[number];

export type SimulationState = {
  currentNodeId: string;
  previousNodeIds: string[];
  decisionCount: number;
  timePressure: number;
  projectHealth: number;
  teamTrust: number;
  riskExposure: number;
  discoveredInformation: string[];
  unresolvedEvents: string[];
};

export type StatePatch = Partial<Omit<SimulationState, "currentNodeId" | "previousNodeIds" | "decisionCount">>;
export type TraitSignal = { trait: TraitKey; direction: -1 | 1; weight: 1 | 2 | 3; context: ContextTag };
export type ConsequenceDefinition = { id: string; message: string; kind: "learning" | "caution" | "team" | "progress" };
export type DecisionDefinition = {
  id: string;
  label: string;
  signals: TraitSignal[];
  statePatch?: StatePatch;
  consequences?: ConsequenceDefinition[];
  next: string | ((state: SimulationState) => string);
};
export type ScenarioNode = {
  id: string;
  title: string;
  situation: string;
  contexts: ContextTag[];
  difficulty: 1 | 2 | 3;
  decisions: DecisionDefinition[];
  terminal?: boolean;
  terminalOutcome?: TerminalOutcomeCategory;
};
export type SimulationGraph = { id: string; title: string; startNodeId: string; nodes: Record<string, ScenarioNode> };

export type DecisionRecord = { nodeId: string; decisionId: string; contexts: ContextTag[]; difficulty: number; selectedAt: string };
export type BehavioralEvidence = TraitSignal & { nodeId: string; decisionId: string; difficulty: number };
export type BehavioralEvent = { id: string; nodeId: string; decisionId: string; message: string; kind: ConsequenceDefinition["kind"]; contexts: ContextTag[]; occurredAt: string };
export type TraitResult = { trait: TraitKey; score: number; confidence: ConfidenceLevel; evidenceCount: number; contexts: ContextTag[] };
export type ContextObservation = { trait: TraitKey; context: ContextTag; score: number; confidence: ConfidenceLevel };
export type BehavioralProfile = { traits: TraitResult[]; patterns: string[]; contradictions: string[]; contextObservations: ContextObservation[]; strongestTraits: TraitKey[]; developmentTraits: TraitKey[] };
export type CompatibilityResult = { careerName: string; score: number; confidence: ConfidenceLevel; reason: string; alignedTraits: TraitKey[]; growthTraits: TraitKey[]; limitedMapping?: boolean };
export type AdaptiveResults = { behavioralProfile: BehavioralProfile; compatibility: CompatibilityResult[]; summary: string; recommendedNextSteps: string[] };

export type PublicScenario = { id: string; title: string; situation: string; decisionNumber: number; expectedDecisionRange: string; decisions: Array<{ id: string; label: string }> };
