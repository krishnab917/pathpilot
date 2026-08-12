import { apiRequest } from "@/lib/api/http";
import type { SimulationEvaluationRequest } from "@/lib/contracts/simulation";
import type { SimulationResult } from "@/types/domain";
export const evaluateSimulation = (input: SimulationEvaluationRequest) => apiRequest<SimulationResult>("simulations/evaluate", { method: "POST", body: input });
