# Holiday View Error Fix

## Issue

When running the holiday overlap user fix SQL script, the following error occurred:

```
ERROR: 42P16: cannot change name of view column "status" to "total_days"
HINT: Use ALTER VIEW ... RENAME COLUMN ... to change name of view column instead.
```

## Cause

The error happens because the original script tried to use `CREATE OR REPLACE VIEW` with a different column structure than the existing view. Specifically, PostgreSQL doesn't allow changing column names when replacing a view - it requires explicitly dropping and recreating the view instead.

## Solution

I've updated the SQL script in two ways:

1. Modified `fix_holiday_overlap_users.sql` to:
   - Explicitly drop the view first (`DROP VIEW IF EXISTS`)
   - Create the view with explicit column names rather than using `hr.*`
   - This prevents column name conflicts when recreating the view

2. Created a separate `fix_holiday_view.sql` file that:
   - Includes diagnostic queries to check if the view exists
   - Provides a step-by-step process for safely recreating the view
   - Includes a verification step to check the structure after creation

## How to Use

### Option 1: Use the updated script

Run the updated `fix_holiday_overlap_users.sql` through the Supabase SQL Editor or CLI.

### Option 2: Step-by-step approach

If the first option still causes issues, use the `fix_holiday_view.sql` script:

1. Run the first query to check if the view exists
2. Run the drop statement if it does exist
3. Run the create view statement to create the new view
4. Run the final query to verify the structure

## Verification

After applying either fix, you can verify the view works correctly by running:

```sql
SELECT * FROM v_holiday_requests_with_user LIMIT 5;
```

This should return holiday requests with user names and email addresses properly joined.

---

The fix ensures that user names will be properly displayed in the holiday overlap warnings, resolving the issue where user IDs were being shown instead of names.