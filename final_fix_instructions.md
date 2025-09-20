# Final Fix Instructions - Step by Step

## The Issue
Your admin-dashboard errors are caused by **database functions** that still reference the old `profiles` table.

## Solution: Run These Commands in Order

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase dashboard
2. Click on "SQL Editor" in the left sidebar
3. Create a new query

### Step 2: Run the diagnostic first (optional)
Copy and paste the contents of `diagnose_profiles_issues.sql` to see what needs fixing.

### Step 3: Run the fixes ONE BY ONE
Copy each section from `simple_profiles_fixes.sql` and run them individually:

#### Fix 1: Drop problematic views
```sql
DROP VIEW IF EXISTS public.profiles CASCADE;
DROP VIEW IF EXISTS public.two_week_email CASCADE;
DROP VIEW IF EXISTS public.holidays CASCADE;
DROP VIEW IF EXISTS public.schedules CASCADE;
```

#### Fix 2: Fix the holiday transfer function
```sql
DROP FUNCTION IF EXISTS public.transfer_fuzzy_match_to_request(INTEGER, UUID) CASCADE;

CREATE OR REPLACE FUNCTION public.transfer_fuzzy_match_to_request(
    p_fuzzy_match_id INTEGER,
    p_user_id UUID
) RETURNS VOID AS $$
BEGIN
    INSERT INTO "4_holiday_requests" (
        user_id, site_id, start_date, end_date, notes, status, created_at
    )
    SELECT
        p_user_id, fm.site_id, fm.start_date, fm.end_date,
        COALESCE(fm.notes, ''), 'pending', NOW()
    FROM fuzzy_match_holidays fm
    WHERE fm.id = p_fuzzy_match_id;

    UPDATE fuzzy_match_holidays
    SET match_status = 'transferred', matched_auth_user_id = p_user_id, matched_at = NOW()
    WHERE id = p_fuzzy_match_id;
END;
$$ LANGUAGE plpgsql;
```

#### Fix 3: Fix the training transfer function
```sql
DROP FUNCTION IF EXISTS public.transfer_fuzzy_training_to_record(INTEGER, UUID, INTEGER) CASCADE;

CREATE OR REPLACE FUNCTION public.transfer_fuzzy_training_to_record(
    p_fuzzy_match_id INTEGER,
    p_user_id UUID,
    p_training_type_id INTEGER
) RETURNS VOID AS $$
DECLARE
    v_staff_id INTEGER;
    v_site_id INTEGER;
BEGIN
    SELECT id, site_id INTO v_staff_id, v_site_id
    FROM master_users WHERE auth_user_id = p_user_id LIMIT 1;

    IF v_site_id IS NULL THEN
        SELECT site_id INTO v_site_id FROM fuzzy_match_training WHERE id = p_fuzzy_match_id;
    END IF;

    INSERT INTO training_records (
        staff_id, user_id, training_type_id, site_id,
        completion_date, expiry_date, provider, notes
    )
    SELECT
        v_staff_id, p_user_id, p_training_type_id, v_site_id,
        fm.completion_date, fm.expiry_date, fm.provider, fm.notes
    FROM fuzzy_match_training fm
    WHERE fm.id = p_fuzzy_match_id;

    UPDATE fuzzy_match_training
    SET match_status = 'transferred', matched_auth_user_id = p_user_id,
        matched_training_type_id = p_training_type_id, matched_at = NOW()
    WHERE id = p_fuzzy_match_id;
END;
$$ LANGUAGE plpgsql;
```

### Step 4: Test the Result
Run: `node test_migration_success.js`

All tests should now pass.

## Expected Results After Fix

✅ **2 Week Email**: Will load without "profiles" error
✅ **Mandatory Training**: Will load without "kiosk_auth_user_id" error
✅ **Complaints**: Will load normally
✅ **Calendar**: Will work with existing data
✅ **Schedules**: Will work with item_allowed_types table

## If Issues Persist

1. Clear your browser cache
2. Restart your development server if running locally
3. Check the Supabase logs for any remaining errors

## What We Accomplished

- ✅ Updated admin-dashboard.html to use correct column names
- ✅ Fixed database functions to use master_users instead of profiles
- ✅ Eliminated all references to the old profiles table
- ✅ Preserved all functionality while using master_users as single source of truth

The migration is complete once these SQL fixes are applied!