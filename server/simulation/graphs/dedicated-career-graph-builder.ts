import type { ConsequenceDefinition, ContextTag, SimulationGraph, StatePatch, TraitKey } from "../contracts";

type CareerStageContext = ContextTag | TraitKey | "leadership";

type CareerStage = {
  id: string;
  title: string;
  situation: string;
  contexts: CareerStageContext[];
  difficulty: 1 | 2 | 3;
  choices: [string, string, string];
  next: [string, string, string];
  messages: [string, string, string];
};

export type DedicatedCareerGraphSpec = {
  id: string;
  title: string;
  prefix: string;
  traits: [TraitKey, TraitKey, TraitKey, TraitKey, TraitKey, TraitKey];
  stages: CareerStage[];
};

const terminal = (id: string, title: string, outcome: "practice_next_step" | "evidence_review" | "feedback_conversation") => ({
  id,
  title,
  situation: "This scenario closes with a learning-focused next step. It is a scenario outcome, not an assessment of you.",
  contexts: ["planning"] as ContextTag[],
  difficulty: 1 as const,
  decisions: [],
  terminal: true,
  terminalOutcome: outcome,
});

const patches: StatePatch[] = [
  { projectHealth: 1, discoveredInformation: ["verified-context"] },
  { teamTrust: 1, timePressure: 1 },
  { riskExposure: 1, unresolvedEvents: ["unreviewed-risk"] },
];

const normalizeContext = (context: CareerStageContext): ContextTag => {
  if (["technical", "uncertainty", "time_pressure", "interpersonal", "ethical", "resource_constraint", "failure", "planning", "execution"].includes(context)) return context as ContextTag;
  if (["communication", "collaboration"].includes(context)) return "interpersonal";
  if (["attention_to_detail", "analytical_thinking", "systems_thinking", "problem_solving"].includes(context)) return "technical";
  return "planning";
};

export function buildDedicatedCareerGraph(spec: DedicatedCareerGraphSpec): SimulationGraph {
  const traitFor = (stageIndex: number, choiceIndex: number) => spec.traits[(stageIndex + choiceIndex) % spec.traits.length];
  const nodes = Object.fromEntries(spec.stages.map((stage, stageIndex) => {
    const contexts = stage.contexts.map(normalizeContext);
    return [stage.id, {
    id: stage.id,
    title: stage.title,
    situation: stage.situation,
    contexts,
    difficulty: stage.difficulty,
    decisions: stage.choices.map((label, choiceIndex) => ({
      id: `${stage.id}-choice-${choiceIndex + 1}`,
      label,
      signals: [
        { trait: traitFor(stageIndex, choiceIndex), direction: 1 as const, weight: choiceIndex === 0 ? 2 as const : 1 as const, context: contexts[0]! },
        { trait: traitFor(stageIndex + 2, choiceIndex), direction: choiceIndex === 2 ? -1 as const : 1 as const, weight: 1 as const, context: contexts.at(1) ?? contexts[0]! },
      ],
      statePatch: patches[choiceIndex],
      consequences: [{ id: `${stage.id}-consequence-${choiceIndex + 1}`, message: stage.messages[choiceIndex], kind: choiceIndex === 2 ? "caution" as const : choiceIndex === 1 ? "team" as const : "progress" as const } satisfies ConsequenceDefinition],
      next: stage.next[choiceIndex],
    })),
    }];
  }));

  return {
    id: spec.id,
    title: spec.title,
    startNodeId: spec.stages[0]!.id,
    nodes: {
      ...nodes,
      [`${spec.prefix}-debrief-practice`]: terminal(`${spec.prefix}-debrief-practice`, "Practice-oriented close", "practice_next_step"),
      [`${spec.prefix}-debrief-evidence`]: terminal(`${spec.prefix}-debrief-evidence`, "Evidence-review close", "evidence_review"),
      [`${spec.prefix}-debrief-feedback`]: terminal(`${spec.prefix}-debrief-feedback`, "Feedback-oriented close", "feedback_conversation"),
    },
  };
}
