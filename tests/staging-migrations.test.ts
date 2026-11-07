import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
// Offline compiler has no database client and cannot execute hosted migrations.
import { buildBaseline, loadPlan, manifest } from '../scripts/staging-migrations.mjs';

describe('staging migration manifest', () => {
  it('includes every historical file exactly once with backward dependencies and hashes', () => {
    const plan = loadPlan();
    expect(plan).toHaveLength(35);
    expect(new Set(plan.map(entry => entry.name)).size).toBe(35);
    for (const entry of plan) {
      expect(entry.sourceHash).toMatch(/^[a-f0-9]{64}$/);
      expect(entry.sourceHash).toBe(createHash('sha256').update(readFileSync(new URL(`../supabase/migrations/${entry.name}.sql`, import.meta.url))).digest('hex'));
      expect(entry.dependencies.every(id => id > 0 && id < entry.id)).toBe(true);
    }
  });
  it('records both source-only bootstrap incompatibilities explicitly', () => {
    expect(loadPlan()[1].sql).toContain("to_regprocedure('public.rls_auto_enable()')");
    expect(loadPlan()[27].sql).toContain('alter policy "Students manage their own opportunity states"');
    expect(manifest[28][1]).toContain(28);
  });
  it('compiles deterministic SQL with empty-target, checksum and owner-confirmation guards', () => {
    const sql = buildBaseline('abcdefghijklmnopqrst');
    expect(sql).toBe(buildBaseline('abcdefghijklmnopqrst'));
    expect(sql).toContain('pathpilot.confirm_disposable');
    expect(sql).toContain('existing tables/users found');
    expect(sql).toContain('manual forward reconciliation required');
    expect(sql).not.toContain('create role authenticated');
    expect(sql).not.toMatch(/disable row level security/i);
  });
  it('rejects missing or SQL-injecting project references', () => {
    for (const value of ['', "';drop table x;--", 'https://example.com']) expect(() => buildBaseline(value)).toThrow();
  });
});
