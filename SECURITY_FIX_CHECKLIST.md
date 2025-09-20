# Supabase Security Fix Checklist

## Fixed Issues

### 1. Storage Buckets (Made Private)
- ✅ `pir_attachments` - Set public = false
- ✅ `pir_templates` - Set public = false
- ✅ `complaint-documents` - Set public = false
- ✅ `training-certificates` - Set public = false
- ✅ `meeting-recordings` - Set public = false

### 2. Storage Policies Removed (Anonymous Access)
- ✅ `public read training bucket`
- ✅ `public insert training bucket`
- ✅ `public update training bucket`
- ✅ `public delete training bucket`

### 3. Storage Policies Replaced (Using master_users instead of backup table)
- ✅ `complaint-documents` - New site-scoped policies
- ✅ `training-certificates` - New site-scoped policies with path enforcement
- ✅ `pir_attachments` - New site-scoped policies with path enforcement
- ✅ `pir_templates` - Admin-only policies
- ✅ `meeting-recordings` - New site-scoped policies

### 4. Database Secrets
- ✅ Truncated `private.secrets` table
- ✅ Added constraint to prevent future insertions

### 5. Table Grants
- ✅ Revoked PUBLIC/anon access to `2_staff_entitlements`
- ✅ Re-granted proper permissions to authenticated/service_role only

### 6. Row Level Security (RLS)
- ✅ Enabled RLS on all public tables
- ✅ Added site-scoped policies for `2_staff_entitlements`
- ✅ Added proper policies for `master_users`

### 7. Frontend Updates
- ✅ `admin-dashboard.html` - Changed from getPublicUrl to createSignedUrl

## How to Apply

1. **Run the SQL script** in Supabase SQL Editor:
   ```
   fix_supabase_security.sql
   ```

2. **Move secrets to environment variables**:
   - Remove OPENAI_API_KEY from database
   - Remove SUPABASE_SERVICE_ROLE_KEY from database
   - Set these in Supabase Dashboard > Settings > Edge Functions > Secrets

3. **Verify the fixes** by running the verification query at the end of the SQL script

## Storage Path Structure Required

For multi-tenant isolation to work, files must be stored with site_id prefix:
- ✅ `<site_id>/filename.pdf`
- ✅ `complaints/<site_id>/uuid/filename.pdf`
- ❌ `filename.pdf` (no site isolation)

## What Changed

### Storage Access
- All sensitive buckets are now **private** (no public URLs)
- Frontend uses **signed URLs** (1 hour expiry) instead of public URLs
- Files are scoped by site_id in the path

### Database Access
- No anonymous access to any application tables
- All tables have RLS enabled
- Users can only see data from their own site
- Admins have elevated access where appropriate

### Secrets Management
- Database no longer stores API keys
- Must use environment variables for secrets

## Testing After Fix

1. Verify users can only see their own site's files
2. Verify anonymous users cannot access any storage buckets
3. Verify signed URLs work in the admin dashboard
4. Verify RLS policies are enforced on all tables
5. Check that no secrets remain in the database