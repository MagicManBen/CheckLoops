-- Complete Fix for Invitation System Issues
-- This script fixes all the identified problems with the invitation system

BEGIN;

-- 1. First, ensure the kiosk_roles table has the necessary roles
INSERT INTO public.kiosk_roles (role) VALUES ('admin') ON CONFLICT (role) DO NOTHING;
INSERT INTO public.kiosk_roles (role) VALUES ('staff') ON CONFLICT (role) DO NOTHING;

-- 2. Fix role_permissions to allow staff access
INSERT INTO public.role_permissions (role, allowed_pages) 
VALUES ('staff', '["dashboard", "calendar", "items", "rooms", "checks", "staff"]'::jsonb)
ON CONFLICT (role) DO UPDATE SET allowed_pages = EXCLUDED.allowed_pages;

-- 3. Create or replace the function to handle new user signups from invitations
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
    invite_record RECORD;
BEGIN
    -- Only process if this is a new user (INSERT) and has email confirmed
    IF TG_OP != 'INSERT' OR NEW.email_confirmed_at IS NULL THEN
        RETURN NEW;
    END IF;

    -- Look for any pending invitations for this email
    SELECT * INTO invite_record
    FROM public.site_invites
    WHERE email = NEW.email
    AND status = 'pending'
    AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1;

    -- If we found a matching invitation
    IF invite_record.id IS NOT NULL THEN
        -- Create profile record
        INSERT INTO public.profiles (user_id, site_id, role, full_name, created_at)
        VALUES (
            NEW.id,
            invite_record.site_id,
            invite_record.role,
            invite_record.full_name,
            NOW()
        )
        ON CONFLICT (user_id, site_id) DO UPDATE SET
            role = EXCLUDED.role,
            full_name = EXCLUDED.full_name;

        -- If role_detail is provided, also add to kiosk_users
        IF invite_record.role_detail IS NOT NULL AND invite_record.role_detail != '' THEN
            INSERT INTO public.kiosk_users (
                site_id, 
                full_name, 
                role, 
                active, 
                created_at,
                reports_to_id
            )
            VALUES (
                invite_record.site_id,
                invite_record.full_name,
                invite_record.role_detail,
                true,
                NOW(),
                invite_record.reports_to_id
            );
        END IF;

        -- Update the invitation status to accepted
        UPDATE public.site_invites
        SET status = 'accepted',
            accepted_at = NOW()
        WHERE id = invite_record.id;

        -- Log the successful processing
        RAISE NOTICE 'Processed invitation for user % with invite ID %', NEW.email, invite_record.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();

-- 5. Also handle the case when email is confirmed later (UPDATE)
CREATE OR REPLACE FUNCTION public.handle_user_email_confirmed()
RETURNS TRIGGER AS $$
DECLARE
    invite_record RECORD;
BEGIN
    -- Only process if email_confirmed_at changed from NULL to a value
    IF OLD.email_confirmed_at IS NOT NULL OR NEW.email_confirmed_at IS NULL THEN
        RETURN NEW;
    END IF;

    -- Look for any pending invitations for this email
    SELECT * INTO invite_record
    FROM public.site_invites
    WHERE email = NEW.email
    AND status = 'pending'
    AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1;

    -- If we found a matching invitation and no profile exists yet
    IF invite_record.id IS NOT NULL THEN
        -- Check if profile already exists
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = NEW.id AND site_id = invite_record.site_id) THEN
            -- Create profile record
            INSERT INTO public.profiles (user_id, site_id, role, full_name, created_at)
            VALUES (
                NEW.id,
                invite_record.site_id,
                invite_record.role,
                invite_record.full_name,
                NOW()
            );

            -- If role_detail is provided, also add to kiosk_users
            IF invite_record.role_detail IS NOT NULL AND invite_record.role_detail != '' THEN
                INSERT INTO public.kiosk_users (
                    site_id, 
                    full_name, 
                    role, 
                    active, 
                    created_at,
                    reports_to_id
                )
                VALUES (
                    invite_record.site_id,
                    invite_record.full_name,
                    invite_record.role_detail,
                    true,
                    NOW(),
                    invite_record.reports_to_id
                );
            END IF;

            -- Update the invitation status to accepted
            UPDATE public.site_invites
            SET status = 'accepted',
                accepted_at = NOW()
            WHERE id = invite_record.id;

            -- Log the successful processing
            RAISE NOTICE 'Processed delayed invitation for user % with invite ID %', NEW.email, invite_record.id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create the trigger for email confirmation updates
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
    AFTER UPDATE OF email_confirmed_at ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_email_confirmed();

-- 7. Create a manual function to process pending invites for existing users (cleanup)
CREATE OR REPLACE FUNCTION public.process_pending_invites()
RETURNS TABLE(processed_count INTEGER, errors TEXT[]) AS $$
DECLARE
    invite_record RECORD;
    error_list TEXT[] := ARRAY[]::TEXT[];
    success_count INTEGER := 0;
BEGIN
    -- Process all pending invites that match existing confirmed users
    FOR invite_record IN 
        SELECT si.*, au.id as user_id
        FROM public.site_invites si
        JOIN auth.users au ON au.email = si.email AND au.email_confirmed_at IS NOT NULL
        WHERE si.status = 'pending' AND si.expires_at > NOW()
        ORDER BY si.created_at ASC
    LOOP
        BEGIN
            -- Check if profile already exists
            IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = invite_record.user_id AND site_id = invite_record.site_id) THEN
                -- Create profile record
                INSERT INTO public.profiles (user_id, site_id, role, full_name, created_at)
                VALUES (
                    invite_record.user_id,
                    invite_record.site_id,
                    invite_record.role,
                    invite_record.full_name,
                    NOW()
                );

                -- If role_detail is provided, also add to kiosk_users
                IF invite_record.role_detail IS NOT NULL AND invite_record.role_detail != '' THEN
                    INSERT INTO public.kiosk_users (
                        site_id, 
                        full_name, 
                        role, 
                        active, 
                        created_at,
                        reports_to_id
                    )
                    VALUES (
                        invite_record.site_id,
                        invite_record.full_name,
                        invite_record.role_detail,
                        true,
                        NOW(),
                        invite_record.reports_to_id
                    );
                END IF;

                -- Update the invitation status to accepted
                UPDATE public.site_invites
                SET status = 'accepted',
                    accepted_at = NOW()
                WHERE id = invite_record.id;

                success_count := success_count + 1;
            ELSE
                -- Profile exists, just update invite status
                UPDATE public.site_invites
                SET status = 'accepted',
                    accepted_at = NOW()
                WHERE id = invite_record.id;
                success_count := success_count + 1;
            END IF;

        EXCEPTION WHEN OTHERS THEN
            error_list := error_list || (invite_record.email || ': ' || SQLERRM);
        END;
    END LOOP;

    processed_count := success_count;
    errors := error_list;
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user_signup() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_user_email_confirmed() TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_pending_invites() TO authenticated;

-- 9. Update any existing 'pending' invites that have matched confirmed users
-- (This is a one-time cleanup)
SELECT * FROM public.process_pending_invites();

-- 10. Ensure RLS policies allow the necessary operations
-- Policy to allow reading invites by token (for the Home.html processing)
DROP POLICY IF EXISTS "Allow reading invites by token" ON public.site_invites;
CREATE POLICY "Allow reading invites by token"
ON public.site_invites
FOR SELECT
TO authenticated
USING (true); -- We'll check the token in the application

-- Policy to allow updating invite status by the user accepting it
DROP POLICY IF EXISTS "Allow updating own invites" ON public.site_invites;
CREATE POLICY "Allow updating own invites"
ON public.site_invites
FOR UPDATE
TO authenticated
USING (true) -- We'll verify the token matches in application
WITH CHECK (status IN ('accepted', 'declined'));

-- Ensure RLS is enabled
ALTER TABLE public.site_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kiosk_users ENABLE ROW LEVEL SECURITY;

COMMIT;

-- Post-deployment verification queries:
-- Check that roles exist:
-- SELECT * FROM public.kiosk_roles ORDER BY role;

-- Check for any pending invites with confirmed users:
-- SELECT si.email, si.status, au.email_confirmed_at 
-- FROM public.site_invites si 
-- JOIN auth.users au ON au.email = si.email 
-- WHERE si.status = 'pending';

-- Manual cleanup if needed:
-- SELECT * FROM public.process_pending_invites();
