alter table public.simulations
  add column if not exists behavioral_events jsonb not null default '[]'::jsonb;
