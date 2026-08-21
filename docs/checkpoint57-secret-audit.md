# PathPilot Secret-Exposure Audit — Checkpoint 57

## Scope and method

This audit examined the Git-tracked repository, every reachable Git revision, generated browser assets, client source, ignored-file rules, and the available GitHub repository-alert endpoint. All value comparisons were performed non-disclosively: the audit reports only a pass/fail status, identifier count, or file path, never a credential value.

## Verified findings

| Control | Result | Evidence |
|---|---|---|
| Tracked secret-bearing filenames | **Pass** | No tracked `.env`, private-key, certificate, or Git configuration file was found. |
| Ignore rules | **Pass** | Root `.gitignore` covers `.env` and common local environment variants. |
| Active privileged values in history or browser build | **Pass** | The available service-role, Forge, JWT, database, OpenAI, and AWS credential values were compared against every reachable revision and `dist/public`; none matched. Missing optional environment variables were not treated as evidence. |
| Common token/private-key patterns in history | **Pass** | No reachable Git revision matched the inspected private-key, GitHub-token, OpenAI-token, AWS-key, Google-key, or Supabase-secret-key patterns. |
| Privileged identifiers in generated browser assets | **Pass** | No generated browser file contains service-role, server Forge, JWT, database, AWS, OpenAI, or Anthropic privileged identifiers. |
| Browser-source boundary | **Pass** | Expanded automated coverage scans every `.ts` and `.tsx` module under `client/src` for prohibited server credential identifiers. It preserves the required public Supabase configuration boundary. |
| Local Git remote | **Hardened** | The local `user_github` remote now uses a credential-free canonical repository URL; local and remote `main` remain identical. |

## GitHub secret-scanning limitation

The GitHub REST secret-scanning alerts endpoint returned **403 Resource not accessible by integration**, so this audit cannot claim an alert count from GitHub’s managed secret-scanning product. The repository/history and generated-artifact checks above do not depend on that endpoint and passed. A repository owner may review or enable the setting under GitHub repository **Settings → Security → Code security and analysis** if that capability is available.

## Remediation

No tracked, historical, or generated-client credential exposure was verified; therefore no credential rotation or source-history rewrite is justified. The audit adds a regression test that fails if any browser module references a privileged service-role, database, server Forge, JWT, AWS, OpenAI, or Anthropic credential identifier. No public Supabase URL or anon/publishable key was removed because those are intentionally browser-available and protected by Supabase RLS.
