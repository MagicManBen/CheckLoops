# User Loading Issue Fix

## Problem Summary

The Users page in admin-dashboard.html is not loading users because the `loadPracticeUsers()` function depends on `ctx.site_id` which comes from the authenticated user's profile in the `master_users` table. If the user doesn't exist in this table or doesn't have a `site_id`, no users will load.

## Root Cause Analysis

1. **Authentication Flow**: User logs in → `loadContext()` queries `master_users` table → Sets `ctx.site_id` → `loadPracticeUsers()` uses `ctx.site_id`

2. **Failure Point**: If the authenticated user doesn't have a record in `master_users` table, `ctx.site_id` will be null/undefined

3. **Symptom**: Users page shows "No site selected - Debug: ctx.site_id is null/undefined"

## Quick Diagnosis

1. Open browser console on admin-dashboard.html
2. Check the debug messages added to the code:
   ```javascript
   // Look for these debug messages:
   DEBUG: loadPracticeUsers called - ctx: {...}
   DEBUG: ctx.site_id: null
   DEBUG: No site_id found in context
   ```

## Solution Options

### Option 1: Browser Console Fix (Immediate)

1. Open admin-dashboard.html in browser
2. Open browser console (F12)
3. Copy and paste the content of `fix-users-issue.js` into the console
4. Press Enter to run the fix script

### Option 2: SQL Database Fix (Direct)

1. Open Supabase SQL Editor
2. Run the diagnostic queries from `sql-diagnostics.sql`
3. Identify missing user records
4. Create the missing records with the provided INSERT statements

### Option 3: Manual SQL Fix (Most Direct)

Replace `YOUR_EMAIL_HERE` and `YOUR_AUTH_USER_ID_HERE` with actual values:

```sql
-- 1. Find your auth user ID
SELECT id, email FROM auth.users WHERE email = 'YOUR_EMAIL_HERE';

-- 2. Create master_users record
INSERT INTO master_users (
    auth_user_id,
    email,
    full_name,
    access_type,
    role,
    site_id,
    active,
    created_at,
    updated_at
) VALUES (
    'YOUR_AUTH_USER_ID_HERE',
    'YOUR_EMAIL_HERE',
    'Your Full Name',
    'admin',
    'admin',
    'MAIN_SITE',
    true,
    now(),
    now()
);
```

## Files Modified

1. **admin-dashboard.html** - Added debug logging to `loadPracticeUsers()` and `loadContext()` functions
2. **debug-users.html** - Created standalone debug page
3. **fix-users-issue.js** - Automated fix script for browser console
4. **sql-diagnostics.sql** - Comprehensive SQL diagnostics and fixes

## Prevention

To prevent this issue in the future:

1. Ensure new users are automatically added to `master_users` table during registration
2. Add proper error handling for missing user profiles
3. Consider adding a fallback default site_id for admin users

## Testing

After applying the fix:

1. Refresh the admin dashboard page
2. Navigate to Users page
3. Users should now load properly
4. Check browser console for successful debug messages

## Verification

The fix is successful when:
- Users page no longer shows "No site selected"
- `ctx.site_id` has a valid value (check console)
- Users list displays actual user records
- No errors in browser console

## Rollback

If needed, remove the debug logging by reverting the changes to:
- Line 12646-12653 in admin-dashboard.html (loadPracticeUsers debug logs)
- Line 14109-14116 in admin-dashboard.html (loadContext debug logs)