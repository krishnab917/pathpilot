-- A private portfolio draft must not make a profile publicly visible.
drop policy if exists "portfolio_profile_public_read" on public.portfolio_profiles;
create policy "portfolio_profile_public_read" on public.portfolio_profiles
  for select using (
    exists (
      select 1 from public.portfolio_projects
      where portfolio_projects.user_id = portfolio_profiles.user_id
        and portfolio_projects.is_published = true
    )
  );
