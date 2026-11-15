import { z } from "zod";

const text = z.string().trim().min(1).max(4000);
// Historical catalog values need not satisfy today's generation minimum sizes.
// Read them without truncation; keep tighter validation on every new write.
export const storedCareerDetailsSchema = z.object({
  description: z.string(), salaryRange: z.string(), educationRequirements: z.string(),
  requiredSkills: z.array(z.string()), dailyResponsibilities: z.array(z.string()), relatedCareers: z.array(z.string()),
});
export const privateCareerDetailsSchema = z.object({
  description: text,
  salaryRange: text,
  educationRequirements: text,
  requiredSkills: z.array(text).min(3).max(8),
  dailyResponsibilities: z.array(text).min(2).max(6),
  relatedCareers: z.array(text).min(2).max(6),
});
export function privateCareerDetails(value: unknown) {
  const details = privateCareerDetailsSchema.parse(value);
  if (Buffer.byteLength(JSON.stringify(details)) > 65536) throw new Error("Career details exceed the private storage limit.");
  return details;
}
