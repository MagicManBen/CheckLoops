-- CORRECTED: Complete fix for staff_app_welcome -> kiosk_users sync
-- Run this in Supabase SQL Editor to fix the synchronization issue

-- STEP 1: Create the sync function (corrected syntax)
CREATE OR REPLACE FUNCTION public._saw_sync_kiosk_users()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_kiosk_id bigint;
BEGIN
  -- Log the trigger execution for debugging
  RAISE LOG 'staff_app_welcome sync trigger fired for user: %, site: %, role: %, team: %', 
    NEW.full_name, NEW.site_id, NEW.role_detail, NEW.team_name;

  -- If no site or name, nothing to sync
  IF NEW.site_id IS NULL OR COALESCE(TRIM(NEW.full_name), '') = '' THEN
    RETURN NEW;
  END IF;

  -- Ensure referenced role exists in kiosk_roles (if any)
  IF NEW.role_detail IS NOT NULL AND COALESCE(TRIM(NEW.role_detail), '') <> '' THEN
    INSERT INTO public.kiosk_roles(role)
    VALUES (NEW.role_detail)
    ON CONFLICT (role) DO NOTHING;
  END IF;

  -- Find existing kiosk_user by site + full_name (prefer exact match first)
  SELECT ku.id INTO v_kiosk_id
  FROM public.kiosk_users ku
  WHERE ku.site_id = NEW.site_id
    AND ku.full_name = NEW.full_name
  ORDER BY ku.created_at DESC -- Use most recent if multiple matches
  LIMIT 1;

  IF v_kiosk_id IS NOT NULL THEN
    -- Update existing record - ALWAYS update role and team from staff_app_welcome
    UPDATE public.kiosk_users
    SET role      = COALESCE(NULLIF(TRIM(NEW.role_detail), ''), role),
        team_id   = COALESCE(NEW.team_id, team_id),
        team_name = COALESCE(NULLIF(TRIM(NEW.team_name), ''), team_name),
        active    = true
    WHERE id = v_kiosk_id;
    
    RAISE LOG 'Updated kiosk_users id: % for %', v_kiosk_id, NEW.full_name;
  ELSE
    -- Insert new record
    INSERT INTO public.kiosk_users (
      site_id, 
      full_name, 
      role, 
      team_id, 
      team_name, 
      active
    )
    VALUES (
      NEW.site_id,
      NEW.full_name,
      NULLIF(TRIM(COALESCE(NEW.role_detail, '')), ''),
      NEW.team_id,
      NULLIF(TRIM(COALESCE(NEW.team_name, '')), ''),
      true
    )
    RETURNING id INTO v_kiosk_id;
    
    RAISE LOG 'Created kiosk_users id: % for %', v_kiosk_id, NEW.full_name;
  END IF;

  RETURN NEW;
END;
$$;

-- STEP 2: Drop and recreate triggers to ensure they're active
DROP TRIGGER IF EXISTS _saw_sync_kiosk_users_ai ON public.staff_app_welcome;
DROP TRIGGER IF EXISTS _saw_sync_kiosk_users_au ON public.staff_app_welcome;

CREATE TRIGGER _saw_sync_kiosk_users_ai
  AFTER INSERT ON public.staff_app_welcome
  FOR EACH ROW EXECUTE FUNCTION public._saw_sync_kiosk_users();

CREATE TRIGGER _saw_sync_kiosk_users_au
  AFTER UPDATE ON public.staff_app_welcome
  FOR EACH ROW EXECUTE FUNCTION public._saw_sync_kiosk_users();

-- STEP 3: Handle duplicate Ben Howard records first
-- Merge the two Ben Howard records - keep the newer one (id=37) and update it
UPDATE kiosk_users 
SET role = 'Pharmacist',
    team_name = 'Pharmacy Team',
    team_id = NULL -- Clear team_id since we're setting team_name from staff_app_welcome
WHERE id = 37 AND full_name = 'Benjamin Howard';

-- Deactivate the older duplicate record
UPDATE kiosk_users 
SET active = false 
WHERE id = 3 AND full_name = 'Ben Howard';

-- STEP 4: One-time sync of existing data from staff_app_welcome
DO $$
DECLARE
  rec RECORD;
  v_kiosk_id bigint;
  v_count int := 0;
BEGIN
  -- Loop through all staff_app_welcome records
  FOR rec IN 
    SELECT 
      user_id,
      site_id,
      full_name,
      role_detail,
      team_id,
      team_name
    FROM staff_app_welcome
    WHERE site_id IS NOT NULL 
      AND COALESCE(TRIM(full_name), '') <> ''
  LOOP
    -- Find matching kiosk_user (handle name variations)
    SELECT ku.id INTO v_kiosk_id
    FROM kiosk_users ku
    WHERE ku.site_id = rec.site_id
      AND (ku.full_name = rec.full_name 
           OR (rec.full_name ILIKE '%ben%howard%' AND ku.full_name ILIKE '%ben%howard%'))
      AND ku.active = true
    ORDER BY ku.created_at DESC
    LIMIT 1;

    IF v_kiosk_id IS NOT NULL THEN
      -- Update existing kiosk_user with staff_app_welcome data
      UPDATE kiosk_users
      SET role      = COALESCE(NULLIF(TRIM(rec.role_detail), ''), role),
          team_id   = COALESCE(rec.team_id, team_id),
          team_name = COALESCE(NULLIF(TRIM(rec.team_name), ''), team_name),
          active    = true
      WHERE id = v_kiosk_id;
      
      v_count := v_count + 1;
      RAISE LOG 'Synced existing user: % (kiosk_id: %)', rec.full_name, v_kiosk_id;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'One-time sync completed. Updated % kiosk_users records.', v_count;
END;
$$;

-- STEP 5: Verification - show the sync results
SELECT 
    'After Sync - staff_app_welcome' as source,
    full_name,
    role_detail as role,
    team_name,
    updated_at::text as last_change
FROM staff_app_welcome 
WHERE full_name ILIKE '%ben%howard%' OR full_name ILIKE '%ben%'

UNION ALL

SELECT 
    'After Sync - kiosk_users (active)' as source,
    full_name,
    role,
    team_name,
    created_at::text as last_change
FROM kiosk_users 
WHERE (full_name ILIKE '%ben%howard%' OR full_name ILIKE '%ben%')
  AND active = true

UNION ALL

SELECT 
    'After Sync - kiosk_users (inactive)' as source,
    full_name,
    role,
    team_name,
    created_at::text as last_change
FROM kiosk_users 
WHERE (full_name ILIKE '%ben%howard%' OR full_name ILIKE '%ben%')
  AND active = false

ORDER BY source, full_name;