-- Fix to properly join profiles with auth.users to show emails correctly
-- and ensure users stay visible after accepting invitations

BEGIN;

-- Create a view that properly joins profiles with auth.users to get email addresses
-- Security is handled by the underlying profiles table RLS policies
CREATE OR REPLACE VIEW public.v_practice_users AS
SELECT 
    p.user_id,
    p.site_id,
    p.role,
    p.full_name,
    p.created_at,
    au.email,
    CASE 
        WHEN au.email_confirmed_at IS NOT NULL THEN 'Active'
        ELSE 'Pending Confirmation'
    END as status
FROM public.profiles p
LEFT JOIN auth.users au ON au.id = p.user_id
WHERE p.user_id IS NOT NULL;

-- Grant access to the view
GRANT SELECT ON public.v_practice_users TO authenticated, public;

-- Test the view
SELECT 'Testing v_practice_users view:' as info;
SELECT * FROM public.v_practice_users LIMIT 5;

COMMIT;
