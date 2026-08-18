-- Checkpoint 39 follow-up: one SELECT policy per portfolio table avoids repeated
-- permissive-policy evaluation while retaining public published-work access.

drop policy "portfolio_profile_owner" on public.portfolio_profiles;
drop policy "portfolio_profile_public_read" on public.portfolio_profiles;
create policy "portfolio_profile_select" on public.portfolio_profiles
  for select to anon, authenticated
  using (
    (select auth.uid()) = user_id
    or exists (
      select 1 from public.portfolio_projects
      where portfolio_projects.user_id = portfolio_profiles.user_id
        and portfolio_projects.is_published = true
    )
  );
create policy "portfolio_profile_insert" on public.portfolio_profiles
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "portfolio_profile_update" on public.portfolio_profiles
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "portfolio_profile_delete" on public.portfolio_profiles
  for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy "portfolio_project_owner" on public.portfolio_projects;
drop policy "portfolio_project_public_read" on public.portfolio_projects;
create policy "portfolio_project_select" on public.portfolio_projects
  for select to anon, authenticated
  using (
    is_published = true
    or (
      (select auth.uid()) = user_id
      and exists (
        select 1 from public.projects
        where projects.id = portfolio_projects.project_id
          and projects.user_id = (select auth.uid())
      )
    )
  );
create policy "portfolio_project_insert" on public.portfolio_projects
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.projects
      where projects.id = portfolio_projects.project_id
        and projects.user_id = (select auth.uid())
    )
  );
create policy "portfolio_project_update" on public.portfolio_projects
  for update to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.projects
      where projects.id = portfolio_projects.project_id
        and projects.user_id = (select auth.uid())
    )
  )
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.projects
      where projects.id = portfolio_projects.project_id
        and projects.user_id = (select auth.uid())
    )
  );
create policy "portfolio_project_delete" on public.portfolio_projects
  for delete to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.projects
      where projects.id = portfolio_projects.project_id
        and projects.user_id = (select auth.uid())
    )
  );
