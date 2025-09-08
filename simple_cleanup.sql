-- Simple cleanup for benhowardmagic@hotmail.com
-- Just delete anything that matches the email or known values

-- 1. Delete from site_invites by email
DELETE FROM site_invites WHERE email = 'benhowardmagic@hotmail.com';

-- 2. Delete from profiles by user_id (UUID)
DELETE FROM profiles WHERE user_id = 'f3cc7af8-273f-4602-99a1-a87214ca89e1';

-- 3. Delete from staff_app_welcome by user_id (UUID)
DELETE FROM staff_app_welcome WHERE user_id = 'f3cc7af8-273f-4602-99a1-a87214ca89e1';

-- 4. Delete from kiosk_users by full_name (they used 'new name')
DELETE FROM kiosk_users WHERE full_name = 'new name';
DELETE FROM kiosk_users WHERE full_name = 'benhowardmagic';
DELETE FROM kiosk_users WHERE full_name = 'Ben Howard Magic';
DELETE FROM kiosk_users WHERE full_name = 'Test User';
DELETE FROM kiosk_users WHERE full_name ILIKE '%Ben Howard%';

-- 5. Delete from profiles by anything containing 'Ben Howard'
DELETE FROM profiles WHERE full_name ILIKE '%Ben Howard%';

-- 6. Delete from staff_app_welcome by anything containing 'Ben Howard'
DELETE FROM staff_app_welcome WHERE full_name ILIKE '%Ben Howard%';
DELETE FROM staff_app_welcome WHERE nickname ILIKE '%Ben Howard%';

-- 7. Delete from site_invites by anything containing 'Ben Howard'
DELETE FROM site_invites WHERE full_name ILIKE '%Ben Howard%';

-- 8. Delete from user_permissions by user_id (UUID)
DELETE FROM user_permissions WHERE user_id = 'f3cc7af8-273f-4602-99a1-a87214ca89e1';

-- 6. Delete from auth.identities
DELETE FROM auth.identities WHERE user_id = 'f3cc7af8-273f-4602-99a1-a87214ca89e1';

-- 7. Delete from auth.one_time_tokens
DELETE FROM auth.one_time_tokens WHERE user_id = 'f3cc7af8-273f-4602-99a1-a87214ca89e1';

-- 8. Delete the auth user itself
DELETE FROM auth.users WHERE email = 'benhowardmagic@hotmail.com';

-- That's it! Simple and straightforward.