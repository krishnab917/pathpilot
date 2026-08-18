create table if not exists public.background_worker_credentials (
  worker_name text primary key,
  token_hash text not null check (char_length(token_hash) = 64),
  created_at timestamptz not null default now(),
  rotated_at timestamptz not null default now()
);

alter table public.background_worker_credentials enable row level security;

insert into public.background_worker_credentials (worker_name, token_hash)
values ('derived_analysis', 'd108190c81d87f4c1857fe565f276273b4ba84dcf0b76e25c957fa773bc2ada2')
on conflict (worker_name) do update set token_hash = excluded.token_hash, rotated_at = now();

comment on table public.background_worker_credentials is 'Service-only SHA-256 token verifiers for project-level scheduled workers. No client policy or raw token is stored.';
