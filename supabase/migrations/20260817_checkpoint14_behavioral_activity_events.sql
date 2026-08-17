-- Checkpoint 14: minimal, user-owned planning activity events.
-- Metadata is intentionally bounded to non-sensitive operational context only.
CREATE TABLE public.behavioral_activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN (
    'goal_created',
    'goal_updated',
    'goal_progress_updated',
    'goal_completed',
    'opportunity_saved',
    'opportunity_dismissed',
    'opportunity_goal_created'
  )),
  subject_type text NOT NULL CHECK (subject_type IN ('goal', 'opportunity')),
  subject_id uuid NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX behavioral_activity_events_user_created_at_idx
  ON public.behavioral_activity_events (user_id, created_at DESC);

ALTER TABLE public.behavioral_activity_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY behavioral_activity_event_owner
  ON public.behavioral_activity_events
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.behavioral_activity_events IS
  'Minimal private planning activity history. Not a personality assessment, diagnostic record, or career-success predictor.';
