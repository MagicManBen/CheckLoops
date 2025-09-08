-- FIXED cleanup for benhowardmagic@hotmail.com
-- Handles the rooms foreign key issue properly

-- IMPORTANT: Clear room occupancy FIRST before deleting kiosk_users
-- This prevents the CASCADE from trying to null site_id
UPDATE rooms 
SET occupied_by = NULL 
WHERE occupied_by IN (
  SELECT id FROM kiosk_users 
  WHERE full_name = 'new name' 
     OR full_name = 'benhowardmagic' 
     OR full_name = 'Ben Howard Magic' 
     OR full_name = 'Test User'
     OR full_name ILIKE '%Ben Howard%'
);

-- Now we can safely delete in the correct order

-- 1. Delete from team_members (references kiosk_users.id)
DELETE FROM team_members WHERE user_id IN (
  SELECT id FROM kiosk_users 
  WHERE full_name = 'new name' 
     OR full_name = 'benhowardmagic' 
     OR full_name = 'Ben Howard Magic' 
     OR full_name = 'Test User'
     OR full_name ILIKE '%Ben Howard%'
);

-- 2. Delete from kiosk_users (now safe since rooms.occupied_by is cleared)
DELETE FROM kiosk_users WHERE full_name = 'new name';
DELETE FROM kiosk_users WHERE full_name = 'benhowardmagic';
DELETE FROM kiosk_users WHERE full_name = 'Ben Howard Magic';
DELETE FROM kiosk_users WHERE full_name = 'Test User';
DELETE FROM kiosk_users WHERE full_name ILIKE '%Ben Howard%';

-- 3. Delete from site_invites
DELETE FROM site_invites WHERE email = 'benhowardmagic@hotmail.com';
DELETE FROM site_invites WHERE full_name ILIKE '%Ben Howard%';

-- 4. Delete from profiles (references auth.users.id)
DELETE FROM profiles WHERE user_id = 'f3cc7af8-273f-4602-99a1-a87214ca89e1';
DELETE FROM profiles WHERE full_name ILIKE '%Ben Howard%';

-- 5. Delete from staff_app_welcome (references auth.users.id)
DELETE FROM staff_app_welcome WHERE user_id = 'f3cc7af8-273f-4602-99a1-a87214ca89e1';
DELETE FROM staff_app_welcome WHERE full_name ILIKE '%Ben Howard%';
DELETE FROM staff_app_welcome WHERE nickname ILIKE '%Ben Howard%';

-- 6. Delete from user_permissions
DELETE FROM user_permissions WHERE user_id = 'f3cc7af8-273f-4602-99a1-a87214ca89e1';

-- 7. Delete from auth tables
DELETE FROM auth.identities WHERE user_id = 'f3cc7af8-273f-4602-99a1-a87214ca89e1';
DELETE FROM auth.one_time_tokens WHERE user_id = 'f3cc7af8-273f-4602-99a1-a87214ca89e1';

-- 8. Finally delete the auth user
DELETE FROM auth.users WHERE email = 'benhowardmagic@hotmail.com';

-- Done! The key was clearing rooms.occupied_by FIRST