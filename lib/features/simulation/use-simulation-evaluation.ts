"use client";
import { evaluateSimulation } from "@/lib/simulation/client";
import { useAsyncAction } from "@/hooks/use-async-action";
export const useSimulationEvaluation = () => useAsyncAction(evaluateSimulation);
