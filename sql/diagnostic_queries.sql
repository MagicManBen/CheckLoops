-- Quick diagnostic queries to identify the exact issue
-- Run these in Supabase SQL Editor to see what's causing the 400 error

-- 1. Check what roles currently exist in kiosk_roles
SELECT 'Current roles in kiosk_roles:' as info;
SELECT * FROM public.kiosk_roles ORDER BY role;

-- 2. Check if there are any foreign key constraints on site_invites
SELECT 'Foreign key constraints on site_invites:' as info;
SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'site_invites' 
AND tc.table_schema = 'public'
AND tc.constraint_type = 'FOREIGN KEY';

-- 3. Check for any check constraints on site_invites
SELECT 'Check constraints on site_invites:' as info;
SELECT 
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'site_invites' 
AND tc.table_schema = 'public'
AND tc.constraint_type = 'CHECK';

-- 4. Check the structure of site_invites table
SELECT 'Structure of site_invites table:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'site_invites'
ORDER BY ordinal_position;

-- 5. Check current RLS policies on site_invites
SELECT 'Current RLS policies on site_invites:' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'site_invites';

-- 6. Test a simple insert to see what error we get
DO $$
BEGIN
    BEGIN
        INSERT INTO public.site_invites (
            email,
            role,
            site_id,
            full_name,
            status,
            expires_at,
            token
        ) VALUES (
            'diagnostic@test.com',
            'staff',
            2,
            'Diagnostic Test',
            'pending',
            NOW() + INTERVAL '7 days',
            gen_random_uuid()
        );
        
        RAISE NOTICE 'SUCCESS: Test insert worked - deleting test record';
        DELETE FROM public.site_invites WHERE email = 'diagnostic@test.com';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: % - %', SQLSTATE, SQLERRM;
    END;
END$$;
