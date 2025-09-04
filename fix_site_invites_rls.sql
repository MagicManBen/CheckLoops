-- Fix RLS policies for site_invites table to allow invitation cancellation

-- First, check if the helper function exists, if not create it
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

-- Grant execute permission to the function for authenticated users
GRANT EXECUTE ON FUNCTION get_current_user_site_id() TO authenticated;

-- RLS Policies for 'site_invites' table

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

-- 3. Allow users to update/cancel invites for their site
CREATE POLICY "Allow users to update invites for their site"
ON public.site_invites
FOR UPDATE
TO authenticated
USING (site_id = get_current_user_site_id())
WITH CHECK (site_id = get_current_user_site_id());

-- 4. Optionally, allow users to delete invites for their site
CREATE POLICY "Allow users to delete invites for their site"
ON public.site_invites
FOR DELETE
TO authenticated
USING (site_id = get_current_user_site_id());

-- Make sure RLS is enabled on the table
ALTER TABLE public.site_invites ENABLE ROW LEVEL SECURITY;
