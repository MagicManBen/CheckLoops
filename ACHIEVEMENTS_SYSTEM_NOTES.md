# Achievements System (Enhancements 2025-09-11)

This note documents the fixes and improvements applied:

## Added
- Migration `20250911210000_achievements_rpc_and_policies.sql`:
  - RPC `get_achievements_with_user(p_kiosk_user_id integer)` returning joined achievement + user status.
  - Row Level Security policies (read for achievements; row‑owner CRUD for user_achievements via kiosk_users linkage).
  - Triggers:
    - `trg_award_quiz_achievements` on `quiz_attempts` automatically unlocks `quiz_complete` and `quiz_perfect`.
    - `trg_award_first_login` on `kiosk_users` automatically unlocks `first_login`.
  - Re-seed missing user_achievements rows idempotently.

## Frontend Changes
- `staff.html`: Fixed First Login unlock logic (now uses auth user.created_at instead of missing profileRow.created_at).
- `achievements.html`: Manual Unlock button removed. All achievements are unlocked automatically via database triggers; page is read‑only.

## Remaining / Future (Optional)
- Server-side automation for streak, on-time submission, and training completion could be migrated to triggers or scheduled functions (currently computed client-side each dashboard load).
- Consider a materialized view or function to calculate progress percentages for partial achievements.
- Add auditing (e.g., a `user_achievement_events` table) if provenance is needed.

## Deployment
Apply migrations via Supabase CLI or dashboard. Policies assume `auth.uid()` reflects the logged-in user (standard Supabase behavior). Ensure `kiosk_users` is populated for each staff user to allow automatic awarding.
