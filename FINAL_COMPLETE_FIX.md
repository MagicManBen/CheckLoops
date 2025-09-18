# COMPLETE FIX FOR KIOSK SYSTEM

## The Problem
1. **Trigger Error**: The kiosk_users table has a trigger that calls `upsert_user_achievement` which doesn't exist
2. **Empty kiosk_users table**: No kiosk_users records exist even though profiles have kiosk_user_id values
3. **No synchronization**: Changes to profiles don't sync to kiosk_users
4. **PIN authentication fails**: Because kiosk_users table is empty

## THE COMPLETE FIX

### Step 1: Run the Complete Fix SQL

Go to Supabase SQL Editor and run the **entire contents** of `COMPLETE_FIX.sql`. This will:

1. Remove problematic triggers
2. Create stub function to prevent errors
3. Create ALL missing kiosk_users entries
4. Assign kiosk_user_id to profiles that don't have one
5. Fix authentication and PIN functions
6. Set up proper synchronization
7. Verify everything

**IMPORTANT**: Run the ENTIRE SQL file, not just parts of it!

### Step 2: Verify the Fix Worked

After running the SQL, you should see output like:
```
=== VERIFICATION RESULTS ===
Total profiles: 2
Total kiosk_users: 2
Profiles without kiosk_id: 0
Profiles with PIN: 2
Kiosk users with PIN: 2

Ben Howard: ID=46, Site=2, PIN Set=Yes
```

### Step 3: Test the System

#### Manual Test:
1. Go to http://127.0.0.1:58156/indexIpad.html
2. Login with benhowardmagic@hotmail.com / Hello1!
3. Click the + icon
4. **Ben Howard should appear in the dropdown**
5. Select Ben Howard, set PIN to 1234
6. Save it
7. Enter 1234 on the keypad
8. **You should reach the scanning screen!**

#### Automated Test:
```bash
# Install Playwright if not already installed
npm install playwright
npx playwright install chromium

# Run the complete test
node test_kiosk_flow.js
```

The test will:
- Login automatically
- Check PIN setup dropdown
- Set a PIN
- Test PIN authentication
- Verify database state
- Take screenshots

### Step 4: Verify Submissions Work

After PIN authentication works:
1. Click "Begin Audit"
2. Wait for scanning screen
3. The system will auto-advance to upload screen
4. Any scans will be linked to your user profile

## What This Fix Does

### Immediate Fixes:
- ✅ Removes broken triggers that prevent inserts
- ✅ Creates all missing kiosk_users entries
- ✅ Syncs PIN data between tables
- ✅ Fixes authentication function

### Long-term Fixes:
- ✅ Auto-assigns kiosk_user_id to new profiles
- ✅ Syncs changes between profiles and kiosk_users
- ✅ Ensures submissions are linked to users
- ✅ Makes PIN setup work for all users

## Files Created

1. **COMPLETE_FIX.sql** - The complete SQL migration (RUN THIS!)
2. **test_kiosk_flow.js** - Automated test script
3. **indexIpad.html** - Updated with fixes (already deployed)

## If Something Goes Wrong

Check the current state:
```bash
node check_supabase.js
```

This will show:
- Whether Ben Howard exists in profiles
- Whether he has a kiosk_user_id
- Whether kiosk_users table has entries
- Whether PINs are set

## Success Criteria

The system is working when:
1. ✅ Ben Howard appears in PIN setup dropdown
2. ✅ PIN can be set and saved
3. ✅ PIN authentication works on keypad
4. ✅ Submissions are linked to user profiles
5. ✅ "My Scans" shows user's submissions

## Run the Fix Now!

1. Copy the contents of `COMPLETE_FIX.sql`
2. Paste into Supabase SQL Editor
3. Run it
4. Test with the automated script or manually
5. The kiosk system will be fully functional!