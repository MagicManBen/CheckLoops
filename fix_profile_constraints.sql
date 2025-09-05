-- Fix profile constraints that are preventing user creation
-- Run this in your Supabase SQL Editor

-- 1. Check what the current constraint allows
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass 
AND conname = 'profiles_role_chk';

-- 2. Drop the existing constraint (if it's too restrictive)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_chk;

-- 3. Add a new, more flexible constraint that allows the roles we're using
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_chk 
CHECK (role IN ('admin', 'member', 'staff', 'owner', 'manager'));

-- 4. Check existing profiles to see what roles are currently used
SELECT DISTINCT role, COUNT(*) as count
FROM public.profiles 
GROUP BY role;

-- 5. Update the simple-invite function metadata to use 'staff' role
-- (This is just a note - the function already uses 'staff')
