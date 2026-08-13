alter table public.simulations
  add column if not exists engine_version text not null default 'legacy-v1',
  add column if not exists scenario_graph_id text,
  add column if not exists current_node_id text,
  add column if not exists node_history jsonb not null default '[]'::jsonb,
  add column if not exists decision_history jsonb not null default '[]'::jsonb,
  add column if not exists simulation_state jsonb not null default '{}'::jsonb,
  add column if not exists behavioral_evidence jsonb not null default '[]'::jsonb,
  add column if not exists behavioral_profile jsonb,
  add column if not exists compatibility_results jsonb,
  add column if not exists result_summary text,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists simulations_user_status_updated_at_idx
  on public.simulations (user_id, status, updated_at desc);
