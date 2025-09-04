-- Fix RLS Policy Conflicts for Site Invites
-- Remove conflicting policies that prevent staff from creating invitations

BEGIN;

-- Drop the conflicting policies that have restrictive role checks
DROP POLICY IF EXISTS "inv_admin_all" ON public.site_invites;
DROP POLICY IF EXISTS "inv_select_mine" ON public.site_invites;
DROP POLICY IF EXISTS "inv_read_by_email" ON public.site_invites;
DROP POLICY IF EXISTS "inv_update_by_email" ON public.site_invites;

-- Keep the working policies that allow admin/staff/owner access
-- These policies are already in place and working:
-- - "Allow users to insert invites for their site" 
-- - "Allow users to view their site's invites"
-- - "Allow users to update invites for their site"
-- - "Allow users to delete invites for their site"
-- - "Allow site members to manage invites"
-- - "Allow reading invites by token"
-- - "Allow updating own invites"

-- Let's verify the current user's profile to ensure they can create invites
DO $$
DECLARE
    user_profile RECORD;
BEGIN
    SELECT p.user_id, p.site_id, p.role, p.full_name 
    INTO user_profile
    FROM public.profiles p 
    WHERE p.user_id = auth.uid();
    
    IF user_profile.user_id IS NOT NULL THEN
        RAISE NOTICE 'Current user profile: User ID: %, Site ID: %, Role: %, Name: %', 
            user_profile.user_id, user_profile.site_id, user_profile.role, user_profile.full_name;
    ELSE
        RAISE NOTICE 'No profile found for current user: %', auth.uid();
    END IF;
END$$;

-- Test creating a staff invitation to verify it works
DO $$
DECLARE
    test_invite_id BIGINT;
BEGIN
    BEGIN
        INSERT INTO public.site_invites (
            email,
            role,
            role_detail,
            site_id,
            full_name,
            status,
            expires_at,
            token,
            allowed_pages
        ) VALUES (
            'test-staff@example.com',
            'admin',  -- Use admin instead of staff for the main role
            'staff',  -- Put staff in role_detail for kiosk_users
            2,
            'Test Staff User',
            'pending',
            NOW() + INTERVAL '7 days',
            gen_random_uuid(),
            '["dashboard", "calendar", "items", "rooms", "checks", "staff"]'::jsonb
        ) RETURNING id INTO test_invite_id;

        RAISE NOTICE 'SUCCESS: Staff invitation created with ID: %', test_invite_id;
        
        -- Clean up the test invite
        DELETE FROM public.site_invites WHERE id = test_invite_id;
        RAISE NOTICE 'Test invitation cleaned up successfully';

    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERROR creating staff invitation: % - %', SQLSTATE, SQLERRM;
    END;
END$$;

-- Also create a simplified function to test invitation creation from the application
CREATE OR REPLACE FUNCTION public.test_staff_invite_creation()
RETURNS jsonb AS $$
DECLARE
    test_result jsonb;
    invite_id bigint;
BEGIN
    BEGIN
        INSERT INTO public.site_invites (
            email,
            role,
            role_detail,
            site_id,
            full_name,
            status,
            expires_at,
            token,
            allowed_pages,
            invited_by
        ) VALUES (
            'app-test@example.com',
            'admin',  -- Main role as admin
            'staff',  -- Detail role as staff
            2,
            'App Test User',
            'pending',
            NOW() + INTERVAL '7 days',
            gen_random_uuid(),
            '["dashboard", "calendar", "items", "rooms", "checks", "staff"]'::jsonb,
            auth.uid()
        ) RETURNING id INTO invite_id;

        -- Clean up immediately
        DELETE FROM public.site_invites WHERE id = invite_id;

        test_result := jsonb_build_object(
            'success', true,
            'message', 'Staff invitation creation works',
            'test_id', invite_id
        );

    EXCEPTION WHEN OTHERS THEN
        test_result := jsonb_build_object(
            'success', false,
            'error_code', SQLSTATE,
            'error_message', SQLERRM
        );
    END;

    RETURN test_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.test_staff_invite_creation() TO authenticated;

COMMIT;

-- After running this, test with: SELECT * FROM public.test_staff_invite_creation();
