-- Fix complaints table to show existing data in the correct site
-- This script moves complaints from site_id 1 to site_id 2

-- First, let's see what we have
SELECT 'Before update:' as status, site_id, count(*) as complaint_count 
FROM complaints 
GROUP BY site_id 
ORDER BY site_id;

-- Update all complaints from site_id 1 to site_id 2
UPDATE complaints 
SET site_id = 2 
WHERE site_id = 1;

-- Verify the update
SELECT 'After update:' as status, site_id, count(*) as complaint_count 
FROM complaints 
GROUP BY site_id 
ORDER BY site_id;

-- Show a sample of the updated complaints
SELECT id, site_id, datetime, patient_initials, category, status, priority, 
       left(original_complaint, 100) as complaint_preview
FROM complaints 
WHERE site_id = 2 
ORDER BY datetime DESC 
LIMIT 10;
