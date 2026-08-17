-- Checkpoint 31: optional response-time observation, never a behavioral score.
alter table public.simulations
  add column if not exists response_timing_opt_in boolean not null default false,
  add column if not exists response_timing_events jsonb not null default '[]'::jsonb;

comment on column public.simulations.response_timing_opt_in is 'Student-controlled consent flag for optional response-time recording. Not used for scoring, recommendations, personality labels, or outcomes.';
comment on column public.simulations.response_timing_events is 'Private optional response-time event metadata. Not part of behavioral evidence, decision history, simulation results, or public/review projections.';
