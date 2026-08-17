import type { SimulationState } from "./contracts";

/**
 * A UI-only cue: this never reaches evidence, results, compatibility, or recommendations.
 * It is intentionally not a deadline, countdown, or decision gate.
 */
export const hasTimePressurePresentation = (state: SimulationState) => state.timePressure >= 2;
