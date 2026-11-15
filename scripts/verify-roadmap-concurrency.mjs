// Starts only a fresh loopback PostgreSQL cluster. Never accepts a hosted URL.
// Tool dependencies belong in a temporary prefix, not application dependencies.
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { buildBaseline } from './staging-migrations.mjs';
if (!process.argv[2]?.startsWith('/')) throw new Error('Supply absolute temporary dependency prefix');
const require = createRequire(join(process.argv[2], 'package.json'));
const { default: EmbeddedPostgres } = await import(require.resolve('embedded-postgres'));
const root = mkdtempSync(join(tmpdir(), 'pathpilot-roadmap-pg-'));
const cluster = new EmbeddedPostgres({ databaseDir: join(root, 'db'), user: 'postgres', password: randomBytes(32).toString('hex'), port: 55439,
  persistent: true, autoRehydrateSymlinks: true, postgresFlags: ['-c', 'listen_addresses=127.0.0.1'], onLog: () => {}, onError: () => {} });
const clients = [];
let started = false;
const owner = '11111111-1111-4111-8111-111111111111';
const task = { year: 1, title: 'Synthetic concurrency task', category: 'project', priority: 'medium', estimated_hours: 2, resources: [], sort_order: 0 };
const rpc = (client, expected) => client.query('select public.replace_roadmap_atomic($1,$2,$3,$4) result', [owner, expected, 'Teacher', JSON.stringify([task])]);
try {
  await cluster.initialise(); await cluster.start(); started = true;
  const admin = cluster.getPgClient(); clients.push(admin); await admin.connect();
  await admin.query(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create function auth.role() returns text language sql stable as $$select current_user::text$$;
    grant usage on schema auth to anon,authenticated,service_role;
    set pathpilot.confirm_disposable='abcdefghijklmnopqrst';`);
  await admin.query(buildBaseline('abcdefghijklmnopqrst'));
  await admin.query('insert into auth.users values($1)',[owner]);
  const connections = await Promise.all([1,2].map(async () => {
    const client=cluster.getPgClient(); clients.push(client); await client.connect();
    await client.query(`set role authenticated; set request.jwt.claim.sub='${owner}';`); return client;
  }));
  const [first, second] = connections;
  // Hold a successful RPC transaction open; prove the second backend actually waits on its advisory lock.
  for (const expected of [null, 'existing']) {
    const prior = expected === null ? null : (await first.query("select id from public.roadmaps where status='active'")).rows[0].id;
    await first.query('begin'); await rpc(first, prior);
    const pid=(await second.query('select pg_backend_pid() pid')).rows[0].pid;
    const pending=rpc(second, prior).then(value=>({value}), error=>({error}));
    let waiting=false;
    for(let i=0;i<100;i++) {
      waiting=(await admin.query("select 1 from pg_locks where pid=$1 and locktype='advisory' and not granted",[pid])).rows.length===1;
      if(waiting) break;
      await new Promise(resolve=>setTimeout(resolve,20));
    }
    assert.ok(waiting,'Independent backend must wait for owner lock');
    await first.query('commit');
    assert.equal((await pending).error?.code,'40001','Stale competing request must fail after lock release');
    assert.equal((await first.query("select count(*)::int n from public.roadmaps where status='active'")).rows[0].n,1);
  }
  console.log('PASS: 6 independent-connection assertions on local PostgreSQL; initial creation and replacement serialize. NOT hosted verification.');
} finally {
  await Promise.all(clients.map(client=>client.end().catch(()=>{})));
  if(started) await cluster.stop();
}
