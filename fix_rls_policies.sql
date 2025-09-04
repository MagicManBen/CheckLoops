-- This script creates the necessary Row Level Security (RLS) policies
-- to allow users to manage complaints for their assigned site.

-- A helper function to get the site_id for the currently authenticated user.
-- This simplifies the policy definitions.
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


-- RLS Policies for 'complaints' table

-- 1. Allow users to view complaints that belong to their site.
CREATE POLICY "Allow users to view their site's complaints"
ON public.complaints
FOR SELECT
TO authenticated
USING (site_id = get_current_user_site_id());

-- 2. Allow users to create new complaints for their own site.
CREATE POLICY "Allow users to insert complaints for their site"
ON public.complaints
FOR INSERT
TO authenticated
WITH CHECK (site_id = get_current_user_site_id());


-- RLS Policies for 'complaint_categories' table

-- 1. Allow users to view categories specific to their site or global categories (where site_id is 0).
CREATE POLICY "Allow users to view site and global categories"
ON public.complaint_categories
FOR SELECT
TO authenticated
USING (site_id = get_current_user_site_id() OR site_id = 0);


-- RLS Policies for 'complaint_notes' table

-- 1. Allow users to view notes for complaints that are part of their site.
CREATE POLICY "Allow users to view notes for their site's complaints"
ON public.complaint_notes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.complaints c
    WHERE c.id = complaint_id AND c.site_id = get_current_user_site_id()
  )
);

-- 2. Allow users to add notes to complaints that are part of their site.
CREATE POLICY "Allow users to insert notes for their site's complaints"
ON public.complaint_notes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.complaints c
    WHERE c.id = complaint_id AND c.site_id = get_current_user_site_id()
  )
);


-- RLS Policies for 'complaint_attachments' table

-- 1. Allow users to view attachments for complaints that are part of their site.
CREATE POLICY "Allow users to view attachments for their site's complaints"
ON public.complaint_attachments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.complaints c
    WHERE c.id = complaint_id AND c.site_id = get_current_user_site_id()
  )
);

-- 2. Allow users to add attachments to complaints that are part of their site.
CREATE POLICY "Allow users to insert attachments for their site's complaints"
ON public.complaint_attachments
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.complaints c
    WHERE c.id = complaint_id AND c.site_id = get_current_user_site_id()
  )
);
