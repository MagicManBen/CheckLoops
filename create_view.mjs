import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Note: This won't work with anon key, would need service role key
console.log('Note: Creating views requires admin access. The holiday_summary view should be created via Supabase dashboard SQL editor.');
console.log('\nSQL to execute:');
console.log(`
CREATE OR REPLACE VIEW public.holiday_summary AS
SELECT
    hp.id,
    hp.full_name,
    hp.role,
    hp.is_gp,
    hp.email,
    hp.created_at,
    hp.updated_at,
    hp.team_name,
    hp.user_id,
    hp.site_id,
    COALESCE(se.year, EXTRACT(year FROM now())::integer) AS year,
    COALESCE(se.override, CASE WHEN hp.is_gp THEN se.calculated_sessions ELSE se.calculated_hours END, 0) AS entitlement_hours,
    COALESCE(se.override, CASE WHEN hp.is_gp THEN se.calculated_sessions ELSE se.calculated_hours END, 0) AS entitlement_sessions,
    COALESCE((SELECT SUM(hr.total_days) FROM public."4_holiday_requests" hr WHERE hr.user_id = hp.user_id AND hr.status = 'approved' AND EXTRACT(year FROM hr.start_date) = COALESCE(se.year, EXTRACT(year FROM now())::integer)), 0) AS total_booked_hours,
    COALESCE((SELECT SUM(hr.total_days) FROM public."4_holiday_requests" hr WHERE hr.user_id = hp.user_id AND hr.status = 'approved' AND EXTRACT(year FROM hr.start_date) = COALESCE(se.year, EXTRACT(year FROM now())::integer)), 0) AS total_booked_sessions,
    COALESCE((SELECT SUM(hr.total_days) FROM public."4_holiday_requests" hr WHERE hr.user_id = hp.user_id AND hr.status = 'pending' AND EXTRACT(year FROM hr.start_date) = COALESCE(se.year, EXTRACT(year FROM now())::integer)), 0) AS total_requested_hours,
    COALESCE((SELECT SUM(hr.total_days) FROM public."4_holiday_requests" hr WHERE hr.user_id = hp.user_id AND hr.status = 'pending' AND EXTRACT(year FROM hr.start_date) = COALESCE(se.year, EXTRACT(year FROM now())::integer)), 0) AS total_requested_sessions,
    GREATEST(0, COALESCE(se.override, CASE WHEN hp.is_gp THEN se.calculated_sessions ELSE se.calculated_hours END, 0) - COALESCE((SELECT SUM(hr.total_days) FROM public."4_holiday_requests" hr WHERE hr.user_id = hp.user_id AND hr.status = 'approved' AND EXTRACT(year FROM hr.start_date) = COALESCE(se.year, EXTRACT(year FROM now())::integer)), 0)) AS remaining_hours,
    GREATEST(0, COALESCE(se.override, CASE WHEN hp.is_gp THEN se.calculated_sessions ELSE se.calculated_hours END, 0) - COALESCE((SELECT SUM(hr.total_days) FROM public."4_holiday_requests" hr WHERE hr.user_id = hp.user_id AND hr.status = 'approved' AND EXTRACT(year FROM hr.start_date) = COALESCE(se.year, EXTRACT(year FROM now())::integer)), 0)) AS remaining_sessions,
    now() AS last_calculated
FROM public."1_staff_holiday_profiles" hp
LEFT JOIN public."2_staff_entitlements" se ON se.staff_id = hp.id AND se.year = EXTRACT(year FROM now())::integer
WHERE hp.user_id IS NOT NULL;
`);

process.exit(0);