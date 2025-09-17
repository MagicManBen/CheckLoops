# Apply Auto‑Award Achievements (Supabase CLI)

This enables automatic unlocking for:

- `quiz_complete` and `quiz_perfect` (on `quiz_attempts` insert)
- `on_time_submission` and `seven_day_streak` (on `submissions` insert)
- `training_complete` (on `training_records` insert/update)

It also adds a helper `find_kiosk_user_id(user_id)` to resolve the kiosk user id from `profiles`.

## Files

- `supabase/migrations/20250916_achievements_auto_awards.sql`

## Apply

1) Ensure you’re in your Supabase project folder (this repo) and logged in:

```
supabase status
supabase login
supabase link --project-ref <YOUR_PROJECT_REF>
```

2) Push migrations to your remote database:

```
supabase db push
```

If you manage a remote DB password, include `--password $SUPABASE_DB_PASSWORD` accordingly.

## Verify

- Insert a `quiz_attempts` row via the app (take a required quiz). `user_achievements` should show `quiz_complete`, and `quiz_perfect` if score is 100%.
- Create any regular submission before 10:00 to unlock `on_time_submission`.
- Ensure 7 consecutive days with at least one submission to unlock `seven_day_streak`.
- Add/update valid training records to reach 100% compliance and unlock `training_complete`.

Use the Achievements page (`achievements.html`) to view authoritative status; the Staff home now reads from DB first.

