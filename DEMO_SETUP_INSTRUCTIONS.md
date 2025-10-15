# Demo Site Setup Instructions for CheckLoops

This guide will help you set up a demo site with instant access for visitors.

## Quick Setup (Recommended)

### Option 1: Using the Node.js Script

1. **Run the setup script:**
   ```bash
   cd /Users/benhoward/Desktop/CheckLoop/checkloops
   node setup-demo-user.js
   ```

2. **Run the SQL setup:**
   - Open your Supabase Dashboard
   - Go to SQL Editor
   - Paste and run the contents of `setup-demo-site.sql`

3. **Test the demo:**
   - Open `LandingPage.html` in a browser
   - Click "Access Demo Site Instantly!"
   - You should be logged in automatically

### Option 2: Manual Setup via Supabase Dashboard

1. **Create the demo user:**
   - Go to: https://supabase.com/dashboard/project/unveoqnlqnobufhublyw/auth/users
   - Click "Add user" → "Create new user"
   - Email: `demo@checkloops.com`
   - Password: `DemoCheckLoops2024!`
   - Check "Auto Confirm User"
   - Click "Create user"
   - **Copy the User ID** - you'll need this!

2. **Run SQL to set up database entries:**
   - Go to SQL Editor
   - Replace `YOUR_DEMO_USER_AUTH_ID` in the SQL below with the User ID you copied
   - Run this SQL:

```sql
-- Insert demo site
INSERT INTO sites (id, name, address, postcode, phone, email)
VALUES (1, 'CheckLoops Demo Practice', '123 Demo Street', 'DE1 2MO', '01234567890', 'demo@checkloops.com')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Create master_users entry (replace YOUR_DEMO_USER_AUTH_ID)
INSERT INTO master_users (
  auth_user_id, full_name, email, phone, role, 
  is_admin, is_active, holiday_approved
)
VALUES (
  'YOUR_DEMO_USER_AUTH_ID', 
  'Demo User', 
  'demo@checkloops.com', 
  '01234567890', 
  'staff', 
  false, 
  true, 
  true
)
ON CONFLICT (auth_user_id) DO UPDATE SET 
  is_active = true, 
  holiday_approved = true;

-- Link user to site
INSERT INTO team_members (user_id, site_id, role, is_active)
VALUES ('YOUR_DEMO_USER_AUTH_ID', 1, 'staff', true)
ON CONFLICT (user_id, site_id) DO UPDATE SET is_active = true;
```

3. **Add sample data (optional but recommended):**
   - Run the full `setup-demo-site.sql` file for complete demo data

## What Gets Created

### Authentication
- **Email:** demo@checkloops.com
- **Password:** DemoCheckLoops2024!
- **Auto-confirmed** email address

### Database Entries
- **sites** table: Demo Practice (ID: 1)
- **master_users** table: Demo User profile
- **team_members** table: User linked to site 1
- **rooms** table: Sample rooms (Reception, Treatment Rooms, etc.)
- **check_types** table: Daily, weekly, monthly checks
- **items** table: Sample equipment with QR codes
- **site_settings** table: Demo mode enabled

### Demo Features Enabled
✅ Holiday management (approved)
✅ Equipment checks with QR codes
✅ CQC quizzes access
✅ Training tracking
✅ Full staff portal access

## How It Works

1. **User clicks "Access Demo Site Instantly!" button**
2. **Landing page automatically:**
   - Signs in with demo credentials
   - Sets demo flags in localStorage
   - Redirects to staff.html

3. **Demo user can:**
   - Browse all features
   - Submit checks
   - Request holidays
   - Take quizzes
   - View training records
   - **But cannot** modify critical site settings

## Testing the Demo

1. Open `LandingPage.html`
2. Click the green "Access Demo Site Instantly!" button
3. You should see "Logging in..." then "Success! Redirecting..."
4. The staff dashboard should load with demo data

## Troubleshooting

### "Demo login failed"
- Check that the demo user exists in Supabase Auth
- Verify email is `demo@checkloops.com`
- Ensure password is correct: `DemoCheckLoops2024!`
- Check browser console for specific error

### "No data showing"
- Run the `setup-demo-site.sql` to create sample data
- Verify demo user is linked to site ID 1 in team_members table
- Check that site ID 1 exists in sites table

### Icons not showing
- Check browser console for CSP errors
- Ensure you're serving the page (not just opening file://)
- Iconify CDN might be blocked - check network tab

### SQL Errors
- If you get foreign key errors, ensure site ID 1 exists first
- If user already exists, use `ON CONFLICT` clauses in SQL
- Check that the auth_user_id matches the actual user ID

## Security Notes

⚠️ **Important:** The demo user credentials are public. Do NOT:
- Give admin access to demo user
- Link demo user to real production sites
- Store sensitive data accessible to demo user

✅ **Best practices:**
- Demo user only has staff-level access
- Limited to site ID 1 only
- Can mark demo data clearly
- Can reset demo data periodically

## Resetting Demo Data

To reset the demo site to fresh state:

```sql
-- Clear demo submissions
DELETE FROM submissions WHERE site_id = 1;
DELETE FROM submission_rows WHERE submission_id IN (
  SELECT id FROM submissions WHERE site_id = 1
);

-- Clear demo holiday requests
DELETE FROM "4_holiday_requests" WHERE site_id = 1;

-- Reset demo quiz attempts
DELETE FROM quiz_attempts WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'demo@checkloops.com'
);

-- Re-run setup-demo-site.sql to recreate fresh data
```

## Next Steps

After setup:
1. Test all features in the demo
2. Add more sample data if needed
3. Customize the demo site name and branding
4. Set up automated demo reset (optional)
5. Monitor demo usage via analytics

## Support

If you encounter issues:
1. Check Supabase logs
2. Review browser console
3. Verify all SQL ran successfully
4. Check that auth user exists and is confirmed
