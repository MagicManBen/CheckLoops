-- Comprehensive fix for invitation cancellation issues
-- This script will ensure proper RLS policies and functions are in place

-- First, ensure the helper function exists
CREATE OR REPLACE FUNCTION get_current_user_site_id()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    site_id_val INT;
BEGIN
    SELECT site_id INTO site_id_val
    FROM public.profiles
    WHERE user_id = auth.uid()
    LIMIT 1;
    
    RETURN site_id_val;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_current_user_site_id() TO authenticated;

-- Enable RLS on site_invites table
ALTER TABLE public.site_invites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts (ignore errors if they don't exist)
DROP POLICY IF EXISTS "Allow users to view their site's invites" ON public.site_invites;
DROP POLICY IF EXISTS "Allow users to insert invites for their site" ON public.site_invites;
DROP POLICY IF EXISTS "Allow users to update invites for their site" ON public.site_invites;
DROP POLICY IF EXISTS "Allow users to delete invites for their site" ON public.site_invites;

-- Create comprehensive RLS policies for site_invites

-- 1. Allow users to view invites for their site
CREATE POLICY "Allow users to view their site's invites"
ON public.site_invites
FOR SELECT
TO authenticated
USING (site_id = get_current_user_site_id());

-- 2. Allow users to create invites for their site
CREATE POLICY "Allow users to insert invites for their site"
ON public.site_invites
FOR INSERT
TO authenticated
WITH CHECK (site_id = get_current_user_site_id());

-- 3. Allow users to update invites for their site
CREATE POLICY "Allow users to update invites for their site"
ON public.site_invites
FOR UPDATE
TO authenticated
USING (site_id = get_current_user_site_id())
WITH CHECK (site_id = get_current_user_site_id());

-- 4. Allow users to delete invites for their site (optional)
CREATE POLICY "Allow users to delete invites for their site"
ON public.site_invites
FOR DELETE
TO authenticated
USING (site_id = get_current_user_site_id());

-- Create the cancellation function as a backup
CREATE OR REPLACE FUNCTION cancel_site_invitation(invite_id BIGINT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    user_site_id INT;
    invite_record RECORD;
    result JSON;
BEGIN
    -- Get current user info
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'User not authenticated'
        );
    END IF;
    
    -- Get user's site_id from profiles
    SELECT site_id INTO user_site_id
    FROM public.profiles
    WHERE user_id = current_user_id;
    
    IF user_site_id IS NULL THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'User not associated with any site'
        );
    END IF;
    
    -- Get the invitation record
    SELECT * INTO invite_record
    FROM public.site_invites
    WHERE id = invite_id AND site_id = user_site_id;
    
    IF invite_record IS NULL THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Invitation not found or access denied'
        );
    END IF;
    
    -- Check if invitation can be cancelled
    IF invite_record.status != 'pending' THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Invitation cannot be cancelled - status is ' || invite_record.status
        );
    END IF;
    
    -- Update the invitation status (use 'revoked' as 'cancelled' is not allowed by check constraint)
    UPDATE public.site_invites 
    SET status = 'revoked'
    WHERE id = invite_id;
    
    -- Return success
    RETURN json_build_object(
        'success', true, 
        'message', 'Invitation cancelled successfully',
        'invite_id', invite_id,
        'email', invite_record.email
    );
    
EXCEPTION 
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false, 
            'error', SQLERRM
        );
END;
$$;

-- Grant execute permission to the function
GRANT EXECUTE ON FUNCTION cancel_site_invitation(BIGINT) TO authenticated;

-- Test query to verify the setup (this will show current invites for debugging)
-- You can run this in the Supabase SQL editor to check the current state:
/*
SELECT 
    id, 
    email, 
    full_name, 
    status, 
    site_id,
    created_at,
    expires_at
FROM public.site_invites 
WHERE site_id = 2 -- Replace with your site_id
ORDER BY created_at DESC;
*/
