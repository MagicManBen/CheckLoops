-- Fix to immediately add invited users to kiosk_users table when invitation is created
-- This addresses the issue where users should be added to kiosk_users when the inviter clicks "invite"

-- 1. Create or replace function to handle immediate kiosk user creation on invite
CREATE OR REPLACE FUNCTION public.handle_site_invite_created()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process if this is a new invitation (INSERT)
    IF TG_OP != 'INSERT' THEN
        RETURN NEW;
    END IF;

    RAISE LOG 'Processing new site invitation for email: %, site_id: %', NEW.email, NEW.site_id;

    -- If role_detail is provided, add to kiosk_users immediately
    IF NEW.role_detail IS NOT NULL AND NEW.role_detail != '' THEN
        INSERT INTO public.kiosk_users (
            site_id, 
            full_name, 
            role, 
            active, 
            created_at,
            reports_to_id
        )
        VALUES (
            NEW.site_id,
            NEW.full_name,
            NEW.role_detail,
            true,
            NOW(),
            NEW.reports_to_id
        )
        ON CONFLICT (site_id, full_name) DO UPDATE SET
            role = EXCLUDED.role,
            active = true,
            reports_to_id = EXCLUDED.reports_to_id;
        
        RAISE LOG 'Kiosk user created immediately for: %, role: %', NEW.full_name, NEW.role_detail;
    ELSE
        RAISE LOG 'No role_detail provided for invite: %, skipping immediate kiosk_users creation', NEW.email;
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in handle_site_invite_created: %', SQLERRM;
        RETURN NEW; -- Don't fail the invitation creation if kiosk_users insert has issues
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger on site_invites for INSERT (new invitations)
DROP TRIGGER IF EXISTS on_site_invite_created ON public.site_invites;
CREATE TRIGGER on_site_invite_created
    AFTER INSERT ON public.site_invites
    FOR EACH ROW EXECUTE FUNCTION public.handle_site_invite_created();

-- 3. Update the existing trigger functions to avoid duplicate kiosk_users entries
-- Modify the handle_new_user_signup function to check if kiosk_user already exists
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

        -- If role_detail is provided, add to kiosk_users (only if not already exists from invitation trigger)
        IF invite_record.role_detail IS NOT NULL AND invite_record.role_detail != '' THEN
            -- Use ON CONFLICT DO NOTHING since the record may already exist from the invitation trigger
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
            ON CONFLICT (site_id, full_name) DO NOTHING; -- Changed from DO UPDATE to DO NOTHING
            
            RAISE LOG 'Kiosk user ensured for: % (may have already existed)', invite_record.full_name;
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

-- 4. Update the email confirmation handler as well
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

            -- If role_detail is provided, ensure kiosk_users exists (may already exist from invitation trigger)
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
                ON CONFLICT (site_id, full_name) DO NOTHING; -- Changed from DO UPDATE to DO NOTHING
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

-- Final success message
DO $$
BEGIN
    RAISE NOTICE 'Immediate kiosk user creation trigger setup completed successfully!';
    RAISE NOTICE 'Now when an invitation is created, the user will be immediately added to kiosk_users table.';
END $$;
