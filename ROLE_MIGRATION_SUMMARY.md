# Role Migration Summary - CheckLoop

## Problem Solved
The codebase had confusion between two types of "roles":
1. **Account Roles**: Permission levels (admin, staff, owner)
2. **Job Roles**: Professional positions (GP, Nurse, Pharmacist, etc.)

Both were using the same `role` field, causing authentication and display issues.

## Changes Implemented

### 1. Database Schema Changes
Created migration scripts:
- `migration_fix_role_confusion.sql` - Complete migration (fixed)
- `migration_fix_role_confusion_step_by_step.sql` - Step-by-step version for debugging
- Added `account_role` column to `profiles` table (for admin/staff/owner)
- Added `account_role` and `job_role` columns to `site_invites` table
- Added `job_role` column to `kiosk_users` table
- Added `job_role` and `display_name` columns to `staff_app_welcome` table
- Created new `kiosk_job_roles` table for job role management

### 2. HTML/JavaScript Updates

#### admin-dashboard.html
- Updated all permission checks to use both `account_role` (new) and `role` (old) for backward compatibility
- Modified `checkAdminRole()` function to check both fields
- Updated user role verification in bootstrap process
- Fixed role checks in multiple locations throughout the file

#### staff.html
- Updated admin panel visibility check to use `account_role`
- Modified job role display to use `job_role` from metadata or `role_detail`
- Maintained backward compatibility with existing data

#### staff-welcome.html
- Already properly handles `display_name` via nickname field
- Stores job roles in `role_detail` field
- No changes needed - already correctly structured

### 3. Migration Tool
Created `run_migration_fix_roles.html`:
- Interactive web tool for running the migration
- Checks current schema status
- Provides step-by-step migration process
- Includes verification and rollback options

## How to Apply the Migration

### Step 1: Run the SQL Migration
1. Open Supabase Dashboard
2. Go to SQL Editor
3. **RECOMMENDED**: Use `migration_fix_role_confusion_step_by_step.sql`
   - Run each section separately to identify any issues
   - Each section includes verification queries
   - Easier to debug if problems occur
4. **Alternative**: Run the complete `migration_fix_role_confusion.sql` script

**Note**: The original error with `kiosk_roles.site_id` has been fixed. The `kiosk_roles` table doesn't have a `site_id` column, so the migration now correctly handles this

### Step 2: Verify the Migration
1. Open `run_migration_fix_roles.html` in your browser
2. Click "Check Current Schema" to verify new columns exist
3. Click "Verify Migration" to check data migration

### Step 3: Test the Application
1. Log in as benhowardmagic@hotmail.com
2. Admin functions should now work correctly
3. The "Admin" label should display properly
4. Fix Admin Permissions button should recognize admin status

## Backward Compatibility
All code changes maintain backward compatibility:
- Checks both `account_role` (new) and `role` (old) fields
- Falls back to old field if new field doesn't exist
- No breaking changes for existing data

## Data Structure After Migration

### Account Roles (for permissions)
- `admin` - Full administrative access
- `staff` - Regular staff access
- `owner` - Owner-level access

### Job Roles (for work position)
- GP, Nurse, Pharmacist, Health Care Assistant, GP Assistant, Reception, Admin, Manager, etc.

### Names
- `full_name` - Official name entered by admin during invitation (database records)
- `display_name` - User's preferred name from onboarding (UI display only)

## Benefits
1. Clear separation of permission roles from job positions
2. No more confusion in role checks
3. Admin permissions work correctly
4. Job roles display properly in UI
5. Maintains all existing functionality

## Known Issues Fixed

### kiosk_roles.site_id Error
**Error**: `column "site_id" does not exist`
**Cause**: The `kiosk_roles` table only has a `role` column, no `site_id`
**Fix**: Modified migration to not reference `site_id` from `kiosk_roles`

## Rollback Plan
If needed, rollback can be performed:
```sql
ALTER TABLE public.profiles DROP COLUMN IF EXISTS account_role;
ALTER TABLE public.site_invites DROP COLUMN IF EXISTS account_role;
ALTER TABLE public.site_invites DROP COLUMN IF EXISTS job_role;
ALTER TABLE public.kiosk_users DROP COLUMN IF EXISTS job_role;
ALTER TABLE public.staff_app_welcome DROP COLUMN IF EXISTS job_role;
ALTER TABLE public.staff_app_welcome DROP COLUMN IF EXISTS display_name;
DROP TABLE IF EXISTS public.kiosk_job_roles;
```

## Testing Checklist
- [ ] Admin login works (benhowardmagic@hotmail.com)
- [ ] Admin label displays correctly
- [ ] Fix Admin Permissions recognizes admin role
- [ ] Staff can see their job roles
- [ ] Invitation process works with correct role assignment
- [ ] Staff welcome process saves display names correctly