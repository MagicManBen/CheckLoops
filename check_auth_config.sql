-- Query to check current Supabase auth configuration
-- Run this in your Supabase SQL Editor

-- Check recent auth attempts (this table should exist)
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    invited_at,
    confirmation_sent_at,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN '✅ Confirmed'
        WHEN invited_at IS NOT NULL THEN '📩 Invited'
        WHEN confirmation_sent_at IS NOT NULL THEN '📧 Confirmation Sent'
        ELSE '❓ Other'
    END as status
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

-- Check site invites
SELECT 
    id,
    email,
    full_name,
    role,
    status,
    expires_at,
    created_at,
    invited_by,
    accepted_at,
    role_detail,
    CASE 
        WHEN expires_at < NOW() THEN '⏰ Expired'
        WHEN status = 'accepted' THEN '✅ Accepted'
        WHEN status = 'pending' THEN '⏳ Pending'
        ELSE '❓ Other'
    END as invite_status
FROM public.site_invites 
ORDER BY created_at DESC 
LIMIT 10;

-- Check profiles table
SELECT 
    user_id,
    full_name,
    role,
    site_id,
    org_id,
    created_at
FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 10;
