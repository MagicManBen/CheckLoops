# Migration Fix Summary: Profiles to Master_Users

## Problem
You migrated from using the `profiles` table to the `master_users` table, but admin-dashboard is showing multiple errors because:
1. Database views/functions still reference the non-existent `profiles` table
2. Column name mismatches (e.g., `kiosk_auth_user_id` doesn't exist, should be `kiosk_user_id`)
3. References to `user_id` when the column is actually `auth_user_id`

## Errors You Were Seeing
- **2 week email**: relation "public.profiles" does not exist
- **Mandatory Training**: column master_users.kiosk_auth_user_id does not exist
- **Complaints**: Error loading complaints
- **Calendar**: relation "profiles" does not exist
- **Schedules**: relation "public.profiles" does not exist

## Solutions Implemented

### 1. Frontend Fixes (admin-dashboard.html)
Fixed the following issues in the HTML file:
- Changed `kiosk_auth_user_id` to `kiosk_user_id` in training matrix query
- Fixed `user_id` references to use `auth_user_id` where appropriate
- Updated staff mapping to use correct column names from master_users

### 2. Database Fixes (SQL Scripts Created)

#### fix_database_references.sql
Creates database views that alias master_users as profiles and other expected tables, providing backward compatibility.

#### fix_specific_errors.sql
A more targeted script that:
- Creates a `profiles` view that maps to `master_users`
- Creates views for `two_week_email`, `schedules`, `holidays`, `holiday_approvals`
- Adds column aliases for backward compatibility (e.g., `user_id` as alias for `auth_user_id`)
- Grants appropriate permissions

## How to Apply the Fix

1. **Run the SQL migration in Supabase SQL Editor:**
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `fix_specific_errors.sql`
   - Run the script

2. **The admin-dashboard.html has already been updated** with the correct column references.

3. **Test the fixes** by:
   - Refreshing admin-dashboard
   - Checking that all sections load without errors
   - Running: `node test_database_fixes.js` to verify all views work

## What Changed

### Database Level
- Created views that map old table names to master_users
- Added column aliases for backward compatibility
- Fixed permission grants

### Application Level
- Updated column references from `kiosk_auth_user_id` to `kiosk_user_id`
- Fixed `user_id` references to use `auth_user_id`
- Updated training matrix queries to use correct columns

## Testing
After applying the SQL script, all the following should work:
- ✅ 2 week email section
- ✅ Mandatory Training section
- ✅ Complaints section
- ✅ Calendar section
- ✅ Schedules section
- ✅ All other admin dashboard sections

## Notes
- The `master_users` table is now the single source of truth
- The `profiles` view provides backward compatibility
- All user-related data should reference `master_users` going forward
- The views created are read-only aliases to master_users data