-- Test query to verify that new invitations immediately created kiosk_users records
-- Run this AFTER creating a new invitation

SELECT 'AFTER INVITATION - Current kiosk_users count:' as status, COUNT(*) as count 
FROM public.kiosk_users 
WHERE site_id = 2;

-- Show current kiosk_users for site_id = 2 (should include the new one)
SELECT 'AFTER INVITATION - Recent kiosk_users:' as status, 
       id, full_name, role, active, reports_to_id, created_at
FROM public.kiosk_users 
WHERE site_id = 2
ORDER BY created_at DESC
LIMIT 10;

-- Show current site_invites for site_id = 2 (should include the new one)
SELECT 'AFTER INVITATION - Recent site_invites:' as status,
       id, email, full_name, role, role_detail, status, created_at
FROM public.site_invites 
WHERE site_id = 2
ORDER BY created_at DESC
LIMIT 10;
