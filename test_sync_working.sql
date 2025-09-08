-- Test script to verify the sync is working
-- Run this AFTER running fix_staff_kiosk_sync.sql

-- Step 1: Update Ben Howard's role in staff_app_welcome
UPDATE staff_app_welcome 
SET role_detail = 'Pharmacist',
    team_name = 'Pharmacy Team',
    updated_at = NOW()
WHERE full_name ILIKE '%ben%howard%';

-- Step 2: Wait a moment for trigger to fire, then check both tables
-- (You may need to run this query a few seconds after the UPDATE)
SELECT 
    'staff_app_welcome' as table_name,
    full_name,
    role_detail as role,
    team_name,
    updated_at::text as last_change
FROM staff_app_welcome 
WHERE full_name ILIKE '%ben%howard%'

UNION ALL

SELECT 
    'kiosk_users' as table_name,
    full_name,
    role,
    team_name,
    created_at::text as last_change
FROM kiosk_users 
WHERE full_name ILIKE '%ben%howard%'

ORDER BY table_name;

-- Step 3: If sync worked, both should show "Pharmacist" and "Pharmacy Team"