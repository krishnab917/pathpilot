-- Checkpoint 18: add private project and roadmap-progress activity types.
-- Existing activity rows remain valid; no RLS policy or historical data is changed.
ALTER TABLE public.behavioral_activity_events
  DROP CONSTRAINT behavioral_activity_events_event_type_check,
  DROP CONSTRAINT behavioral_activity_events_subject_type_check;

ALTER TABLE public.behavioral_activity_events
  ADD CONSTRAINT behavioral_activity_events_event_type_check CHECK (event_type IN (
    'goal_created',
    'goal_updated',
    'goal_progress_updated',
    'goal_completed',
    'opportunity_saved',
    'opportunity_dismissed',
    'opportunity_goal_created',
    'roadmap_milestone_progress_updated',
    'roadmap_milestone_completed',
    'project_created',
    'project_progress_updated',
    'project_completed'
  )),
  ADD CONSTRAINT behavioral_activity_events_subject_type_check CHECK (subject_type IN (
    'goal',
    'opportunity',
    'roadmap_milestone',
    'project'
  ));
