import { z } from "zod";
export const roadmapGenerationRequestSchema = z.object({ targetCareer: z.string().trim().min(2).max(180) });
export type RoadmapGenerationRequest = z.infer<typeof roadmapGenerationRequestSchema>;
