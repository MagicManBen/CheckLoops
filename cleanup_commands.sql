-- SQL commands to clean up benhowardmagic@hotmail.com from all tables
-- Run these in your Supabase SQL editor
-- Auth User ID (UUID): f3cc7af8-273f-4602-99a1-a87214ca89e1

-- 1. Clean up site_invites table (uses email)
DELETE FROM site_invites WHERE email = 'benhowardmagic@hotmail.com';

-- 2. Clean up profiles table (user_id is UUID)
DELETE FROM profiles WHERE user_id = 'f3cc7af8-273f-4602-99a1-a87214ca89e1';

-- 3. Clean up staff_app_welcome table (user_id is UUID)
DELETE FROM staff_app_welcome WHERE user_id = 'f3cc7af8-273f-4602-99a1-a87214ca89e1';

-- 4. Clean up team_members table FIRST (user_id is bigint referencing kiosk_users.id)
-- Note: team_members.user_id refers to kiosk_users.id, not auth.users.id
-- Must run this BEFORE deleting from kiosk_users
DELETE FROM team_members WHERE user_id IN (
  SELECT id FROM kiosk_users WHERE full_name IN ('new name', 'benhowardmagic', 'Ben Howard Magic', 'Test User')
);

-- 5. Clean up kiosk_users table (does NOT have user_id column, use full_name)
DELETE FROM kiosk_users WHERE full_name IN ('new name', 'benhowardmagic', 'Ben Howard Magic', 'Test User');

-- 6. Clean up user_permissions table (user_id is UUID)
DELETE FROM user_permissions WHERE user_id = 'f3cc7af8-273f-4602-99a1-a87214ca89e1';

-- 7. Clean up auth.identities table
DELETE FROM auth.identities WHERE user_id = 'f3cc7af8-273f-4602-99a1-a87214ca89e1';

-- 8. Clean up auth.one_time_tokens table
DELETE FROM auth.one_time_tokens WHERE user_id = 'f3cc7af8-273f-4602-99a1-a87214ca89e1';

-- 9. Finally, delete the auth user (this requires admin privileges)
-- You may need to do this manually in the Supabase dashboard
DELETE FROM auth.users WHERE id = 'f3cc7af8-273f-4602-99a1-a87214ca89e1';

-- Alternative: Delete by email if the above doesn't work
-- DELETE FROM auth.users WHERE email = 'benhowardmagic@hotmail.com';

-- Verification queries to check if cleanup was successful:
SELECT 'site_invites' as table_name, count(*) as remaining_records FROM site_invites WHERE email = 'benhowardmagic@hotmail.com'
UNION ALL
SELECT 'profiles', count(*) FROM profiles WHERE user_id = 'f3cc7af8-273f-4602-99a1-a87214ca89e1'
UNION ALL
SELECT 'staff_app_welcome', count(*) FROM staff_app_welcome WHERE user_id = 'f3cc7af8-273f-4602-99a1-a87214ca89e1'
UNION ALL
SELECT 'kiosk_users', count(*) FROM kiosk_users WHERE full_name IN ('new name', 'benhowardmagic', 'Ben Howard Magic', 'Test User')
UNION ALL
SELECT 'team_members', count(*) FROM team_members WHERE user_id = 'f3cc7af8-273f-4602-99a1-a87214ca89e1'
UNION ALL
SELECT 'auth.users', count(*) FROM auth.users WHERE id = 'f3cc7af8-273f-4602-99a1-a87214ca89e1';