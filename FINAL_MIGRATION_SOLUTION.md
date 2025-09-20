# Final Migration Solution: Eliminate profiles table completely

## The Goal
Completely eliminate the `profiles` table and use ONLY `master_users` table as the single source of truth.

## Root Cause of Errors
The errors you're seeing ("relation public.profiles does not exist") are coming from:
1. Database functions/procedures that still reference `profiles`
2. RLS policies that reference `profiles`
3. Triggers that reference `profiles`
4. Frontend code using incorrect column names

## What Actually Exists in Your Database

### Tables that EXIST:
- `master_users` - The new source of truth for all user data
- `4_holiday_requests` - Actual holiday requests table
- `complaints` - Complaints data
- `training_records` - Training records
- `training_types` - Training type definitions
- `item_allowed_types` - Schedule data
- `meetings`, `rooms`, `items`, `check_types`, `submissions`

### Tables that DON'T EXIST (but are referenced):
- `profiles` - Old table, removed
- `holidays`, `holiday_approvals` - Don't exist
- `schedules` - Doesn't exist (uses `item_allowed_types`)
- `two_week_email` - Doesn't exist
- `mandatory_training` - Doesn't exist

## Solutions Applied

### 1. Frontend Fixes (admin-dashboard.html)
✅ Fixed column name issues:
- Changed `kiosk_auth_user_id` → `kiosk_user_id`
- Changed `user_id` → `auth_user_id` where referencing master_users
- Updated training matrix to use correct columns

### 2. Database Fixes Required

Run `fix_all_database_references.sql` in Supabase SQL Editor. This script:
- Finds and updates ALL functions referencing `profiles`
- Updates RPC functions like `transfer_fuzzy_match_to_request`
- Updates RLS policies
- Updates foreign key constraints
- Updates triggers
- Replaces all `profiles` references with `master_users`
- Fixes column name mappings

## How to Apply the Fix

1. **Run the SQL migration:**
   ```sql
   -- Copy and paste contents of fix_all_database_references.sql
   -- into Supabase SQL Editor and run it
   ```

2. **The frontend is already fixed** - admin-dashboard.html has been updated

3. **Test each section:**
   - Training Tracker - Should load without "kiosk_auth_user_id" error
   - Complaints - Should load normally
   - Calendar/Schedules - Should work with item_allowed_types table
   - Pre-inspection/PIR - Should load documents correctly

## Key Changes Made

### Database Level:
- NO views created (we're eliminating profiles completely)
- Functions updated to reference master_users directly
- RPC functions updated to use correct table/column names
- Policies and triggers updated

### Application Level:
- Fixed column references (`kiosk_auth_user_id` → `kiosk_user_id`)
- Fixed UUID references (`user_id` → `auth_user_id`)
- All queries now use master_users directly

## Testing After Migration

Run this test query in Supabase SQL Editor:
```sql
-- Check for any remaining profiles references
SELECT
    'Functions' as type,
    count(*) as remaining_references
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND pg_get_functiondef(p.oid) LIKE '%profiles%'
UNION ALL
SELECT
    'Views' as type,
    count(*) as remaining_references
FROM pg_views
WHERE schemaname = 'public'
AND pg_get_viewdef((schemaname||'.'||viewname)::regclass, true) LIKE '%profiles%';
```

Both counts should be 0 after running the migration.

## Important Notes

1. **master_users is the ONLY user table** - all user data lives here
2. **No backward compatibility views** - we're fully migrating away from profiles
3. **Holiday data** is in `4_holiday_requests`, not `holidays`
4. **Schedule data** is in `item_allowed_types`, not `schedules`
5. **Training matrix** now correctly uses `kiosk_user_id` column

## If Issues Persist

Some errors might be coming from:
- Cached database functions - may need to restart Supabase
- Browser cache - clear cache and reload
- RLS policies - check Supabase dashboard for any policies still referencing profiles

The goal is achieved when ALL references to `profiles` are eliminated and everything uses `master_users` directly.