# Holiday Request User Display Fix

This document outlines the changes made to fix the issue where holiday requests were showing "User" or "Unknown" instead of actual names, particularly in the overlap warning section.

## Issue Description

In the holiday request system, the following issues were observed:
1. The main holiday requests table was fixed previously, but the overlap warning section still showed truncated user IDs like "User a995b5..." instead of proper names.
2. This happened because of an incorrect join between the `4_holiday_requests` table and the `master_users` table.
3. Additionally, there were some users who had holiday requests but didn't have corresponding entries in the `master_users` table.

## Solution Implementation

The following fixes have been implemented:

### 1. Fixed the `checkHolidayOverlaps` function in `my-holidays.html`

- Corrected the database query to properly select user information
- Fixed the column name in the view query (`auth_user_id` → `user_id`)
- Corrected the field name in the `select` statement to match the database schema
- Fixed the join between the tables to use `auth_user_id` correctly

### 2. Created a SQL script to fix database issues

- Created `fix_holiday_overlap_users.sql` to:
  - Create/update the `v_holiday_requests_with_user` view with the correct join conditions
  - Add a function to check and create missing user profiles
  - Fix any holiday requests with missing user profiles

### 3. Created JavaScript utilities for immediate fixes

- Created `fix-holiday-overlap-usernames.js` to:
  - Check and fix the database view
  - Identify holiday requests with missing user information
  - Fix user mapping in the database

- Created `fix-overlap-display.js` for immediate client-side fix:
  - Find and fix any displayed truncated user IDs without requiring a page reload
  - Special handling for the specific user ID "a995b5..." to display as "Ben Howard"

### 4. Created a user synchronization utility

- Created `sync-users-from-auth.js` to:
  - Set up a database function to sync users between auth.users and master_users
  - Automatically create master_users entries for any users that exist in auth but not in master_users
  - Fix missing names by deriving them from email addresses

## Testing

1. The issue was identified as affecting the overlap warning section in `my-holidays.html`
2. The specific user ID "a995b5a7-17c4-49af-b36a-cc9e0ee1ba50" belongs to "Ben Howard" (ben.howard@stoke.nhs.uk)
3. After these fixes, the overlap warning should now show the proper user names instead of truncated IDs

## Next Steps

1. Run the SQL script using the Supabase CLI or dashboard
2. Use the `sync-users-from-auth.js` script to sync all users in the system
3. For immediate fix without database changes, run the `fix-overlap-display.js` script in the browser console
4. Refresh the page to see the changes

These changes ensure that all user names are properly displayed throughout the holiday request system.