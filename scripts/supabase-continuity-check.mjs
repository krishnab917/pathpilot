import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const expectedTables = [
  "ai_conversations",
  "ai_messages",
  "ai_result_cache",
  "background_worker_credentials",
  "behavioral_activity_events",
  "career_matches",
  "careers",
  "derived_analysis_jobs",
  "goals",
  "onboarding_drafts",
  "opportunities",
  "opportunity_sources",
  "pathpilot_rate_limit_leases",
  "pathpilot_rate_limit_windows",
  "planning_report_share_links",
  "portfolio_profiles",
  "portfolio_projects",
  "project_goals",
  "project_milestones",
  "projects",
  "roadmap_milestones",
  "roadmap_recommendations",
  "roadmaps",
  "simulations",
  "student_opportunity_states",
  "student_profiles",
];

const expectedFunctions = [
  "acquire_pathpilot_rate_limit_lease",
  "consume_pathpilot_rate_limit",
  "list_discoverable_opportunities",
  "process_next_derived_analysis",
  "release_pathpilot_rate_limit_lease",
];

function configuredValue(...names) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return "";
}

function projectRefFromUrl(url) {
  try {
    return new URL(url).host.split(".")[0] || "unknown";
  } catch {
    return "invalid-url";
  }
}

async function checkAuth(url, anonKey) {
  if (!url || !anonKey)
    return {
      reachable: false,
      detail: "missing public Supabase URL or anon key",
    };
  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/settings`, {
      headers: { apikey: anonKey },
    });
    return { reachable: response.ok, detail: `HTTP ${response.status}` };
  } catch (error) {
    return {
      reachable: false,
      detail: error instanceof Error ? error.message : "request failed",
    };
  }
}

async function checkAdminUsers(url, serviceRoleKey) {
  if (!url || !serviceRoleKey)
    return {
      reachable: false,
      detected: "unverified",
      detail: "missing service-role key",
    };
  try {
    const response = await fetch(
      `${url.replace(/\/$/, "")}/auth/v1/admin/users?page=1&per_page=1`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      }
    );
    if (!response.ok)
      return {
        reachable: false,
        detected: "unverified",
        detail: `HTTP ${response.status}`,
      };
    const body = await response.json();
    return {
      reachable: true,
      detected:
        Array.isArray(body?.users) && body.users.length > 0 ? "yes" : "no",
      detail: "admin user list reachable",
    };
  } catch (error) {
    return {
      reachable: false,
      detected: "unverified",
      detail: error instanceof Error ? error.message : "request failed",
    };
  }
}

async function checkTables(url, serviceRoleKey) {
  if (!url || !serviceRoleKey) {
    return {
      matching: [],
      missing: [],
      recordsDetected: "unverified",
      detail: "missing service-role key; table reachability was not checked",
    };
  }

  const admin = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
  const matching = [];
  const missing = [];
  let recordsDetected = false;

  for (const table of expectedTables) {
    const { data, error } = await admin.from(table).select("*").limit(1);
    if (error) {
      missing.push(`${table} (${error.code ?? "error"})`);
      continue;
    }
    matching.push(table);
    if (Array.isArray(data) && data.length > 0) recordsDetected = true;
  }

  return {
    matching,
    missing,
    recordsDetected: recordsDetected ? "yes" : "no",
    detail: "checked with service-role REST reads; row values were not printed",
  };
}

const url = configuredValue(
  "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "VITE_SUPABASE_URL"
);
const anonKey = configuredValue(
  "SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "VITE_SUPABASE_ANON_KEY"
);
const serviceRoleKey = configuredValue("SUPABASE_SERVICE_ROLE_KEY");
const auth = await checkAuth(url, anonKey);
const users = await checkAdminUsers(url, serviceRoleKey);
const tables = await checkTables(url, serviceRoleKey);

console.log("DATABASE CONNECTION");
console.log(
  `- Supabase project detected: ${url ? projectRefFromUrl(url) : "not configured"}`
);
console.log(
  `- Database reachable: ${tables.matching.length > 0 ? "YES" : "UNVERIFIED"}`
);
console.log(
  `- Auth reachable: ${auth.reachable ? "YES" : "NO"} (${auth.detail})`
);
console.log("");
console.log("SCHEMA STATUS");
console.log(
  `- Tables matching: ${tables.matching.length ? tables.matching.join(", ") : "unverified"}`
);
console.log(
  `- Tables missing: ${tables.detail.includes("not checked") ? "unverified" : tables.missing.length ? tables.missing.join(", ") : "none detected by REST table checks"}`
);
console.log(
  "- Columns missing: unverified by REST; run supabase/read-only-continuity-check.sql for column-level metadata"
);
console.log(
  "- Indexes missing: unverified by REST; run supabase/read-only-continuity-check.sql"
);
console.log(`- Functions expected: ${expectedFunctions.join(", ")}`);
console.log(
  "- Functions missing: unverified by REST; run supabase/read-only-continuity-check.sql"
);
console.log(
  "- Triggers missing: unverified by REST; run supabase/read-only-continuity-check.sql"
);
console.log(
  "- RLS policies missing: unverified by REST; run supabase/read-only-continuity-check.sql"
);
console.log("- Other discrepancies: none checked without SQL metadata access");
console.log("");
console.log("DATA SAFETY");
console.log(`- Existing users detected: ${users.detected} (${users.detail})`);
console.log(
  `- Existing application records detected: ${tables.recordsDetected}`
);
console.log("- Any destructive operation required: NO");
console.log("");
console.log("RECOMMENDATION");
if (!url || !anonKey || !serviceRoleKey) {
  console.log(
    "- Production access is not fully configured in this environment. Supply the existing project's env vars outside git, then rerun this read-only check."
  );
} else if (tables.missing.length > 0 || !auth.reachable || !users.reachable) {
  console.log(
    "- Manual reconciliation required before any migration. Do not run db:push or replay migrations against production."
  );
} else {
  console.log(
    "- No migration required based on REST table reachability. Confirm columns, indexes, functions, triggers, and RLS with the read-only SQL report before making schema changes."
  );
}
