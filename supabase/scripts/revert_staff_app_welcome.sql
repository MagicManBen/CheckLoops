-- Revert script for 20240908_create_staff_app_welcome.sql
-- Safely removes staff_app_welcome table, its trigger, policies, and helper function.
-- Run this in Supabase Studio SQL editor or psql if you want to undo the onboarding source table.

-- 1) Drop trigger (if present)
drop trigger if exists _saw_touch_updated_at on public.staff_app_welcome;

-- 2) Drop RLS policies (if present)
drop policy if exists "saw_insert_own" on public.staff_app_welcome;
drop policy if exists "saw_select_own" on public.staff_app_welcome;
drop policy if exists "saw_update_own" on public.staff_app_welcome;

-- 3) Drop the table (removes any remaining dependent objects)
drop table if exists public.staff_app_welcome;

-- 4) Drop the helper function (only if not used elsewhere)
drop function if exists public._saw_touch_updated_at();

-- Done.

