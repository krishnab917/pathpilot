// Isolated PostgreSQL/WASM, never a hosted URL. PGlite serializes connections;
// overlapping calls test stale-request CAS, not multi-process lock scheduling.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { buildBaseline, loadPlan } from './staging-migrations.mjs';
const url = pathToFileURL(process.argv[2] || '');
if (!process.argv[2]?.startsWith('/')) throw new Error('Supply temporary PGlite module path');
const { PGlite } = await import(url.href);
const { pgcrypto } = await import(new URL('contrib/pgcrypto.js', url).href);
const db = new PGlite({ extensions: { pgcrypto } });
let checks = 0;
const check = (value, message) => { assert.ok(value, message); checks++; };
const a='11111111-1111-4111-8111-111111111111', b='22222222-2222-4222-8222-222222222222';
async function reject(fn, code) { let error; try { await fn(); } catch(e) { error=e; } check(error && (!code || error.code===code), `Expected rejection ${code}: ${error?.code}`); }
const intake={version:'discovery-intake-v1', fields:['hospitality'], preferences:{practical:1, creative:0.5}, subjects:['Cooking'], pathways:['apprenticeship'], motivations:['Creativity'], direction:'ideas', careers:['Chef']};
const task={year:1,title:'Synthetic work',category:'project',priority:'medium',estimated_hours:2,resources:[],sort_order:0};
const replace=(owner, expected, items=[task])=>db.query('select public.replace_roadmap_atomic($1,$2,$3,$4) result',[owner,expected,'Teacher',JSON.stringify(items)]);
try {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create function auth.role() returns text language sql stable as $$ select current_user::text $$;
    grant usage on schema auth to anon,authenticated,service_role;
    set pathpilot.confirm_disposable='abcdefghijklmnopqrst';`);
  await db.exec(buildBaseline('abcdefghijklmnopqrst'));
  await db.exec(`insert into auth.users values('${a}'),('${b}');
    insert into public.student_profiles(user_id,grade,location) values('${a}','10','Synthetic'),('${b}','11','Synthetic');
    set role authenticated; set request.jwt.claim.sub='${a}';`);
  for(const valid of [null,{version:'discovery-intake-v1'},intake,{...intake,pathways:[],preferences:{}}, {...intake, subjects:['😀'.repeat(40)]}]) {
    await db.query('update public.student_profiles set discovery_intake=$1 where user_id=$2',[valid === null ? null : JSON.stringify(valid),a]);
    check((await db.query('select interests from public.student_profiles')).rows.length===1,'Owned existing profile survives valid intake');
  }
  for(const invalid of [[],{}, {...intake,extra:true},{...intake,fields:['invented']},{...intake,fields:null},{...intake,preferences:[]},{...intake,preferences:{practical:0.2}}, {...intake,preferences:{secret:1}}, {...intake,preferences:{practical:'1'}},{...intake,pathways:['invalid']},{...intake,motivations:['invented']},{...intake,careers:[{}]}, {...intake,subjects:['x'.repeat(81)]},{...intake,subjects:Array(13).fill('x')},{...intake,subjects:['😀'.repeat(41)]},{...intake,subjects:['\t\n']},{...intake,direction:null},{...intake,careers:['x'.repeat(20000)]}]) {
    await reject(()=>db.query('update public.student_profiles set discovery_intake=$1 where user_id=$2',[JSON.stringify(invalid),a]),'23514');
  }
  const draft={grade:'',location:'',interests:[],skills:[],activities:[],careerPreferences:[],discoveryIntake:intake};
  for(const invalid of [[4],Array(13).fill('x'),['x'.repeat(81)],['\u00a0'],['\ufeff']])
    await reject(()=>db.query('update public.student_profiles set interests=$1 where user_id=$2',[JSON.stringify(invalid),a]),'23514');
  await reject(()=>db.query('update public.student_profiles set grade=$1 where user_id=$2',[' '.repeat(17),a]),'23514');
  await db.query('update public.student_profiles set interests=$1 where user_id=$2',[JSON.stringify(['v','\u00a0art\u00a0']),a]);
  check((await db.query('select interests from public.student_profiles')).rows[0].interests[0]==='v','Trimming does not remove ordinary letters');
  await db.query('insert into public.onboarding_drafts(user_id,payload) values($1,$2)',[a,JSON.stringify(draft)]);
  for(const bad of [{...draft,discoveryIntake:{...intake,preferences:{practical:9}}},{...draft,skills:[4]},{...draft,extra:'bad'},{...draft,countryCode:'USA'},{...draft,location:'x'.repeat(161)}])
    await reject(()=>db.query('update public.onboarding_drafts set payload=$1',[JSON.stringify(bad)]),'23514');
  check((await db.query('select payload from public.onboarding_drafts')).rows[0].payload.discoveryIntake.fields[0]==='hospitality','Invalid draft writes leave prior values');
  const old=(await replace(a,null)).rows[0].result;
  check(old.milestones.length===1,'Initial plan and milestone committed together');
  for(const items of [[task,{...task,year:99}], [task,{...task,estimated_hours:0}]]) {
    await reject(()=>replace(a,old.id,items),'23514');
    check((await db.query("select id from public.roadmaps where status='active'")).rows[0].id===old.id,'Failure after insert restores previous active roadmap');
    check((await db.query('select * from public.roadmaps')).rows.length===1,'No partial replacement remains');
    check((await db.query('select * from public.roadmap_milestones')).rows.length===1,'No orphan/partial milestones remain');
  }
  await reject(()=>replace(b,null),'42501');
  const competing=await Promise.allSettled([replace(a,old.id),replace(a,old.id)]);
  check(competing.filter(r=>r.status==='fulfilled').length===1,'One competing expected-version request succeeds');
  check(competing.some(r=>r.status==='rejected'&&r.reason.code==='40001'),'Stale replacement is a conflict');
  const active=(await db.query("select id from public.roadmaps where status='active'")).rows;
  check(active.length===1,'One active plan after competing requests');
  check((await db.query("select * from public.roadmaps where id=$1",[old.id])).rows[0].status==='archived','Old plan retained, not deleted');
  await reject(()=>db.query('insert into public.roadmaps(user_id,target_career) values($1,$2)',[a,'Duplicate']),'23505');
  await db.exec(`set request.jwt.claim.sub='${b}'`);
  check((await db.query('select * from public.roadmaps')).rows.length===0,'B cannot read A roadmap');
  await reject(()=>replace(a,active[0].id),'42501');
  check((await replace(b,null)).rows[0].result.user_id===b,'B can create own plan');
  await db.exec("reset role; set role anon; set request.jwt.claim.sub='';");
  await reject(()=>replace(a,null),'42501');
  await db.exec('reset role');
  const fn=(await db.query("select prosecdef,proconfig from pg_proc where proname='replace_roadmap_atomic'")).rows[0];
  check(!fn.prosecdef && fn.proconfig.includes('search_path=pg_catalog'),'Invoker rights and fixed search path');
  check((await db.query("select count(*)::int n from pg_class where relname in ('student_profiles','onboarding_drafts','roadmaps','roadmap_milestones') and relrowsecurity")).rows[0].n===4,'RLS retained');
  const legacy = new PGlite({ extensions: { pgcrypto } });
  try {
    await legacy.exec(`create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql as $$ select null::uuid $$;
      create schema extensions; create extension pgcrypto with schema extensions;`);
    const plan = loadPlan();
    await legacy.exec(plan[0].sql);
    await legacy.exec(plan[2].sql);
    await legacy.exec(plan[5].sql);
    await legacy.exec(plan[34].sql);
    await legacy.query('insert into auth.users values($1),($2)',[a,b]);
    await legacy.query('insert into public.student_profiles(user_id,grade,location,discovery_intake) values($1,$2,$3,$4),($5,$2,$3,$6)',[a,'10','Synthetic',JSON.stringify(intake),b,JSON.stringify({version:'discovery-intake-v1',preferences:'legacy-invalid'})]);
    const before = JSON.stringify((await legacy.query('select * from public.student_profiles order by user_id')).rows);
    await legacy.query("insert into public.roadmaps(user_id,target_career) values($1,'Synthetic duplicate one'),($1,'Synthetic duplicate two')",[a]);
    await reject(()=>legacy.exec(plan[35].sql),'P0001');
    await legacy.exec('rollback');
    check((await legacy.query('select count(*)::int n from public.roadmaps')).rows[0].n===2,'Duplicate preflight abort preserves existing plans');
    check((await legacy.query("select count(*)::int n from pg_constraint where conname='discovery_intake_nested_valid'")).rows[0].n===0,'Migration failure rolls back all DDL');
    // Remove only the two synthetic records in this in-memory compatibility database.
    await legacy.query('delete from public.roadmaps where user_id=$1',[a]);
    await legacy.exec(plan[35].sql);
    check(before===JSON.stringify((await legacy.query('select * from public.student_profiles order by user_id')).rows),'Migration preserves valid and pre-existing malformed rows without rewriting');
    await reject(()=>legacy.exec('alter table public.student_profiles validate constraint discovery_intake_nested_valid'),'23514');
    check((await legacy.query("select convalidated from pg_constraint where conname='discovery_intake_nested_valid'")).rows[0].convalidated===false,'Owner compatibility review required before validating historical rows');
    await legacy.query('update public.student_profiles set grade=$1 where user_id=$2',['11',a]);
    check((await legacy.query('select grade from public.student_profiles where user_id=$1',[a])).rows[0].grade==='11','Existing valid profile remains editable');
  } finally { await legacy.close(); }
  console.log(`PASS: ${checks} production-readiness SQL assertions; not hosted or multi-process verification.`);
} finally { await db.close(); }
