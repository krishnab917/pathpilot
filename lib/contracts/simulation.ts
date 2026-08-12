import { z } from "zod";
const choiceSchema = z.object({ id: z.string(), label: z.string(), technicalImpact: z.number().int().min(0).max(100), leadershipImpact: z.number().int().min(0).max(100), compatibilityImpact: z.number().int().min(0).max(100) });
export const simulationScenarioSchema = z.object({ id: z.string(), title: z.string(), prompt: z.string(), choices: z.array(choiceSchema).length(3) });
export const simulationEvaluationRequestSchema = z.object({ career: z.string().min(2), selections: z.array(z.object({ scenarioId: z.string(), choiceId: z.string() })).length(3), scenarios: z.array(simulationScenarioSchema).length(3) });
export type SimulationEvaluationRequest = z.infer<typeof simulationEvaluationRequestSchema>;
