create policy "career_catalog_read" on public.careers
  for select using (true);

create policy "roadmap_milestone_owner" on public.roadmap_milestones
  for all
  using (exists (
    select 1 from public.roadmaps
    where public.roadmaps.id = public.roadmap_milestones.roadmap_id
      and public.roadmaps.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.roadmaps
    where public.roadmaps.id = public.roadmap_milestones.roadmap_id
      and public.roadmaps.user_id = auth.uid()
  ));

revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
