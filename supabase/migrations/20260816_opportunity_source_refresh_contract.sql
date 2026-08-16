alter table public.opportunities
  drop constraint if exists opportunities_participation_mode_check;

alter table public.opportunities
  add constraint opportunities_participation_mode_check
  check (participation_mode in ('digital', 'in_person', 'hybrid', 'details_on_source'));

delete from public.student_opportunity_states
where opportunity_id in (
  select opportunity.id
  from public.opportunities opportunity
  join public.opportunity_sources source on source.id = opportunity.source_id
  where source.slug = 'nasa-space-apps'
);

delete from public.opportunities
where source_id in (select id from public.opportunity_sources where slug = 'nasa-space-apps');

delete from public.opportunity_sources where slug = 'nasa-space-apps';
