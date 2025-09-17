# PIN Setup Fix Instructions

## The Problem
The PIN setup wasn't working because:
1. The dropdown only showed users who already had a `kiosk_user_id`
2. Existing users don't have `kiosk_user_id` values
3. This created a chicken-and-egg problem where no one could set a PIN

## The Solution

### Step 1: Run the SQL Migration
Run the SQL in `fix_kiosk_complete.sql` in your Supabase SQL editor using the service role:

```sql
-- This will:
-- 1. Give all existing profiles a kiosk_user_id
-- 2. Fix the authentication function
-- 3. Ensure PIN sync between tables
-- 4. Specifically fix Ben Howard's account
```

### Step 2: Deploy the Updated indexIpad.html
The updated file now:
- Shows ALL profiles in the dropdown (not just those with kiosk_user_id)
- Creates a kiosk_user_id when setting a PIN if one doesn't exist
- Properly links submissions to user profiles
- Includes console logging for debugging

### Step 3: Test the Flow
1. Open http://127.0.0.1:50253/indexIpad.html
2. Login with benhowardmagic@hotmail.com / Hello1!
3. Click the + icon to set up PIN
4. **You should now see Ben Howard in the dropdown**
5. Select Ben Howard and enter a 4-digit PIN (e.g., 1234)
6. Save the PIN
7. Try logging in with the keypad using that PIN

### Step 4: Check Console for Debugging
Open browser console (F12) to see:
- What profiles are loaded in the dropdown
- Whether kiosk_user_id is created
- Authentication success/failure details

### Step 5: Verify in Supabase
After setting a PIN, check in Supabase:
1. **profiles table**: Should have `kiosk_user_id`, `pin_hash`, and `pin_hmac`
2. **kiosk_users table**: Should have a corresponding entry with same PIN hashes
3. **submissions table**: New submissions should have `staff_id`, `user_id`, and `submitted_by_user_id`

## If It Still Doesn't Work

Run this diagnostic query in Supabase:

```sql
-- Check Ben Howard's profile status
SELECT
    p.user_id,
    p.full_name,
    p.kiosk_user_id,
    p.pin_hmac,
    k.id as kiosk_id,
    k.pin_hmac as kiosk_pin_hmac
FROM profiles p
LEFT JOIN kiosk_users k ON k.id = p.kiosk_user_id
WHERE p.full_name LIKE '%Ben Howard%';

-- Check if authentication would work
SELECT * FROM authenticate_kiosk_user_with_profiles(
    [YOUR_SITE_ID], -- Replace with actual site_id
    '1234' -- Replace with the PIN you set
);
```

## Manual Fix (if needed)

If Ben Howard still doesn't have a kiosk_user_id:

```sql
-- Manually create kiosk_user_id for Ben Howard
DO $$
DECLARE
    v_user_id uuid;
    v_site_id bigint;
    v_new_id bigint;
BEGIN
    -- Get Ben's user_id
    SELECT id INTO v_user_id FROM auth.users
    WHERE email = 'benhowardmagic@hotmail.com';

    -- Get his site_id
    SELECT site_id INTO v_site_id FROM profiles
    WHERE user_id = v_user_id;

    -- Create kiosk_user_id
    SELECT COALESCE(MAX(id), 999) + 1 INTO v_new_id FROM kiosk_users;

    -- Insert into kiosk_users
    INSERT INTO kiosk_users (id, site_id, full_name, role, active)
    VALUES (v_new_id, v_site_id, 'Ben Howard', 'admin', true);

    -- Update profile
    UPDATE profiles
    SET kiosk_user_id = v_new_id
    WHERE user_id = v_user_id;

    RAISE NOTICE 'Created kiosk_user_id % for Ben Howard', v_new_id;
END $$;
```

## Expected Behavior After Fix

1. **PIN Setup**: Ben Howard appears in dropdown, can set PIN
2. **PIN Login**: Can login with 4-digit PIN on keypad
3. **Submissions**: Will be linked to Ben's user_id and show in "My Scans"
4. **Kiosk Users Table**: Will have entries for all users who set PINs