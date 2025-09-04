-- migrate_roles_admin_staff.sql
-- Run these statements in order in your Supabase SQL editor (or psql) after reviewing them.
-- This script:
-- 1) Ensures kiosk_roles contains only 'admin' and 'staff' (removes other roles).
-- 2) Inserts / updates a 'staff' row in role_permissions to match 'admin' (if role_permissions exists).
-- 3) Creates/updates a helper function is_site_admin(uid, site_id) that treats 'staff' as admin.
-- 4) Provides preview and optional normalization statements for existing profiles and site_invites.
-- IMPORTANT: Review the preview SELECTs before running any UPDATE/DELETE statements.

BEGIN;

-- 1) Ensure kiosk_roles contains only admin/staff (delete other custom roles, insert missing values)
-- Preview rows that will be removed:
SELECT * FROM public.kiosk_roles WHERE role NOT IN ('admin','staff');

-- To remove non-admin/staff roles, uncomment the following DELETE.
-- DELETE FROM public.kiosk_roles WHERE role NOT IN ('admin','staff');

-- Insert admin/staff if missing
INSERT INTO public.kiosk_roles (role)
SELECT v FROM (VALUES ('admin'), ('staff')) AS t(v)
WHERE NOT EXISTS (SELECT 1 FROM public.kiosk_roles kr WHERE kr.role = t.v);

-- 2) Copy admin permissions to staff in role_permissions (if table exists)
-- This block dynamically copies all columns except 'role' and 'id' from admin row to staff row.
DO $$
DECLARE
  copy_cols text;
  collist text;
  select_cols text;
  update_set text;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='role_permissions') THEN
    SELECT string_agg(quote_ident(column_name), ',') INTO copy_cols
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='role_permissions' AND column_name NOT IN ('role','id');

    IF copy_cols IS NULL THEN
      RAISE NOTICE 'role_permissions exists but has no copyable columns (only role/id?) - skipping copy to staff';
    ELSE
      collist := 'role,' || copy_cols;
      select_cols := copy_cols; -- will select these columns from admin row
      SELECT string_agg(quote_ident(column_name) || ' = EXCLUDED.' || quote_ident(column_name), ',') INTO update_set
      FROM information_schema.columns
      WHERE table_schema='public' AND table_name='role_permissions' AND column_name NOT IN ('role','id');

      IF update_set IS NULL THEN
        RAISE NOTICE 'No columns for update_set, skipping';
      ELSE
        EXECUTE format(
          'INSERT INTO public.role_permissions (%s) SELECT %L, %s FROM public.role_permissions WHERE role = %L ON CONFLICT (role) DO UPDATE SET %s',
          collist, 'staff', select_cols, 'admin', update_set
        );
        RAISE NOTICE 'Copied admin -> staff in role_permissions (or updated existing staff row)';
      END IF;
    END IF;
  ELSE
    RAISE NOTICE 'Table public.role_permissions does not exist; skipping copy to staff';
  END IF;
END$$;

-- 3) Create or replace helper function is_site_admin(uid uuid, site)
-- Provide overloads for common site_id types (text, bigint, uuid). All normalize to text
-- so policies can call is_site_admin(auth.uid(), <table>.site_id) regardless of site_id type.
CREATE OR REPLACE FUNCTION public.is_site_admin(uid uuid, site_text text) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = uid
      AND p.site_id::text = site_text
      AND p.role IN ('admin','staff')
  );
$$;

-- Overload for bigint site_id
CREATE OR REPLACE FUNCTION public.is_site_admin(uid uuid, site bigint) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT public.is_site_admin(uid, site::text);
$$;

-- Overload for uuid site_id (in case some tables use uuid)
CREATE OR REPLACE FUNCTION public.is_site_admin(uid uuid, site uuid) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT public.is_site_admin(uid, site::text);
$$;

-- 4) Preview mapping of existing profiles that are not admin/staff
-- (Run these SELECTs and review output before applying normalization.)
SELECT role, count(*) AS cnt FROM public.profiles GROUP BY role ORDER BY cnt DESC;

-- Optional: normalize legacy roles into admin/staff mapping
-- Example mapping (customize to your needs):
--   any role containing 'admin' -> 'admin'
--   'owner' -> 'admin'
--   everything else -> 'staff'
-- Preview candidates for update:
SELECT user_id, site_id, role FROM public.profiles
WHERE role IS NOT NULL AND role NOT IN ('admin','staff')
ORDER BY role NULLS LAST LIMIT 200;

-- If you confirm the mapping above, run the UPDATE below (UNCOMMENT to execute):
-- UPDATE public.profiles
-- SET role = CASE
--   WHEN role ILIKE '%admin%' THEN 'admin'
--   WHEN role ILIKE 'owner' THEN 'admin'
--   ELSE 'staff'
-- END
-- WHERE role IS NOT NULL AND role NOT IN ('admin','staff');

-- 5) Update pending invites in site_invites to use standardized role values
-- Preview non-standard invite roles:
SELECT id, email, role, status FROM public.site_invites WHERE role IS NOT NULL AND role NOT IN ('admin','staff') ORDER BY created_at DESC LIMIT 200;

-- Optionally normalize invites using similar mapping rules (UNCOMMENT to run):
-- UPDATE public.site_invites
-- SET role = CASE
--   WHEN role ILIKE '%admin%' THEN 'admin'
--   WHEN role ILIKE 'owner' THEN 'admin'
--   ELSE 'staff'
-- END
-- WHERE role IS NOT NULL AND role NOT IN ('admin','staff');

-- 6) Optionally restrict kiosk_roles writes (make kiosk_roles read-only for anon)
-- You can implement this with RLS/policies or by revoking INSERT/DELETE privileges from the API role.
-- Example: remove insert/delete for anon/authenticated role (run as a DB superuser / in Supabase SQL editor with appropriate privileges):
-- REVOKE INSERT, DELETE ON public.kiosk_roles FROM anon, authenticated;
-- You may need to adjust role names depending on your Supabase setup (anon, authenticated, service_role).

COMMIT;

-- End of script
-- NOTES:
-- - Review each preview SELECT before uncommenting UPDATE/DELETE statements.
-- - If you rely on role_permissions having different column names, the DO block will attempt to detect columns and copy them; still review the effect.
-- - After running, review application behavior; if any RLS policies still explicitly check for role = 'admin' in their predicates, update those policies to use is_site_admin() or role IN ('admin','staff').

-- Example ALTER POLICY (manual step; replace <policy_name> and <table>):
-- ALTER POLICY <policy_name> ON public.<table> USING (
--   EXISTS (
--     SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.site_id = <table>.site_id AND p.role IN ('admin','staff')
--   )
-- );

-- Alternative: change to use is_site_admin(auth.uid(), <table>.site_id)
-- ALTER POLICY <policy_name> ON public.<table> USING ( public.is_site_admin(auth.uid(), <table>.site_id) );

-- 7) Ensure required columns exist for invite processing
-- Add accepted_at column to site_invites if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'site_invites' 
                   AND column_name = 'accepted_at') THEN
        ALTER TABLE public.site_invites ADD COLUMN accepted_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added accepted_at column to site_invites table';
    END IF;
END$$;

-- Add role_detail and reports_to_id columns to site_invites
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'site_invites' 
                   AND column_name = 'role_detail') THEN
        ALTER TABLE public.site_invites ADD COLUMN role_detail TEXT;
        RAISE NOTICE 'Added role_detail column to site_invites table';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'site_invites' 
                   AND column_name = 'reports_to_id') THEN
        ALTER TABLE public.site_invites ADD COLUMN reports_to_id BIGINT;
        RAISE NOTICE 'Added reports_to_id column to site_invites table';
    END IF;
END$$;

-- Ensure reports_to_id column exists in kiosk_users if needed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'kiosk_users' 
                   AND column_name = 'reports_to_id') THEN
        ALTER TABLE public.kiosk_users ADD COLUMN reports_to_id BIGINT REFERENCES kiosk_users(id);
        RAISE NOTICE 'Added reports_to_id column to kiosk_users table';
    END IF;
END$$;
