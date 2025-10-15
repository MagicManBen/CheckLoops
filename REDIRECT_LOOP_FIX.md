# 🔧 REDIRECT LOOP - FIXED!

## The Problem
When you clicked "Access Demo Site Instantly!", it bounced between login and staff.html repeatedly.

## Root Cause
The `requireStaffSession()` function in `staff-common.js` checks for valid roles:
```javascript
const allowed = ['staff', 'admin', 'owner', 'manager', 'member', 'user'];
```

Your demo user was missing **BOTH** of these critical fields:
- `role` 
- `access_type`

When both are null/missing, it throws `NOT_STAFF` error → redirect to login → login succeeds → redirect to staff.html → checks role → fails → repeat!

## The Fix

Run this SQL: **`FIX_REDIRECT_LOOP.sql`**

It sets BOTH fields:
```sql
UPDATE master_users
SET 
  role = 'staff',
  access_type = 'staff',  -- CRITICAL!
  site_id = 1,
  active = true
WHERE email = 'demo@checkloops.com';
```

## How to Fix It Now

### Option 1: Quick Fix (Recommended)
Run **`FIX_REDIRECT_LOOP.sql`** in Supabase SQL Editor

### Option 2: Diagnostic First
1. Run **`DIAGNOSTIC.sql`** to see what's missing
2. Then run **`FIX_REDIRECT_LOOP.sql`**

### Option 3: Updated Quick Start
The **`QUICK_START.sql`** file has been updated with the fix.
Run it again if you want.

## Expected Result

After running the fix SQL, you should see:
```
✅ SUCCESS: Demo user configured correctly!
```

Then:
1. Go to LandingPage.html
2. Click "Access Demo Site Instantly!"
3. Should load staff.html WITHOUT bouncing!

## Verify the Fix

Run this quick check:
```sql
SELECT 
  email,
  site_id,
  role,
  access_type,
  active
FROM master_users
WHERE email = 'demo@checkloops.com';
```

**Must show:**
- `site_id`: 1
- `role`: staff
- `access_type`: staff ← **CRITICAL**
- `active`: true

## Why Both Fields?

Looking at `staff-common.js` line 338:
```javascript
const role = profileRow?.access_type || profileRow?.role || meta?.role || ...
```

It checks `access_type` FIRST, then falls back to `role`.

Without either one, the user fails the role check and gets kicked out.

## Files Updated

✅ **FIX_REDIRECT_LOOP.sql** - Complete fix with verification (NEW)
✅ **QUICK_START.sql** - Updated to include access_type
✅ **DIAGNOSTIC.sql** - New diagnostic query (NEW)
✅ **REDIRECT_LOOP_FIX.md** - This file (NEW)

## Still Having Issues?

1. **Clear browser cache and localStorage**:
   - Open DevTools (F12)
   - Application tab → Local Storage → Clear all
   - Try again

2. **Check browser console**:
   - Look for `[requireStaffSession]` log messages
   - Should show role check passing

3. **Verify session**:
   ```javascript
   // In browser console after clicking demo button:
   localStorage.getItem('isDemoUser') // should be 'true'
   ```

4. **Still bouncing?**
   - Run DIAGNOSTIC.sql
   - Send me the output
   - Might be a different issue

## Test Checklist

- [ ] Run FIX_REDIRECT_LOOP.sql
- [ ] See "✅ SUCCESS" message
- [ ] Open LandingPage.html
- [ ] Click demo button
- [ ] Should stay on staff.html
- [ ] Should see "Welcome back, Demo User!"

That's it! The redirect loop should be completely fixed now. 🎉
