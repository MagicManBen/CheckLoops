# Holiday Requests User Names Fix

This repository contains tools to fix an issue where holiday requests in the CheckLoop system were showing "Unknown" or "User" instead of actual user names.

## Problem

On the my-holidays page and admin dashboard holiday requests section, user names were not properly displaying. The issue was related to the relationship between the `4_holiday_requests` table and `master_users` table.

## Solution Files

1. **fix_holiday_user_names.sql** - SQL script to fix the database relationships and populate missing data
   - This script identifies and repairs missing connections between holiday requests and user records
   - It can be run directly against the database via the Supabase SQL editor

2. **fix_holiday_usernames.js** - Client-side JavaScript utility
   - Can be run in the browser console while on the admin dashboard 
   - Synchronizes user information for holiday requests
   - Useful when you don't have direct database access

3. **debug_holiday_users.js** - Diagnostic tool
   - Helps identify specific issues with holiday user data
   - Outputs detailed information about the state of user data for holiday requests
   - Can be run in the browser console for troubleshooting

## How to Fix

### Method 1: Using the SQL Script (Recommended)

1. Log into the Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `fix_holiday_user_names.sql`
4. Run the script
5. Verify the fix by checking holiday requests in the admin dashboard

### Method 2: Using the JavaScript Utility

1. Open the admin dashboard in your browser
2. Open the browser console (F12 or right-click > Inspect > Console)
3. Copy and paste the contents of `fix_holiday_usernames.js` into the console
4. Press Enter to run the script
5. Check the console output for results and confirmation

### For Troubleshooting

If issues persist, run the `debug_holiday_users.js` script in the browser console to get detailed diagnostic information.

## Technical Details

The main issue was that the `4_holiday_requests` table stores the user ID in the `user_id` field, which should be joined with the `auth_user_id` field in the `master_users` table. The code was attempting to join these tables incorrectly or there were missing records in the `master_users` table.

The fix ensures:
1. The view `v_holiday_requests_with_user` is correctly defined
2. All holiday requests have corresponding entries in the `master_users` table
3. Client-side code uses the correct join conditions when fetching data

After applying the fix, both the admin dashboard and my-holidays page should correctly display user names for all holiday requests.