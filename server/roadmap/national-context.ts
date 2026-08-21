export type CountryContextDetail = "verified-general" | "general" | "unknown";
export type NationalEducationContext = {
  code: string;
  label: string;
  region: string;
  educationSystem: string;
  planningSignals: string[];
  sourceNote: string;
  detailLevel: CountryContextDetail;
};

type CountryDefinition = Pick<NationalEducationContext, "code" | "label" | "region">;

const canonicalCountries: readonly CountryDefinition[] = [
  { code: "US", label: "United States", region: "North America" }, { code: "CA", label: "Canada", region: "North America" }, { code: "GB", label: "United Kingdom", region: "Europe" }, { code: "AU", label: "Australia", region: "Oceania" }, { code: "NZ", label: "New Zealand", region: "Oceania" },
  { code: "IN", label: "India", region: "South Asia" }, { code: "SG", label: "Singapore", region: "Southeast Asia" }, { code: "MY", label: "Malaysia", region: "Southeast Asia" }, { code: "ID", label: "Indonesia", region: "Southeast Asia" }, { code: "PH", label: "Philippines", region: "Southeast Asia" }, { code: "VN", label: "Vietnam", region: "Southeast Asia" }, { code: "TH", label: "Thailand", region: "Southeast Asia" },
  { code: "JP", label: "Japan", region: "East Asia" }, { code: "KR", label: "South Korea", region: "East Asia" }, { code: "CN", label: "China", region: "East Asia" }, { code: "TW", label: "Taiwan", region: "East Asia" }, { code: "HK", label: "Hong Kong", region: "East Asia" },
  { code: "AE", label: "United Arab Emirates", region: "Middle East" }, { code: "SA", label: "Saudi Arabia", region: "Middle East" }, { code: "QA", label: "Qatar", region: "Middle East" }, { code: "IL", label: "Israel", region: "Middle East" }, { code: "TR", label: "Turkey", region: "Middle East" },
  { code: "DE", label: "Germany", region: "Europe" }, { code: "FR", label: "France", region: "Europe" }, { code: "NL", label: "Netherlands", region: "Europe" }, { code: "BE", label: "Belgium", region: "Europe" }, { code: "CH", label: "Switzerland", region: "Europe" }, { code: "AT", label: "Austria", region: "Europe" }, { code: "SE", label: "Sweden", region: "Europe" }, { code: "NO", label: "Norway", region: "Europe" }, { code: "DK", label: "Denmark", region: "Europe" }, { code: "FI", label: "Finland", region: "Europe" }, { code: "IE", label: "Ireland", region: "Europe" }, { code: "ES", label: "Spain", region: "Europe" }, { code: "PT", label: "Portugal", region: "Europe" }, { code: "IT", label: "Italy", region: "Europe" }, { code: "PL", label: "Poland", region: "Europe" }, { code: "CZ", label: "Czech Republic", region: "Europe" }, { code: "GR", label: "Greece", region: "Europe" },
  { code: "BR", label: "Brazil", region: "Latin America" }, { code: "MX", label: "Mexico", region: "Latin America" }, { code: "AR", label: "Argentina", region: "Latin America" }, { code: "CL", label: "Chile", region: "Latin America" }, { code: "CO", label: "Colombia", region: "Latin America" },
  { code: "ZA", label: "South Africa", region: "Africa" }, { code: "NG", label: "Nigeria", region: "Africa" }, { code: "EG", label: "Egypt", region: "Africa" }, { code: "KE", label: "Kenya", region: "Africa" }, { code: "PK", label: "Pakistan", region: "South Asia" }, { code: "BD", label: "Bangladesh", region: "South Asia" },
] as const;

const detailedContexts: Record<string, Omit<NationalEducationContext, "region">> = {
  US: { code: "US", label: "United States", educationSystem: "US high school and institution-specific admissions context", planningSignals: ["Connect challenging coursework where available with portfolio evidence.", "Compare programme requirements directly with each institution before making admissions decisions."], sourceNote: "General planning context only; individual institutions set requirements.", detailLevel: "verified-general" },
  IN: { code: "IN", label: "India", educationSystem: "Indian school-board and higher-education pathway context", planningSignals: ["Align foundational preparation with your board, subjects, and intended pathway.", "For engineering pathways, verify any applicable entrance process directly through its official source."], sourceNote: "General planning context only; examination and institution requirements vary by pathway.", detailLevel: "verified-general" },
  GB: { code: "GB", label: "United Kingdom", educationSystem: "UK qualification and course-specific entry context", planningSignals: ["Plan subject development against the entry requirements of courses you are considering.", "Check course and qualification requirements directly with the provider or UCAS before deciding."], sourceNote: "General planning context only; providers set their own entry requirements.", detailLevel: "verified-general" },
};

const contextByCode = new Map(canonicalCountries.map(country => {
  const detailed = detailedContexts[country.code];
  const context: NationalEducationContext = detailed
    ? { ...detailed, region: country.region }
    : { ...country, educationSystem: `General education planning context for ${country.label}`, planningSignals: ["Build transferable evidence through coursework, projects, reflection, and local guidance.", "Verify qualification, application, and opportunity requirements with official local providers before acting."], sourceNote: `Detailed national pathway data is not currently verified for ${country.label}.`, detailLevel: "general" };
  return [country.code, context] as const;
}));

const unknownContext: NationalEducationContext = { code: "ZZ", label: "your selected country", region: "Unknown", educationSystem: "general education planning context", planningSignals: ["Build transferable evidence through coursework, projects, reflection, and local guidance.", "Verify qualification and application requirements with official local providers before acting."], sourceNote: "A detailed national context is not yet available for this country.", detailLevel: "unknown" };

export const countryOptions = canonicalCountries.map(country => {
  const context = contextByCode.get(country.code)!;
  return { code: context.code, label: context.label, region: context.region, educationSystem: context.educationSystem, detailLevel: context.detailLevel };
});

export function getNationalEducationContext(countryCode: string | null | undefined): NationalEducationContext {
  const code = countryCode?.trim().toUpperCase();
  return code ? contextByCode.get(code) ?? unknownContext : unknownContext;
}

export function isCanonicalPlanningCountry(countryCode: string | null | undefined) {
  const code = countryCode?.trim().toUpperCase();
  return Boolean(code && contextByCode.has(code));
}
