import { apiRequest } from "@/lib/api/http";
import type { RoadmapGenerationRequest } from "@/lib/contracts/roadmap";
import type { Roadmap } from "@/types/domain";
export const generateRoadmap = (input: RoadmapGenerationRequest) => apiRequest<Roadmap>("roadmaps/generate", { method: "POST", body: input });
