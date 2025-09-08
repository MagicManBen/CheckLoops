-- Quick check to see Ben Howard's current data in staff_app_welcome
-- Run this first to see what data we're syncing FROM

SELECT 
    'staff_app_welcome' as source,
    user_id,
    site_id,
    full_name,
    role_detail,
    team_id,
    team_name,
    created_at,
    updated_at
FROM staff_app_welcome 
WHERE full_name ILIKE '%ben%howard%' 
   OR full_name ILIKE '%ben%'
   OR user_id IN (
       SELECT user_id FROM profiles WHERE full_name ILIKE '%ben%'
   )
ORDER BY updated_at DESC;

-- If no results, let's see all staff_app_welcome records:
-- SELECT * FROM staff_app_welcome ORDER BY updated_at DESC LIMIT 5;