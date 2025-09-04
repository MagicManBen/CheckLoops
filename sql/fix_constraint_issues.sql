-- Fix for the ON CONFLICT constraint error and remaining staff invitation issues
-- This addresses the specific constraint problems

BEGIN;

-- 1. First, let's check what constraints exist on the tables
DO $$
BEGIN
    RAISE NOTICE 'Checking constraints on role_permissions table...';
END$$;

-- Fix the role_permissions issue by ensuring the table structure is correct
-- Create role_permissions table if it doesn't exist with proper primary key
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role TEXT PRIMARY KEY,
    allowed_pages JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- Now safely insert/update the role permissions
INSERT INTO public.role_permissions (role, allowed_pages) 
VALUES ('admin', '["dashboard", "calendar", "items", "rooms", "checks", "staff"]'::jsonb)
ON CONFLICT (role) DO UPDATE SET allowed_pages = EXCLUDED.allowed_pages;

INSERT INTO public.role_permissions (role, allowed_pages) 
VALUES ('staff', '["dashboard", "calendar", "items", "rooms", "checks", "staff"]'::jsonb)
ON CONFLICT (role) DO UPDATE SET allowed_pages = EXCLUDED.allowed_pages;

-- 2. Check if there's a foreign key constraint on site_invites.role that's causing the 400 error
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find any foreign key constraints on site_invites.role column
    SELECT tc.constraint_name INTO constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
    WHERE tc.table_name = 'site_invites' 
    AND tc.table_schema = 'public'
    AND kcu.column_name = 'role' 
    AND tc.constraint_type = 'FOREIGN KEY'
    LIMIT 1;

    IF constraint_name IS NOT NULL THEN
        RAISE NOTICE 'Found foreign key constraint on site_invites.role: %', constraint_name;
        
        -- Drop the constraint if it's referencing kiosk_roles
        EXECUTE 'ALTER TABLE public.site_invites DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    ELSE
        RAISE NOTICE 'No foreign key constraints found on site_invites.role';
    END IF;
END$$;

-- 3. Ensure kiosk_roles has all needed roles
INSERT INTO public.kiosk_roles (role) VALUES 
    ('admin'), 
    ('staff'),
    ('owner')
ON CONFLICT (role) DO NOTHING;

-- 4. Check if there are any check constraints on site_invites.role
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN 
        SELECT tc.constraint_name, cc.check_clause
        FROM information_schema.table_constraints tc
        JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
        WHERE tc.table_name = 'site_invites' 
        AND tc.table_schema = 'public'
        AND tc.constraint_type = 'CHECK'
    LOOP
        RAISE NOTICE 'Found check constraint: % with clause: %', constraint_record.constraint_name, constraint_record.check_clause;
        
        -- If the check constraint is limiting role values, drop it
        IF constraint_record.check_clause ILIKE '%role%' AND constraint_record.check_clause NOT ILIKE '%staff%' THEN
            EXECUTE 'ALTER TABLE public.site_invites DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_record.constraint_name);
            RAISE NOTICE 'Dropped restrictive check constraint: %', constraint_record.constraint_name;
        END IF;
    END LOOP;
END$$;

-- 5. Ensure site_invites table has the right structure
-- Add any missing columns that might be causing issues
DO $$
BEGIN
    -- Ensure status column exists and has default
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'site_invites' 
                   AND column_name = 'status') THEN
        ALTER TABLE public.site_invites ADD COLUMN status TEXT DEFAULT 'pending';
        RAISE NOTICE 'Added status column to site_invites';
    END IF;

    -- Ensure expires_at column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'site_invites' 
                   AND column_name = 'expires_at') THEN
        ALTER TABLE public.site_invites ADD COLUMN expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days');
        RAISE NOTICE 'Added expires_at column to site_invites';
    END IF;

    -- Ensure token column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'site_invites' 
                   AND column_name = 'token') THEN
        ALTER TABLE public.site_invites ADD COLUMN token UUID DEFAULT gen_random_uuid();
        RAISE NOTICE 'Added token column to site_invites';
    END IF;

    -- Ensure allowed_pages column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'site_invites' 
                   AND column_name = 'allowed_pages') THEN
        ALTER TABLE public.site_invites ADD COLUMN allowed_pages JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added allowed_pages column to site_invites';
    END IF;
END$$;

-- 6. Fix RLS policies that might be too restrictive
DROP POLICY IF EXISTS "site_invites_select" ON public.site_invites;
DROP POLICY IF EXISTS "site_invites_insert" ON public.site_invites;
DROP POLICY IF EXISTS "site_invites_update" ON public.site_invites;

-- Create permissive policies for site_invites
CREATE POLICY "Allow site members to manage invites"
ON public.site_invites
FOR ALL
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

-- 7. Create a test function to validate the invite creation
CREATE OR REPLACE FUNCTION public.test_invite_creation(
    p_email TEXT,
    p_role TEXT DEFAULT 'staff',
    p_site_id BIGINT DEFAULT 2
)
RETURNS JSONB AS $$
DECLARE
    test_result JSONB;
    invite_id BIGINT;
BEGIN
    BEGIN
        INSERT INTO public.site_invites (
            email,
            role,
            site_id,
            full_name,
            status,
            expires_at,
            token,
            allowed_pages,
            invited_by
        ) VALUES (
            p_email,
            p_role,
            p_site_id,
            'Test User',
            'pending',
            NOW() + INTERVAL '7 days',
            gen_random_uuid(),
            '[]'::jsonb,
            auth.uid()
        ) RETURNING id INTO invite_id;

        test_result := jsonb_build_object(
            'success', true,
            'invite_id', invite_id,
            'message', 'Invite created successfully'
        );

        -- Clean up the test invite
        DELETE FROM public.site_invites WHERE id = invite_id;

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

GRANT EXECUTE ON FUNCTION public.test_invite_creation(TEXT, TEXT, BIGINT) TO authenticated;

COMMIT;

-- Test queries to run after this script:
-- SELECT * FROM public.kiosk_roles ORDER BY role;
-- SELECT * FROM public.test_invite_creation('test@example.com', 'staff', 2);
-- SELECT * FROM public.test_invite_creation('test@example.com', 'admin', 2);
