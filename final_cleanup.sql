-- Simple direct cleanup - just delete the user data, don't touch rooms
-- Remove anything with benhowardmagic@hotmail.com OR containing "Ben Howard"

-- 1. Auth tables first
DELETE FROM auth.identities WHERE user_id = 'f3cc7af8-273f-4602-99a1-a87214ca89e1';
DELETE FROM auth.one_time_tokens WHERE user_id = 'f3cc7af8-273f-4602-99a1-a87214ca89e1';

-- 2. User tables
DELETE FROM user_permissions WHERE user_id = 'f3cc7af8-273f-4602-99a1-a87214ca89e1';
DELETE FROM profiles WHERE user_id = 'f3cc7af8-273f-4602-99a1-a87214ca89e1';
DELETE FROM profiles WHERE full_name ILIKE '%Ben Howard%';
DELETE FROM staff_app_welcome WHERE user_id = 'f3cc7af8-273f-4602-99a1-a87214ca89e1';
DELETE FROM staff_app_welcome WHERE full_name ILIKE '%Ben Howard%';
DELETE FROM staff_app_welcome WHERE nickname ILIKE '%Ben Howard%';

-- 3. Invites
DELETE FROM site_invites WHERE email = 'benhowardmagic@hotmail.com';
DELETE FROM site_invites WHERE full_name ILIKE '%Ben Howard%';

-- 4. Team members (needs to happen before kiosk_users)
DELETE FROM team_members WHERE user_id IN (
  SELECT id FROM kiosk_users 
  WHERE full_name = 'new name' 
     OR full_name = 'benhowardmagic' 
     OR full_name = 'Ben Howard Magic' 
     OR full_name = 'Test User'
     OR full_name ILIKE '%Ben Howard%'
);

-- 5. DON'T touch rooms - just leave any room assignments as-is
-- The kiosk_users will be deleted but rooms can keep the orphaned reference

-- 6. Kiosk users
DELETE FROM kiosk_users WHERE full_name = 'new name';
DELETE FROM kiosk_users WHERE full_name = 'benhowardmagic';  
DELETE FROM kiosk_users WHERE full_name = 'Ben Howard Magic';
DELETE FROM kiosk_users WHERE full_name = 'Test User';
DELETE FROM kiosk_users WHERE full_name ILIKE '%Ben Howard%';

-- 7. Finally the auth user
DELETE FROM auth.users WHERE email = 'benhowardmagic@hotmail.com';

-- Done!