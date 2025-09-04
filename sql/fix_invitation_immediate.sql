-- Immediate fix for invitation system issues
-- This addresses the most critical problems first

BEGIN;

-- 1. Ensure staff role exists in kiosk_roles (this is why staff invites are failing)
INSERT INTO public.kiosk_roles (role) VALUES ('staff') ON CONFLICT (role) DO NOTHING;

-- 2. Fix role_permissions to ensure staff has proper access
INSERT INTO public.role_permissions (role, allowed_pages) 
VALUES ('staff', '["dashboard", "calendar", "items", "rooms", "checks", "staff"]'::jsonb)
ON CONFLICT (role) DO UPDATE SET allowed_pages = EXCLUDED.allowed_pages;

-- 3. Update any existing invites that are stuck in pending status for confirmed users
UPDATE public.site_invites 
SET status = 'accepted', accepted_at = NOW()
WHERE status = 'pending' 
AND email IN (
    SELECT email FROM auth.users WHERE email_confirmed_at IS NOT NULL
);

-- 4. Create missing profiles for users who confirmed but don't have profiles yet
INSERT INTO public.profiles (user_id, site_id, role, full_name, created_at)
SELECT 
    au.id as user_id,
    si.site_id,
    si.role,
    si.full_name,
    NOW() as created_at
FROM auth.users au
JOIN public.site_invites si ON si.email = au.email
WHERE au.email_confirmed_at IS NOT NULL
AND si.status = 'accepted'
AND NOT EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = au.id AND p.site_id = si.site_id
)
ON CONFLICT (user_id, site_id) DO NOTHING;

-- 5. Create missing kiosk_users for staff who have role_detail
INSERT INTO public.kiosk_users (site_id, full_name, role, active, created_at, reports_to_id)
SELECT 
    si.site_id,
    si.full_name,
    si.role_detail,
    true,
    NOW(),
    si.reports_to_id
FROM public.site_invites si
JOIN auth.users au ON au.email = si.email
WHERE au.email_confirmed_at IS NOT NULL
AND si.status = 'accepted'
AND si.role_detail IS NOT NULL
AND si.role_detail != ''
AND NOT EXISTS (
    SELECT 1 FROM public.kiosk_users ku 
    WHERE ku.site_id = si.site_id 
    AND ku.full_name = si.full_name 
    AND ku.role = si.role_detail
);

COMMIT;

-- Verification queries (run these to check the fix worked):
-- SELECT role FROM public.kiosk_roles ORDER BY role;
-- SELECT email, status, role, role_detail FROM public.site_invites ORDER BY created_at DESC LIMIT 10;
-- SELECT p.role, p.full_name, au.email FROM public.profiles p JOIN auth.users au ON p.user_id = au.id ORDER BY p.created_at DESC LIMIT 5;
