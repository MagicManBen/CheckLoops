-- SAFER cleanup for benhowardmagic@hotmail.com
-- Handle foreign key constraints by cleaning child tables first

-- STEP 1: Clean up child tables and references first (no constraints)
DELETE FROM site_invites WHERE email = 'benhowardmagic@hotmail.com';
DELETE FROM site_invites WHERE full_name ILIKE '%Ben Howard%';

DELETE FROM user_permissions WHERE user_id = 'f3cc7af8-273f-4602-99a1-a87214ca89e1';

DELETE FROM auth.one_time_tokens WHERE user_id = 'f3cc7af8-273f-4602-99a1-a87214ca89e1';

DELETE FROM auth.identities WHERE user_id = 'f3cc7af8-273f-4602-99a1-a87214ca89e1';

-- STEP 2: Clean up main user tables (handle constraints)
DELETE FROM profiles WHERE user_id = 'f3cc7af8-273f-4602-99a1-a87214ca89e1';
DELETE FROM profiles WHERE full_name ILIKE '%Ben Howard%';

DELETE FROM staff_app_welcome WHERE user_id = 'f3cc7af8-273f-4602-99a1-a87214ca89e1';
DELETE FROM staff_app_welcome WHERE full_name ILIKE '%Ben Howard%';
DELETE FROM staff_app_welcome WHERE nickname ILIKE '%Ben Howard%';

-- STEP 3: Update any rooms that might reference this user (clear the reference instead of deleting)
UPDATE rooms SET occupied_by = NULL WHERE occupied_by IN (
  SELECT id FROM kiosk_users WHERE full_name IN ('new name', 'benhowardmagic', 'Ben Howard Magic', 'Test User') OR full_name ILIKE '%Ben Howard%'
);

-- STEP 4: Clear any team_members references (bigint IDs)
DELETE FROM team_members WHERE user_id IN (
  SELECT id FROM kiosk_users WHERE full_name IN ('new name', 'benhowardmagic', 'Ben Howard Magic', 'Test User') OR full_name ILIKE '%Ben Howard%'
);

-- STEP 5: Now safe to delete from kiosk_users
DELETE FROM kiosk_users WHERE full_name = 'new name';
DELETE FROM kiosk_users WHERE full_name = 'benhowardmagic';
DELETE FROM kiosk_users WHERE full_name = 'Ben Howard Magic';
DELETE FROM kiosk_users WHERE full_name = 'Test User';
DELETE FROM kiosk_users WHERE full_name ILIKE '%Ben Howard%';

-- STEP 6: Finally delete the auth user
DELETE FROM auth.users WHERE email = 'benhowardmagic@hotmail.com';

-- Done - this should handle foreign key constraints properly!