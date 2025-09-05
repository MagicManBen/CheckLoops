-- SQL to check and configure auth settings for local development
-- Run this in your Supabase SQL Editor

-- First, let's check current auth configuration
SELECT * FROM auth.config;

-- Check current site invites to understand the data structure
SELECT id, email, full_name, role, status, token, expires_at, site_id 
FROM public.site_invites 
ORDER BY created_at DESC 
LIMIT 10;

-- Check if there are any users with pending invites
SELECT 
    si.email,
    si.full_name,
    si.status,
    si.expires_at,
    p.user_id,
    p.role as profile_role
FROM public.site_invites si
LEFT JOIN public.profiles p ON p.email = si.email
WHERE si.status = 'pending'
ORDER BY si.created_at DESC;

-- Check auth.users table for recently invited users
SELECT 
    id,
    email,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    recovery_token,
    raw_user_meta_data
FROM auth.users 
WHERE invited_at IS NOT NULL
ORDER BY invited_at DESC
LIMIT 10;
