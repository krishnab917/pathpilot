import { careerTaxonomy, resolveDiscoveryCareer } from "../shared/career-taxonomy";
import { resolveSupportedCareer } from "./simulation/catalog";

export { careerTaxonomy };
/** Authored reference data only. Retain the existing 25 descriptions for compatibility. */
export function resolveDiscoveryReference(input: string | null | undefined) {
  if (typeof input !== "string") return null;
  const original = resolveSupportedCareer(input);
  if (original) return original;
  const career = resolveDiscoveryCareer(input);
  return career ? { id: career.id, name: career.name, description: career.responsibilities.join(". ") + "." } : null;
}
