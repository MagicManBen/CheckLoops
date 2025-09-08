-- Migration: add next_quiz_due to profiles and backfill from quiz_attempts
BEGIN;

-- Add column (nullable)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS next_quiz_due timestamptz;

-- Backfill: set next_quiz_due = last attempt completed_at + 7 days
WITH last_attempt AS (
  SELECT user_id, MAX(COALESCE(completed_at, created_at)) AS last_done
  FROM public.quiz_attempts
  GROUP BY user_id
)
UPDATE public.profiles p
SET next_quiz_due = (la.last_done + interval '7 days')
FROM last_attempt la
WHERE p.user_id = la.user_id
  AND (p.next_quiz_due IS NULL OR p.next_quiz_due < (la.last_done + interval '7 days'));

COMMIT;
