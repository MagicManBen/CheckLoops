-- Fix the invitation status for John Smith
-- The invitation was incorrectly marked as 'accepted' without creating a user account

-- Update the invitation to 'pending' status so it can be properly accepted
UPDATE site_invites 
SET status = 'pending',
    updated_at = NOW()
WHERE email = 'benhowardmagic@hotmail.com'
  AND full_name = 'John Smith';

-- Verify the update
SELECT 
    email,
    full_name,
    role,
    status,
    created_at,
    expires_at
FROM site_invites 
WHERE email = 'benhowardmagic@hotmail.com';

-- Check if there's a user account (should be none)
SELECT 
    'auth.users' as table_name,
    count(*) as records
FROM auth.users 
WHERE email = 'benhowardmagic@hotmail.com'
UNION ALL
SELECT 
    'profiles',
    count(*)
FROM profiles 
WHERE full_name = 'John Smith'
UNION ALL
SELECT 
    'kiosk_users',
    count(*)
FROM kiosk_users 
WHERE full_name = 'John Smith';