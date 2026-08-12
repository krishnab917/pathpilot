import { z } from "zod";
export const careerMatchSchema = z.object({ id: z.string().uuid(), rank: z.number().int().min(1).max(5), matchScore: z.number().int().min(0).max(100), careerName: z.string().min(2), reasoning: z.string().min(1), strengths: z.array(z.string()), missingSkills: z.array(z.string()), realityCheck: z.string(), nextSteps: z.array(z.string()) });
export const careerAnalysisResponseSchema = z.object({ matches: z.array(careerMatchSchema).length(5) });
export type CareerAnalysisResponse = z.infer<typeof careerAnalysisResponseSchema>;
