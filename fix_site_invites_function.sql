-- Alternative approach: Create a function to cancel invitations
-- This approach uses a stored procedure with SECURITY DEFINER to bypass RLS for admin operations

-- Create a function to cancel site invitations
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
    
    -- Update the invitation status
    UPDATE public.site_invites 
    SET status = 'cancelled'
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION cancel_site_invitation(BIGINT) TO authenticated;

-- Also ensure the basic RLS policies exist for site_invites
DO $$
BEGIN
    -- Check if RLS is enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'site_invites' 
        AND n.nspname = 'public' 
        AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.site_invites ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;
