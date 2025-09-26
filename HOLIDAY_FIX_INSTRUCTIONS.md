# Holiday Taken Fix Instructions

## Problem
The `holiday_taken` and `approved_holidays_used` columns in the `master_users` table are showing 0 for all users, even though there are approved holiday requests in the `4_holiday_requests` table.

## Solution
The SQL fix in `holiday_taken_fix.sql` updates both columns with the sum of `total_days` from approved holiday requests for each user.

## How to Apply the Fix

1. Log in to the Supabase dashboard at [https://app.supabase.io](https://app.supabase.io)
2. Open your project: "unveoqnlqnobufhublyw"
3. Navigate to the "SQL Editor" section
4. Create a new SQL query
5. Copy the contents of `holiday_taken_fix.sql` into the editor
6. Run each SQL statement separately, in order:
   - First: Check the current values
   - Second: Check the holiday request counts
   - Third: Apply the update
   - Fourth: Verify the update worked

## Details of the Fix

The SQL fix performs these operations:
1. First queries current values to see what needs fixing
2. Then calculates the sum of `total_days` from approved holiday requests for each user
3. Updates `holiday_taken` and `approved_holidays_used` columns for each affected user
4. Verifies that the update was successful

## Expected Outcome

After applying the fix:
- `holiday_taken` should match the sum of `total_days` from approved holiday requests
- `approved_holidays_used` should match the same value
- The holiday calculation in the dashboard should now show correct values

## Manual Verification

After applying the SQL fix, you can verify it worked by:

1. Going to the holiday dashboard in the application
2. Checking that Ben Howard now shows 24.18 days of holiday taken
3. Checking that Gemma Keeling now shows 42 days of holiday taken

These values represent the sum of the `total_days` fields from all approved holiday requests for each user.