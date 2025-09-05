-- Complete invitation system setup for CheckLoop
-- This handles the entire user creation workflow from invitation to profile setup

-- 1. Create or replace the function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
    invite_record RECORD;
BEGIN
    -- Only process if this is a new user (INSERT) and has email confirmed
    IF TG_OP != 'INSERT' OR NEW.email_confirmed_at IS NULL THEN
        RETURN NEW;
    END IF;

    RAISE LOG 'Processing new user signup for email: %', NEW.email;

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
        RAISE LOG 'Found matching invitation for user: %, site: %', NEW.email, invite_record.site_id;
        
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

        RAISE LOG 'Profile created for user: %', NEW.id;

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
            )
            ON CONFLICT (site_id, full_name) DO UPDATE SET
                role = EXCLUDED.role,
                active = EXCLUDED.active,
                reports_to_id = EXCLUDED.reports_to_id;
            
            RAISE LOG 'Kiosk user created for: %', invite_record.full_name;
        END IF;

        -- Update the invitation status to accepted
        UPDATE public.site_invites
        SET 
            status = 'accepted',
            accepted_at = NOW()
        WHERE id = invite_record.id;

        RAISE LOG 'Invitation marked as accepted: %', invite_record.id;

    ELSE
        RAISE LOG 'No matching invitation found for email: %', NEW.email;
        
        -- For users without invitations (shouldn't happen in normal flow)
        -- but we can create a basic profile if needed
        INSERT INTO public.profiles (user_id, site_id, role, full_name, created_at)
        VALUES (
            NEW.id,
            1, -- Default site ID - you might want to change this
            'member', -- Default role
            COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
            NOW()
        )
        ON CONFLICT (user_id, site_id) DO NOTHING;
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in handle_new_user_signup: %', SQLERRM;
        RETURN NEW; -- Don't fail the user creation if our trigger has issues
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger on auth.users for INSERT (new signups)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();

-- 3. Also handle email confirmation updates (for users who were created but not yet confirmed)
CREATE OR REPLACE FUNCTION public.handle_user_email_confirmed()
RETURNS TRIGGER AS $$
DECLARE
    invite_record RECORD;
BEGIN
    -- Only process if email_confirmed_at changed from NULL to a value
    IF OLD.email_confirmed_at IS NOT NULL OR NEW.email_confirmed_at IS NULL THEN
        RETURN NEW;
    END IF;

    RAISE LOG 'Processing email confirmation for: %', NEW.email;

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
        IF NOT EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = NEW.id AND site_id = invite_record.site_id
        ) THEN
            RAISE LOG 'Creating profile for confirmed user: %', NEW.email;
            
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
                )
                ON CONFLICT (site_id, full_name) DO NOTHING;
            END IF;

            -- Update the invitation status to accepted
            UPDATE public.site_invites
            SET 
                status = 'accepted',
                accepted_at = NOW()
            WHERE id = invite_record.id;
        END IF;
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in handle_user_email_confirmed: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create the trigger for email confirmation updates
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
    AFTER UPDATE ON auth.users
    FOR EACH ROW 
    WHEN (OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at)
    EXECUTE FUNCTION public.handle_user_email_confirmed();

-- 5. Ensure role permissions are set up correctly
INSERT INTO public.role_permissions (role, allowed_pages) 
VALUES ('staff', '["dashboard", "calendar", "items", "rooms", "checks", "staff"]'::jsonb)
ON CONFLICT (role) DO UPDATE SET allowed_pages = EXCLUDED.allowed_pages;

-- 6. Make sure the profiles table has the right constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_chk;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_chk 
CHECK (role IN ('admin', 'member', 'staff', 'owner', 'manager'));

-- 7. Enable logging for debugging (optional)
-- You can disable this later if you don't want the logs
ALTER SYSTEM SET log_statement = 'all';
SELECT pg_reload_conf();

RAISE NOTICE 'Complete invitation system setup completed successfully!';
