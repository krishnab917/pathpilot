# PathPilot fonts

Self-hosted unmodified Latin WOFF2 subsets from Google Fonts, downloaded October 18, 2026. Both families use SIL Open Font License 1.1; original license notices are included alongside the binaries.

- DM Sans: weights 400–700, optical size 14. Used for body text, controls, records, and metadata. Source: https://github.com/google/fonts/tree/main/ofl/dmsans
- Source Serif 4: weights 400–600, optical size 48. Used for display and page titles. Source: https://github.com/google/fonts/tree/main/ofl/sourceserif4

Google Fonts request: `https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@14,400..700&family=Source+Serif+4:opsz,wght@48,400..600&display=swap`

The fixed optical sizes keep the combined transfer smaller than full optical-size variable files. Font CSS uses `font-display: swap`; unsupported glyphs use the system fallback. No font service request is required at runtime. Do not remove the license notices when redistributing these files.
