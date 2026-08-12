import { apiRequest } from "@/lib/api/http";
import type { CareerAnalysisResponse } from "@/lib/contracts/career";
export const analyzeCareers = () => apiRequest<CareerAnalysisResponse>("careers/analyze", { method: "POST" });
