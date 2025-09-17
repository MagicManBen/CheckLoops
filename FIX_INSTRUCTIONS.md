# FIX INSTRUCTIONS - MUST RUN THIS FIRST!

## The Problem Found
After checking your Supabase database with the service key, I found:
- Ben Howard's profile has `kiosk_user_id = 46` and PIN is set
- Tom Donlan's profile has `kiosk_user_id = 47`
- **BUT the kiosk_users table is EMPTY!**
- This is why PIN authentication is failing

## Immediate Fix Required

### Option 1: Run the Simple Fix (Recommended)
1. Go to Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `simple_fix.sql`
4. Run it
5. You should see Ben Howard and Tom Donlan added to kiosk_users table

### Option 2: Run These Commands Directly
If the simple_fix.sql has issues, run these commands one by one:

```sql
-- Create Ben Howard's kiosk_user entry
INSERT INTO kiosk_users (id, site_id, full_name, role, active, created_at)
VALUES (46, 2, 'Ben Howard', 'Manager', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Create Tom Donlan's kiosk_user entry
INSERT INTO kiosk_users (id, site_id, full_name, role, active, created_at)
VALUES (47, 2, 'Tom Donlan', 'staff', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Copy PIN data from profiles to kiosk_users
UPDATE kiosk_users k
SET
    pin_hash = p.pin_hash,
    pin_hmac = p.pin_hmac
FROM profiles p
WHERE k.id = p.kiosk_user_id
AND k.id IN (46, 47);

-- Verify it worked
SELECT * FROM kiosk_users;
```

### Option 3: If Triggers Are Blocking You
If you get an error about `upsert_user_achievement` function, run:

```sql
-- Temporarily disable triggers
ALTER TABLE kiosk_users DISABLE TRIGGER ALL;

-- Insert the data
INSERT INTO kiosk_users (id, site_id, full_name, role, active)
VALUES
  (46, 2, 'Ben Howard', 'Manager', true),
  (47, 2, 'Tom Donlan', 'staff', true);

-- Copy PIN data
UPDATE kiosk_users k
SET pin_hash = p.pin_hash, pin_hmac = p.pin_hmac
FROM profiles p
WHERE k.id = p.kiosk_user_id;

-- Re-enable triggers
ALTER TABLE kiosk_users ENABLE TRIGGER ALL;
```

## After Running the Fix

1. **Check kiosk_users table**: Should have 2 entries (Ben and Tom)
2. **Test PIN login**:
   - Go to http://127.0.0.1:50253/indexIpad.html
   - Login with benhowardmagic@hotmail.com / Hello1!
   - Enter the PIN you previously set on the keypad
   - It should now work!

## If You Need to Reset Your PIN

After running the fix above:
1. Click the + icon
2. Select "Ben Howard" from dropdown
3. Enter a new 4-digit PIN (e.g., 1234)
4. Save it
5. Test login with the keypad

## Why This Happened

The system was storing `kiosk_user_id` values in the profiles table but not creating the corresponding records in the kiosk_users table. The authentication function requires both to exist and match.