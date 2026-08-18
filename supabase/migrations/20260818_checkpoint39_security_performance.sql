-- Checkpoint 39: preserve existing RLS semantics while reducing repeated auth lookups.
-- All indexes are additive and cover foreign-key columns reported by the live advisor.

create index if not exists ai_conversations_user_id_idx on public.ai_conversations (user_id);
create index if not exists ai_messages_conversation_id_idx on public.ai_messages (conversation_id);
create index if not exists ai_messages_user_id_idx on public.ai_messages (user_id);
create index if not exists ai_result_cache_subject_id_idx on public.ai_result_cache (subject_id);
create index if not exists career_matches_career_id_idx on public.career_matches (career_id);
create index if not exists goals_user_id_idx on public.goals (user_id);
create index if not exists portfolio_projects_project_id_idx on public.portfolio_projects (project_id);
create index if not exists project_goals_goal_id_idx on public.project_goals (goal_id);
create index if not exists project_milestones_project_id_idx on public.project_milestones (project_id);
create index if not exists projects_career_id_idx on public.projects (career_id);
create index if not exists projects_roadmap_milestone_id_idx on public.projects (roadmap_milestone_id);
create index if not exists projects_user_id_idx on public.projects (user_id);
create index if not exists roadmap_milestones_roadmap_id_idx on public.roadmap_milestones (roadmap_id);
create index if not exists roadmap_recommendations_accepted_goal_id_idx on public.roadmap_recommendations (accepted_goal_id);
create index if not exists roadmap_recommendations_roadmap_id_idx on public.roadmap_recommendations (roadmap_id);
create index if not exists roadmaps_user_id_idx on public.roadmaps (user_id);
create index if not exists student_opportunity_states_opportunity_id_idx on public.student_opportunity_states (opportunity_id);

alter policy "conversation_owner" on public.ai_conversations
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
alter policy "message_owner" on public.ai_messages
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
alter policy "ai_result_cache_owner" on public.ai_result_cache
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
alter policy "behavioral_activity_event_owner" on public.behavioral_activity_events
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
alter policy "career_match_owner" on public.career_matches
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
alter policy "derived_analysis_job_owner" on public.derived_analysis_jobs
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
alter policy "goal_owner" on public.goals
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
alter policy "onboarding_draft_owner" on public.onboarding_drafts
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
alter policy "planning_report_share_link_owner" on public.planning_report_share_links
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
alter policy "portfolio_profile_owner" on public.portfolio_profiles
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
alter policy "portfolio_project_owner" on public.portfolio_projects
  using (
    (select auth.uid()) = user_id
    and exists (select 1 from public.projects where projects.id = portfolio_projects.project_id and projects.user_id = (select auth.uid()))
  )
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.projects where projects.id = portfolio_projects.project_id and projects.user_id = (select auth.uid()))
  );
alter policy "project_goal_owner" on public.project_goals
  using (exists (select 1 from public.projects where projects.id = project_goals.project_id and projects.user_id = (select auth.uid())))
  with check (exists (select 1 from public.projects where projects.id = project_goals.project_id and projects.user_id = (select auth.uid())));
alter policy "project_milestone_owner" on public.project_milestones
  using (
    (select auth.uid()) = user_id
    and exists (select 1 from public.projects where projects.id = project_milestones.project_id and projects.user_id = (select auth.uid()))
  )
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.projects where projects.id = project_milestones.project_id and projects.user_id = (select auth.uid()))
  );
alter policy "project_owner" on public.projects
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
alter policy "roadmap_milestone_owner" on public.roadmap_milestones
  using (exists (select 1 from public.roadmaps where roadmaps.id = roadmap_milestones.roadmap_id and roadmaps.user_id = (select auth.uid())))
  with check (exists (select 1 from public.roadmaps where roadmaps.id = roadmap_milestones.roadmap_id and roadmaps.user_id = (select auth.uid())));
alter policy "Students manage their own roadmap recommendations" on public.roadmap_recommendations
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
alter policy "roadmap_owner" on public.roadmaps
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
alter policy "simulation_owner" on public.simulations
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
alter policy "student_opportunity_states_own" on public.student_opportunity_states
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
alter policy "student_profile_owner" on public.student_profiles
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
