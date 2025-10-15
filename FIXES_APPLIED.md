# ⚡ FIXED - Ready to Test!

## What Was Wrong
1. **Type mismatch**: team_members.user_id is UUID not bigint
2. **Schema mismatch**: sites table doesn't have address, postcode, phone, email columns
3. **Missing columns**: Several columns referenced don't exist in actual schema

## What I Fixed
✅ Updated SQL to match actual database schema
✅ Removed references to non-existent columns
✅ Fixed UUID vs bigint type issues
✅ Simplified the setup process

## 🚀 Quick Start (Do This Now!)

### Step 1: Run This SQL
1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/unveoqnlqnobufhublyw/sql
2. Copy and paste the entire contents of **`QUICK_START.sql`**
3. Click "Run"

### Step 2: Test It
1. Open `LandingPage.html` in your browser
2. Click the green **"Access Demo Site Instantly!"** button
3. You should be logged in and redirected to staff.html

## 📄 Files to Use

### Use These (Fixed):
- ✅ **QUICK_START.sql** - Minimal setup (use this first!)
- ✅ **setup-demo-site.sql** - Full setup with sample data (updated)
- ✅ **quick-link-demo-user.sql** - Quick user link (updated)

### These Still Work:
- ✅ **LandingPage.html** - Your landing page (working!)
- ✅ **icon-test.html** - Test if icons load
- ✅ **setup-demo-user.js** - Already ran successfully ✅

## 🔍 What QUICK_START.sql Does

```sql
-- 1. Creates demo site (ID: 1)
INSERT INTO sites (id, name, city, created_at)
VALUES (1, 'CheckLoops Demo Practice', 'Demo City', NOW());

-- 2. Links demo user to site
UPDATE master_users
SET site_id = 1, active = true
WHERE email = 'demo@checkloops.com';

-- 3. Shows you it worked
SELECT * FROM sites WHERE id = 1;
SELECT * FROM master_users WHERE email = 'demo@checkloops.com';
```

## Expected Results

After running QUICK_START.sql, you should see:

```
status          | id      | name
----------------|---------|----------------------------------
Site Created    | 1       | CheckLoops Demo Practice
User Linked     | ff69... | Demo User → Site 1
```

If you see both rows, you're ready to test!

## 🎯 Test Checklist

1. [ ] Run QUICK_START.sql in Supabase
2. [ ] See 2 rows in the results (site and user)
3. [ ] Open LandingPage.html
4. [ ] Click "Access Demo Site Instantly!"
5. [ ] See "Logging in..." then "Success! Redirecting..."
6. [ ] Land on staff.html logged in as demo user

## ⚠️ If It Still Doesn't Work

### Check the user is linked:
```sql
SELECT 
  auth_user_id::text,
  full_name,
  email,
  site_id,
  active
FROM master_users
WHERE email = 'demo@checkloops.com';
```

Should show:
- `site_id`: 1
- `active`: true

### Check the site exists:
```sql
SELECT * FROM sites WHERE id = 1;
```

Should show: CheckLoops Demo Practice

### Check browser console:
- Open browser developer tools (F12)
- Click demo button
- Look for errors in Console tab

## 📝 Common Issues

### "No site found"
→ Run QUICK_START.sql again

### "User not found"  
→ Demo user was created successfully, just needs site link
→ Run QUICK_START.sql

### "Permission denied"
→ Check you're using the Service Role key for setup
→ Regular user should be able to login after setup

### Icons blank
→ Open icon-test.html first to verify Iconify loads
→ Check internet connection (needs CDN)
→ Clear browser cache

## 🎉 That's It!

You're literally one SQL script away from having a working demo!

Just run **QUICK_START.sql** and test.
