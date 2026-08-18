drop policy if exists "background_worker_credentials_deny_client_access" on public.background_worker_credentials;
create policy "background_worker_credentials_deny_client_access" on public.background_worker_credentials
  as restrictive for all using (false) with check (false);

revoke all on function public.process_next_derived_analysis(text) from anon, authenticated;
grant execute on function public.process_next_derived_analysis(text) to service_role;
