-- Check current data mismatch between staff_app_welcome and kiosk_users
-- Run this in Supabase SQL Editor to see the problem

-- 1. Show Ben Howard's data in staff_app_welcome
SELECT 
    'staff_app_welcome' as table_name,
    user_id,
    site_id,
    full_name,
    role_detail as role,
    team_id,
    team_name,
    created_at,
    updated_at
FROM staff_app_welcome 
WHERE full_name ILIKE '%ben%howard%' 
   OR full_name ILIKE '%ben%'
ORDER BY updated_at DESC;

-- 2. Show Ben Howard's data in kiosk_users  
SELECT 
    'kiosk_users' as table_name,
    id,
    site_id,
    full_name,
    role,
    team_id,
    team_name,
    created_at
FROM kiosk_users 
WHERE full_name ILIKE '%ben%howard%' 
   OR full_name ILIKE '%ben%'
ORDER BY created_at DESC;

-- 3. Check if sync triggers exist
SELECT 
    trigger_name, 
    event_manipulation, 
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name LIKE '%saw_sync%' 
   OR trigger_name LIKE '%staff_app_welcome%';

-- 4. Check if sync function exists
SELECT 
    routine_name, 
    routine_type, 
    security_type
FROM information_schema.routines 
WHERE routine_name LIKE '%saw_sync%';