-- Comprehensive verification script for John Smith (benhowardmagic@hotmail.com)
-- This will check data consistency across all relevant Supabase tables

-- 1. Check auth.users table for the account
SELECT 'auth.users' as table_name, 
       id, 
       email, 
       email_confirmed_at,
       created_at,
       updated_at
FROM auth.users 
WHERE email = 'benhowardmagic@hotmail.com';

-- 2. Check profiles table for user profile data
SELECT 'profiles' as table_name,
       user_id,
       full_name,
       role_type,
       created_at,
       updated_at
FROM profiles 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'benhowardmagic@hotmail.com');

-- 3. Check site_invites table for invitation record
SELECT 'site_invites' as table_name,
       id,
       email,
       full_name,
       role_type,
       status,
       accepted_at,
       created_at
FROM site_invites 
WHERE email = 'benhowardmagic@hotmail.com';

-- 4. Check staff_app_welcome table for welcome flow data
SELECT 'staff_app_welcome' as table_name,
       user_id,
       full_name,
       nickname,
       step_completed,
       created_at,
       updated_at
FROM staff_app_welcome 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'benhowardmagic@hotmail.com');

-- 5. Check kiosk_users table for operational user record
SELECT 'kiosk_users' as table_name,
       id,
       full_name,
       created_at,
       updated_at
FROM kiosk_users 
WHERE full_name IN ('John Smith', 'benhowardmagic', 'Ben Howard Magic', 'Test User')
   OR full_name ILIKE '%john smith%'
   OR full_name ILIKE '%ben howard%';

-- 6. Check team_members table for any team associations
SELECT 'team_members' as table_name,
       tm.id,
       tm.user_id,
       ku.full_name,
       tm.created_at
FROM team_members tm
JOIN kiosk_users ku ON tm.user_id = ku.id
WHERE ku.full_name IN ('John Smith', 'benhowardmagic', 'Ben Howard Magic', 'Test User')
   OR ku.full_name ILIKE '%john smith%'
   OR ku.full_name ILIKE '%ben howard%';

-- 7. Check user_permissions table for any permissions
SELECT 'user_permissions' as table_name,
       user_id,
       permission_type,
       granted_by,
       created_at
FROM user_permissions 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'benhowardmagic@hotmail.com');

-- 8. Summary count across all tables
SELECT 
  'SUMMARY' as check_type,
  (SELECT COUNT(*) FROM auth.users WHERE email = 'benhowardmagic@hotmail.com') as auth_users_count,
  (SELECT COUNT(*) FROM profiles WHERE user_id = (SELECT id FROM auth.users WHERE email = 'benhowardmagic@hotmail.com')) as profiles_count,
  (SELECT COUNT(*) FROM site_invites WHERE email = 'benhowardmagic@hotmail.com') as site_invites_count,
  (SELECT COUNT(*) FROM staff_app_welcome WHERE user_id = (SELECT id FROM auth.users WHERE email = 'benhowardmagic@hotmail.com')) as staff_welcome_count,
  (SELECT COUNT(*) FROM kiosk_users WHERE full_name ILIKE '%john smith%' OR full_name ILIKE '%ben howard%' OR full_name IN ('benhowardmagic', 'Ben Howard Magic', 'Test User')) as kiosk_users_count;

-- 9. Check for data consistency issues
SELECT 'CONSISTENCY_CHECK' as check_type,
  CASE 
    WHEN (SELECT COUNT(*) FROM auth.users WHERE email = 'benhowardmagic@hotmail.com') = 0 
    THEN 'ERROR: No auth.users record found'
    WHEN (SELECT COUNT(*) FROM profiles WHERE user_id = (SELECT id FROM auth.users WHERE email = 'benhowardmagic@hotmail.com')) = 0
    THEN 'ERROR: No profiles record found'
    WHEN (SELECT COUNT(*) FROM site_invites WHERE email = 'benhowardmagic@hotmail.com') = 0
    THEN 'WARNING: No site_invites record found'
    WHEN (SELECT COUNT(*) FROM staff_app_welcome WHERE user_id = (SELECT id FROM auth.users WHERE email = 'benhowardmagic@hotmail.com')) = 0
    THEN 'WARNING: No staff_app_welcome record found'
    ELSE 'OK: Core tables have records'
  END as status_message;