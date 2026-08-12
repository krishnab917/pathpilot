"use client";
import { analyzeCareers } from "@/lib/api/careers";
import { useAsyncAction } from "@/hooks/use-async-action";
export const useCareerAnalysis = () => useAsyncAction(analyzeCareers);
