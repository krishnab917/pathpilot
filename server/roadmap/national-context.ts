export type SupportedCountryCode = "US" | "IN" | "GB";
export type NationalEducationContext = {
  code: SupportedCountryCode | "ZZ";
  label: string;
  educationSystem: string;
  planningSignals: string[];
  sourceNote: string;
};

const contexts: Record<SupportedCountryCode, NationalEducationContext> = {
  US: {
    code: "US",
    label: "United States",
    educationSystem: "US high school and institution-specific admissions context",
    planningSignals: ["Connect challenging coursework where available with portfolio evidence.", "Compare programme requirements directly with each institution before making admissions decisions."],
    sourceNote: "General planning context only; individual institutions set requirements.",
  },
  IN: {
    code: "IN",
    label: "India",
    educationSystem: "Indian school-board and higher-education pathway context",
    planningSignals: ["Align foundational preparation with your board, subjects, and intended pathway.", "For engineering pathways, verify any applicable entrance process directly through its official source."],
    sourceNote: "General planning context only; examination and institution requirements vary by pathway.",
  },
  GB: {
    code: "GB",
    label: "United Kingdom",
    educationSystem: "UK qualification and course-specific entry context",
    planningSignals: ["Plan subject development against the entry requirements of courses you are considering.", "Check course and qualification requirements directly with the provider or UCAS before deciding."],
    sourceNote: "General planning context only; providers set their own entry requirements.",
  },
};

const generalContext: NationalEducationContext = {
  code: "ZZ",
  label: "your selected country",
  educationSystem: "general education planning context",
  planningSignals: ["Build transferable evidence through coursework, projects, reflection, and local guidance.", "Verify qualification and application requirements with official local providers before acting."],
  sourceNote: "A detailed national context is not yet available for this country.",
};

export const countryOptions = Object.values(contexts).map(context => ({ code: context.code, label: context.label, educationSystem: context.educationSystem }));

export function getNationalEducationContext(countryCode: string | null | undefined): NationalEducationContext {
  const code = countryCode?.trim().toUpperCase() as SupportedCountryCode | undefined;
  return code && contexts[code] ? contexts[code] : generalContext;
}
