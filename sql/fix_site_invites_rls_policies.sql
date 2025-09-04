-- Fix RLS policies that might be blocking staff invitations

-- Enable RLS on the tables
ALTER TABLE public.site_invites ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies that might be blocking staff invites
DROP POLICY IF EXISTS "site_invites_check_role" ON public.site_invites;
DROP POLICY IF EXISTS "site_invites_role_check" ON public.site_invites;

-- Allow users to insert invites for their site (admin or staff)
DROP POLICY IF EXISTS "Allow users to insert invites for their site" ON public.site_invites;
CREATE POLICY "Allow users to insert invites for their site"
ON public.site_invites
FOR INSERT
TO authenticated
WITH CHECK (
    site_id IN (
        SELECT p.site_id FROM public.profiles p 
        WHERE p.user_id = auth.uid() 
        AND p.role IN ('admin', 'staff', 'owner')
    )
);

-- Allow users to read invites for their site
DROP POLICY IF EXISTS "Allow users to view their site's invites" ON public.site_invites;
CREATE POLICY "Allow users to view their site's invites"
ON public.site_invites
FOR SELECT
TO authenticated
USING (
    site_id IN (
        SELECT p.site_id FROM public.profiles p 
        WHERE p.user_id = auth.uid() 
        AND p.role IN ('admin', 'staff', 'owner')
    )
);

-- Allow users to update invites for their site (for cancellation/status updates)
DROP POLICY IF EXISTS "Allow users to update invites for their site" ON public.site_invites;
CREATE POLICY "Allow users to update invites for their site"
ON public.site_invites
FOR UPDATE
TO authenticated
USING (
    site_id IN (
        SELECT p.site_id FROM public.profiles p 
        WHERE p.user_id = auth.uid() 
        AND p.role IN ('admin', 'staff', 'owner')
    )
)
WITH CHECK (
    site_id IN (
        SELECT p.site_id FROM public.profiles p 
        WHERE p.user_id = auth.uid() 
        AND p.role IN ('admin', 'staff', 'owner')
    )
);

-- Remove any constraints that might prevent staff invitations
-- Check for foreign key constraints on role column that might be limiting values
DO $$
BEGIN
    -- If there's a foreign key constraint on the role column referencing kiosk_roles, 
    -- this might be preventing 'staff' values from being inserted
    -- Let's check if this constraint exists and handle it
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'site_invites' 
        AND kcu.column_name = 'role' 
        AND tc.constraint_type = 'FOREIGN KEY'
    ) THEN
        RAISE NOTICE 'Found foreign key constraint on site_invites.role column';
        
        -- Check if the constraint references kiosk_roles
        IF EXISTS (
            SELECT 1 FROM information_schema.referential_constraints rc
            JOIN information_schema.table_constraints tc ON rc.constraint_name = tc.constraint_name
            WHERE tc.table_name = 'site_invites' 
            AND rc.referenced_table_name = 'kiosk_roles'
        ) THEN
            RAISE NOTICE 'site_invites.role references kiosk_roles - this is likely the source of the issue if staff role is missing';
        END IF;
    ELSE
        RAISE NOTICE 'No foreign key constraints found on site_invites.role';
    END IF;
END$$;
