// Isolated PostgreSQL verification. No network or live Supabase connection.
// Temporary PGlite installation is a verification tool, not an app dependency.
import { readFileSync, existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";

if (!process.argv[2]) throw new Error("Supply an absolute path to a temporary @electric-sql/pglite/dist/index.js module.");
const moduleUrl = pathToFileURL(process.argv[2]);
const { PGlite } = await import(moduleUrl.href);
const { pgcrypto } = await import(new URL("contrib/pgcrypto.js", moduleUrl).href);
const db = new PGlite({ extensions: { pgcrypto } });
const applied = [];
let assertions = 0;
let failed = false;
const check = (value, message) => { assert.ok(value, message); assertions++; };
const sql = name => readFileSync(`supabase/migrations/${name}.sql`, "utf8");
async function rejected(statement) {
  let failed = false;
  try { await db.exec(statement); } catch { failed = true; }
  check(failed, "Expected database authorization/constraint rejection");
}

try {
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema extensions;
    create extension pgcrypto with schema extensions;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create function auth.role() returns text language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), current_user::text) $$;
    create function public.rls_auto_enable() returns event_trigger language plpgsql as $$ begin return; end $$;
    grant usage on schema public, auth to anon, authenticated, service_role;
    grant usage on schema extensions to service_role;
    grant execute on function auth.uid(), auth.role() to anon, authenticated, service_role;
  `);
  // Reconciled fixture order; historical filenames are not a replay contract.
  for (const name of [
    "20260813_pathpilot_core", "20260813_pathpilot_security_remediation", "20260813_onboarding_drafts",
    "20260813_project_development_metadata", "20260813_adaptive_simulation_engine",
    "20260813_v11_country_roadmap_recommendations", "20260815_roadmap_project_foundation",
    "20260816_verified_opportunities", "20260817_checkpoint14_behavioral_activity_events",
    "20260817_checkpoint24_planning_report_share_links", "20260817_checkpoint27_project_workspace",
    "20260817_checkpoint29_portfolio_publication", "20260817_checkpoint29_portfolio_profile_visibility",
    "20260818_checkpoint36_ai_result_cache", "20260818_checkpoint37_derived_analysis_jobs",
    "20260818_checkpoint37_worker_credential", "20260818_checkpoint37_worker_processor_rpc",
    "20260818_checkpoint37_worker_rpc_private", "20260827_checkpoint65_shared_ai_rate_limits",
    "20260901_prelaunch_hardening_rpc_safety",
  ]) { await db.exec(sql(name)); applied.push(name); }
  await db.exec("grant all on all tables in schema public to authenticated; grant select on all tables in schema public to anon; grant all on all tables in schema public to service_role;");
  await db.exec("set search_path = pg_catalog, pg_temp");
  const qualified = (await db.query("select auth.role() as role, current_user::text as session_role")).rows[0];
  check(qualified.role === qualified.session_role, "Qualified auth function resolves outside search_path");
  await db.exec("reset search_path");
  const a = "11111111-1111-4111-8111-111111111111", b = "22222222-2222-4222-8222-222222222222";
  await db.exec(`insert into auth.users values ('${a}'), ('${b}');
    insert into public.derived_analysis_jobs (user_id,analysis_type,attempt_count,requested_at) values ('${b}','simulation_evolution',3,'-infinity');`);
  await db.exec(sql("20261026_security_abuse_budgets"));
  const ownerFile = "supabase/migrations/20261026_security_ownership.sql";
  if (existsSync(ownerFile)) await db.exec(readFileSync(ownerFile, "utf8"));
  const legacyCareer = "99999999-9999-4999-8999-999999999999";
  await db.query("insert into public.careers (id,slug,name,description) values ($1,'legacy-fictional','Legacy fictional','Historical display to preserve')", [legacyCareer]);
  await db.query("insert into public.career_matches (user_id,career_id,rank,match_score,reasoning,reality_check) values ($1,$2,1,80,'Fictional','Fictional')", [b, legacyCareer]);
  await db.exec(sql("20261027_private_discovery_details"));
  check((await db.query("select career_details from public.career_matches where user_id=$1", [b])).rows[0].career_details.description === "Historical display to preserve", "Migration preserves legacy display data privately before shared writes change it");
  const key = "a".repeat(64);
  await db.exec("set role service_role");
  for (const action of ["ai_global:burst", "ai_global:daily", "api:read", "api:write", "api:sensitive", "worker:burst"]) {
    const results = await Promise.all(Array.from({ length: 4 }, () => db.query("select * from public.consume_pathpilot_rate_limit($1,$2,120,2)", [key, action])));
    check(results.filter(result => result.rows[0].allowed).length === 2, "Atomic budget allows exactly two operations");
  }
  for (const role of ["anon", "authenticated"]) {
    await db.exec(`reset role; set role ${role}`);
    await rejected(`select * from public.consume_pathpilot_rate_limit('${key}','mentor:burst',120,8)`);
    await rejected("select public.process_next_derived_analysis('invalid')");
    await rejected("select * from public.pathpilot_rate_limit_windows");
  }
  await db.exec("reset role");
  if (existsSync(ownerFile)) {
    const rls = await db.query("select relrowsecurity from pg_class where oid in ('public.careers'::regclass,'public.roadmap_milestones'::regclass)");
    check(rls.rows.every(row => row.relrowsecurity), "Missing RLS flags enabled");
    await db.exec("set role authenticated");
    await rejected("truncate public.goals");
    await rejected("insert into public.careers (slug,name,description) values ('forged','Forged','Forged')");
    await db.exec("reset role");
    const ga = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1", gb = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2";
    const pa = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1", pb = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2";
    const ra = "cccccccc-cccc-4ccc-8ccc-ccccccccccc1", rb = "cccccccc-cccc-4ccc-8ccc-ccccccccccc2";
    const ma = "dddddddd-dddd-4ddd-8ddd-ddddddddddd1", mb = "dddddddd-dddd-4ddd-8ddd-ddddddddddd2";
    const ca = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1", cb = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2";
    await db.exec(`
      insert into public.goals (id,user_id,title,category,priority,estimated_hours) values ('${ga}','${a}','Example A','skill','medium',1),('${gb}','${b}','Example B','skill','medium',1);
      insert into public.projects (id,user_id,name,description) values ('${pa}','${a}','Example A','Fictional work'),('${pb}','${b}','Example B','Fictional work');
      insert into public.roadmaps (id,user_id,target_career) values ('${ra}','${a}','Example A'),('${rb}','${b}','Example B');
      insert into public.roadmap_milestones (id,roadmap_id,year,title,category,priority,estimated_hours) values ('${ma}','${ra}',1,'Example A','skill','medium',1),('${mb}','${rb}',1,'Example B','skill','medium',1);
      insert into public.ai_conversations (id,user_id,title) values ('${ca}','${a}','Example A'),('${cb}','${b}','Example B');
      select set_config('request.jwt.claim.sub','${a}',false); select set_config('request.jwt.claim.role','authenticated',false);
      set role authenticated;
    `);
    check((await db.query("select id from public.goals")).rows.length === 1, "User A reads only their own goals");
    check((await db.query("select id from public.roadmap_milestones")).rows.length === 1, "User A reads only their own roadmap milestones");
    await db.exec(`insert into public.project_goals values ('${pa}','${ga}')`);
    await rejected(`insert into public.project_goals values ('${pa}','${gb}')`);
    await db.exec(`insert into public.ai_messages (conversation_id,user_id,role,content) values ('${ca}','${a}','user','Fictional note')`);
    await rejected(`insert into public.ai_messages (conversation_id,user_id,role,content) values ('${cb}','${a}','user','Fictional note')`);
    await rejected(`update public.projects set roadmap_milestone_id='${mb}' where id='${pa}'`);
    await db.exec(`update public.projects set roadmap_milestone_id='${ma}' where id='${pa}'`);
    await rejected(`update public.goals set user_id='${b}' where id='${ga}'`);
    const otherUpdate = await db.query(`update public.goals set title='Not allowed' where id='${gb}' returning id`);
    check(otherUpdate.rows.length === 0, "Cross-user updates affect no records");
    // Exercise the additive discovery schema and transactional owner RPC with
    // fictional records only. No Supabase/PostgREST network is involved.
    await db.exec("reset role");
    const careerIds = Array.from({ length: 5 }, (_, index) => `ffffffff-ffff-4fff-8fff-${String(index + 1).padStart(12, "0")}`);
    for (const [index, id] of careerIds.entries()) await db.query("insert into public.careers (id,slug,name,description) values ($1,$2,$3,$4)", [id, `fictional-${index}`, `Fictional ${index}`, "Authored reference"]);
    const privateMatches = careerIds.map(id => ({ career_id: id, match_score: 80, reasoning: "Fictional owner context", strengths: ["Research"], missing_skills: ["Practice"], reality_check: "Illustrative", next_steps: ["Explore"], career_details: { description: "PRIVATE_SQL_SENTINEL" } }));
    await db.exec("set role authenticated");
    await db.query("select public.replace_private_career_matches($1::jsonb)", [JSON.stringify(privateMatches)]);
    check((await db.query("select career_details from public.career_matches")).rows.length === 5, "Owner saves five private matches");
    check(!(await db.query("select description from public.careers")).rows.some(row => row.description === "PRIVATE_SQL_SENTINEL"), "Private generation never enters shared reference table");
    const broken = privateMatches.map((row, index) => ({ ...row, match_score: index === 4 ? 999 : 80 }));
    let rejectedInsert = false;
    try { await db.query("select public.replace_private_career_matches($1::jsonb)", [JSON.stringify(broken)]); } catch { rejectedInsert = true; }
    check(rejectedInsert, "Malformed insertion rejected by database");
    check((await db.query("select match_score from public.career_matches")).rows.every(row => row.match_score === 80), "Failed replacement rolls back deletion and preserves all prior values");
    const forged = privateMatches.map(row => ({ ...row, user_id: b }));
    let rejectedOwner = false;
    try { await db.query("select public.replace_private_career_matches($1::jsonb)", [JSON.stringify(forged)]); } catch { rejectedOwner = true; }
    check(rejectedOwner, "RPC rejects caller-selected owner fields");
    await rejected("update public.career_matches set career_details='[]'::jsonb");
    await rejected("update public.career_matches set career_details=jsonb_build_object('description', repeat('x',65537))");
    await db.exec(`select set_config('request.jwt.claim.sub','${b}',false)`);
    check((await db.query("select career_details from public.career_matches")).rows.every(row => row.career_details.description !== "PRIVATE_SQL_SENTINEL"), "Other owner cannot read private generated details");
    check((await db.query(`update public.career_matches set career_details='{}' where user_id='${a}' returning id`)).rows.length === 0, "Other owner cannot modify private generated details");
    await db.exec("reset role; set role anon");
    await rejected("select public.replace_private_career_matches('[]'::jsonb)");
    await db.exec("reset role; set role service_role");
    await rejected("select public.replace_private_career_matches('[]'::jsonb)");
    await db.exec(`reset role; select set_config('request.jwt.claim.sub','${a}',false); set role authenticated`);
    await db.exec(`insert into public.derived_analysis_jobs (user_id,analysis_type,status,attempt_count,requested_at,snapshot) values ('${a}','simulation_evolution','completed',3,'-infinity','{"forged":true}')`);
    const queued = (await db.query("select status,attempt_count,snapshot,requested_at > now()-interval '1 minute' as fresh from public.derived_analysis_jobs")).rows;
    check(queued.length === 1 && queued[0].status === "queued" && queued[0].attempt_count === 0 && queued[0].snapshot === null && queued[0].fresh, "Client queue fields are normalized, not trusted");
    await rejected("update public.derived_analysis_jobs set status='completed',snapshot='{}'");
    await db.exec("update public.derived_analysis_jobs set status='cancelled'; update public.derived_analysis_jobs set status='queued',attempt_count=3");
    check((await db.query("select attempt_count from public.derived_analysis_jobs")).rows[0].attempt_count === 0, "Retry resets a valid owned job safely");
    await db.exec("reset role; select set_config('request.jwt.claim.role','service_role',false); set role service_role");
    await db.exec("update public.background_worker_credentials set token_hash=encode(extensions.digest(repeat('a',64),'sha256'),'hex') where worker_name='derived_analysis'");
    check((await db.query("select public.process_next_derived_analysis(repeat('b',64)) as result")).rows[0].result.authorized === false, "Invalid worker token rejected");
    const worker = (await db.query("select public.process_next_derived_analysis(repeat('a',64)) as result")).rows[0].result;
    check(worker.status === "completed", "Worker skips the preexisting poison row and completes the valid job");
    check((await db.query("select public.process_next_derived_analysis(repeat('a',64)) as result")).rows[0].result.reason === "empty", "Exhausted poison rows cannot repeatedly stall processing");
    await db.exec(`reset role; delete from auth.users where id='${a}'`);
    for (const table of ["goals", "projects", "roadmaps", "ai_messages", "ai_conversations", "derived_analysis_jobs"]) {
      check(Number((await db.query(`select count(*) as count from public.${table} where user_id='${a}'`)).rows[0].count) === 0, "Auth deletion cascades to related records");
    }
    check(Number((await db.query(`select count(*) as count from public.roadmap_milestones where id='${ma}'`)).rows[0].count) === 0, "Indirect milestone cascade completes");
    check(Number((await db.query(`select count(*) as count from public.goals where user_id='${b}'`)).rows[0].count) === 1, "Deletion preserves the other account");
    await db.exec("select set_config('request.jwt.claim.sub','',false); select set_config('request.jwt.claim.role','anon',false); set role anon");
    check((await db.query("select id from public.goals")).rows.length === 0, "Anonymous clients read no private records");
    await db.exec("reset role");
  }
  console.log(JSON.stringify({ runtime: "isolated PostgreSQL WASM", assertions, historicalDefinitionsLoaded: applied.length, ownershipMigrationTested: existsSync(ownerFile) }));
} catch (error) {
  // SQL exceptions include queries. Report only state/category, never the object.
  console.error(JSON.stringify({ error: "Isolated SQL verification failed", code: error?.code ?? "assertion", table: error?.table, column: error?.column, assertions, lastApplied: applied.at(-1) }));
  failed = true;
} finally { await db.close(); }
if (failed) process.exitCode = 1;
