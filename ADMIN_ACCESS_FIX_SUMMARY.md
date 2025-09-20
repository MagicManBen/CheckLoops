# Admin Access Issue - Root Cause & Fix

## Problem
User `benhowardmagic@hotmail.com` shows as "Staff" instead of "Admin" and cannot access admin pages.

## Root Cause
The `master_users` table has TWO separate fields for roles:
1. **`role`** - Currently set to "staff"
2. **`access_type`** - Needs to be "admin" or "owner"

**The frontend (admin-dashboard.html) checks `access_type` field for 'admin' or 'owner'**
**The RLS policies were checking `role = 'admin'`**

This mismatch caused:
- Frontend showing "Staff" badge (reads from `role` field)
- Admin dashboard denying access (checks `access_type` field)
- RLS policies blocking data (check `role` field)

## Solution

### Step 1: Run Diagnostic
First, run `diagnose_admin_issue.sql` to see the current state:
```sql
-- This will show:
-- • Current role and access_type values
-- • Auth user ID mapping
-- • Which RLS policies need fixing
```

### Step 2: Apply Fix
Run `fix_admin_access.sql` which:
1. **Updates the user record:**
   - Sets `role = 'admin'`
   - Sets `access_type = 'admin'`
   - Fixes auth_user_id mapping if needed

2. **Fixes ALL RLS policies to check BOTH fields:**
   ```sql
   -- Old (broken):
   WHERE role = 'admin'

   -- New (fixed):
   WHERE role = 'admin' OR access_type = 'admin'
   ```

3. **Updates policies for:**
   - `master_users`
   - `2_staff_entitlements`
   - `complaints`
   - `meetings`
   - `training_records`
   - `achievements`
   - Storage buckets (`pir_templates`)

## Quick Fix Commands

Run these in your Supabase SQL Editor:

```sql
-- 1. Quick fix for the user
UPDATE public.master_users
SET role = 'admin', access_type = 'admin'
WHERE email = 'benhowardmagic@hotmail.com';

-- 2. Verify it worked
SELECT email, role, access_type
FROM public.master_users
WHERE email = 'benhowardmagic@hotmail.com';
```

## After Fix
- User will show "Admin" badge in navbar
- Admin dashboard will grant access
- All admin-only data will be accessible
- RLS policies will properly allow admin operations

## Prevention
Going forward, when setting admin users:
- ALWAYS set both `role` and `access_type` to 'admin'
- Ensure RLS policies check both fields
- Consider consolidating to a single field in future refactor