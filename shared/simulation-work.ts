import { z } from "zod";

export type WorkField = { id: string; label: string; options?: string[]; expected: string; explanation: string };
export type WorkTask = {
  title: string;
  instruction: string;
  kind: "classify" | "sequence" | "calculate" | "allocate";
  evidence: { id: string; title: string; content: string }[];
  fields: WorkField[];
  budget?: number;
  unit?: string;
  learning: string;
};
export type PublicWorkTask = WorkTask & { stage: number; totalStages: number; previousOutcome?: string };
export const workSubmissionSchema = z.object({
  nodeId: z.string().min(1).max(100),
  inspected: z.array(z.string().max(40)).min(1).max(6),
  values: z.record(z.string().max(40), z.string().max(120)).refine(value => Object.keys(value).length <= 12),
  trials: z.array(z.record(z.string().max(40), z.string().max(120)).refine(value => Object.keys(value).length <= 12)).max(4),
}).strict();
export type WorkSubmission = z.infer<typeof workSubmissionSchema>;
export type WorkReceipt = {
  title: string; inspected: string[]; artifact: { label: string; value: string }[];
  checks: { label: string; passed: boolean; explanation: string }[];
  tests: number; revised: boolean; learning: string;
};

/** Same deterministic workbench checks in the browser and server. No executable user code. */
export function checkWork(task: WorkTask, values: Record<string, string>) {
  const ids = task.fields.map(field => field.id);
  if (Object.keys(values).length !== ids.length || Object.keys(values).some(id => !ids.includes(id))) throw new Error("Work incomplete: fill every artifact field.");
  for (const field of task.fields) {
    const value = values[field.id];
    if (field.options ? !field.options.includes(value) : !/^\d+(\.\d{1,2})?$/.test(value)) throw new Error("Work incomplete: use the available values.");
    if (!field.options && (!Number.isFinite(Number(value)) || Number(value) > 1_000_000)) throw new Error("Work incomplete: enter a reasonable non-negative number.");
  }
  if (task.kind === "sequence" && new Set(Object.values(values)).size !== ids.length) throw new Error("Work incomplete: use each position once.");
  if (task.kind === "allocate" && Object.values(values).reduce((sum, value) => sum + Number(value), 0) > task.budget!) throw new Error(`Work incomplete: stay within ${task.budget} ${task.unit}.`);
  return task.fields.map(field => ({ label: field.label, passed: field.options ? values[field.id] === field.expected : Number(values[field.id]) === Number(field.expected), explanation: field.explanation }));
}

export function reviewWork(task: WorkTask, submission: WorkSubmission): WorkReceipt {
  const inspected = Array.from(new Set(submission.inspected));
  if (!inspected.length || inspected.some(id => !task.evidence.some(item => item.id === id))) throw new Error("Work incomplete: inspect an assignment resource first.");
  const checks = checkWork(task, submission.values);
  submission.trials.forEach(values => checkWork(task, values));
  return {
    title: task.title, inspected: inspected.map(id => task.evidence.find(item => item.id === id)!.title),
    artifact: task.fields.map(field => ({ label: field.label, value: submission.values[field.id] })), checks,
    tests: submission.trials.length,
    revised: submission.trials.some(values => task.fields.some(field => values[field.id] !== submission.values[field.id])),
    learning: task.learning,
  };
}
