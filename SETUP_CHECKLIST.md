# 🚀 CheckLoops Demo Site - Final Setup Checklist

## ✅ Completed
- [x] Demo user created in Supabase Auth
- [x] Landing page redesigned with colorful icons
- [x] Demo button implemented with auto-login
- [x] Icons changed from emoji to Iconify (MDI library)
- [x] CSP updated to allow Iconify CDN
- [x] master_users entry created for demo user
- [x] Setup scripts and SQL files created

## 🔲 Todo (Complete these steps)

### 1. Run Quick Start SQL (REQUIRED - EASIEST!)
**Option A - Quick Start (Recommended):**
Open Supabase SQL Editor and run the file: `QUICK_START.sql`

This does everything you need:
- Creates demo site (ID: 1)
- Links demo user to site
- Verifies setup

**Option B - Full Setup (More Data):**
Run the file: `setup-demo-site.sql` in Supabase SQL Editor
This creates:
- Demo site (ID: 1)
- Sample rooms
- Sample check types  
- Sample equipment with QR codes
- Site settings

### 3. Test the Landing Page
1. Open `icon-test.html` first to verify icons work
2. Then open `LandingPage.html`
3. Click "Access Demo Site Instantly!"
4. Should redirect to staff.html logged in as demo user

### 4. Verify Demo Access
Once logged in, check:
- [ ] Can see demo site name
- [ ] Can navigate to different sections
- [ ] Can see sample data
- [ ] Holiday management works
- [ ] Equipment checks are visible
- [ ] No errors in browser console

## 📝 Quick Commands

### Test Icons
```bash
open icon-test.html
```

### Open Landing Page
```bash
open LandingPage.html
```

### Re-run Demo User Setup (if needed)
```bash
node setup-demo-user.js
```

## 🔍 Verification Queries

Run these in Supabase SQL Editor to verify setup:

### Check Demo User
```sql
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  m.full_name,
  m.site_id,
  m.active
FROM auth.users u
LEFT JOIN master_users m ON u.id = m.auth_user_id
WHERE u.email = 'demo@checkloops.com';
```

### Check Site Link
```sql
SELECT 
  tm.user_id,
  tm.site_id,
  s.name as site_name
FROM team_members tm
JOIN sites s ON tm.site_id = s.id
WHERE tm.user_id = 'ff698b68-662a-43c8-9e3f-6096d5a4fa25';
```

### Check Demo Site Data
```sql
SELECT 
  'Rooms' as type, COUNT(*)::text as count FROM rooms WHERE site_id = 1
UNION ALL
SELECT 'Check Types', COUNT(*)::text FROM check_types WHERE site_id = 1
UNION ALL
SELECT 'Items', COUNT(*)::text FROM items WHERE site_id = 1;
```

## ⚠️ Troubleshooting

### Issue: Icons not showing
**Solution**: 
- Check browser console for CSP errors
- Ensure internet connection (Iconify needs CDN)
- Try opening icon-test.html first
- Clear browser cache

### Issue: Demo login fails
**Solution**:
- Verify user exists: Check "Demo User" query above
- Confirm password is correct: `DemoCheckLoops2024!`
- Check Supabase project is active
- Look for errors in browser console

### Issue: No data after login
**Solution**:
- Run setup-demo-site.sql
- Verify team_members link exists
- Check site ID 1 exists in sites table
- Run "Demo Site Data" query above

### Issue: Can't access features
**Solution**:
- Check master_users.active = true
- Verify site_id is set in master_users
- Ensure team_members link exists
- Check holiday_approved is true (if needed)

## 📋 Files Reference

### Main Files
- `LandingPage.html` - Updated landing page with demo button
- `staff.html` - Target page after demo login

### Setup Files
- `setup-demo-user.js` - Creates demo user (already run ✅)
- `setup-demo-site.sql` - Creates demo site data (needs to run)
- `quick-link-demo-user.sql` - Quick user-site link (needs to run)

### Utility Files
- `icon-test.html` - Test if icons work
- `demo-auth.js` - Demo auth utilities (loaded by landing page)

### Documentation
- `DEMO_SETUP_INSTRUCTIONS.md` - Detailed setup guide
- `LANDING_PAGE_SUMMARY.md` - Summary of changes
- `SETUP_CHECKLIST.md` - This file

## 🎯 Success Criteria

You'll know it's working when:
1. ✅ Icons show colorful MDI icons (not emoji)
2. ✅ Green "Access Demo Site Instantly!" button visible
3. ✅ Clicking button shows "Logging in..." then "Success!"
4. ✅ Redirects to staff.html
5. ✅ Shows demo site data
6. ✅ Can navigate all features

## 📞 Next Steps After Setup

1. **Test thoroughly** - Try all features as demo user
2. **Add more data** - Create additional sample items
3. **Customize** - Update demo site name/branding
4. **Monitor** - Track demo usage and conversions
5. **Reset** - Set up periodic demo data reset

## 🎉 You're Almost There!

Just need to:
1. Run the SQL in step 1 (team_members link)
2. Run setup-demo-site.sql (demo data)
3. Test the landing page

That's it! The hard work is done. 🚀
