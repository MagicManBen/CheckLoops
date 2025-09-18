# User Deactivation Implementation

## Overview
This implementation allows admins to deactivate users, preventing them from logging in while preserving all their data in the system.

## What Was Fixed

### The Problem
The original "Deactivate" button was **completely broken** because:
- It tried to set `profiles.active = false` 
- But the `active` column didn't exist in the database
- Users remained fully functional despite clicking "Deactivate"

### The Solution
1. **Added `active` column to profiles table**
2. **Fixed deactivate function** to properly set `active = false`
3. **Added login prevention** checks in authentication flows
4. **Added reactivate functionality** to undo deactivation
5. **Updated UI** to show user status and appropriate buttons

## How It Works

### When You Click "Deactivate":
1. Shows confirmation: "Are you sure you want to deactivate this user? This will prevent them from logging in but preserve all their data."
2. Sets `active = false` in the `profiles` table
3. User can no longer log into any part of the system
4. **All data is preserved** (profiles, kiosk_users, auth.users, etc.)
5. Shows success message and updates UI

### When You Click "Reactivate":
1. Shows confirmation: "Are you sure you want to reactivate this user? This will allow them to log in again."
2. Sets `active = true` in the `profiles` table  
3. User can now log in normally again
4. Shows success message and updates UI

### What Happens During Login:
- **Staff pages**: `requireStaffSession()` checks `active` column and blocks with `USER_DEACTIVATED` error
- **Admin pages**: Profile loading checks `active` column and blocks with "User account has been deactivated" error
- **Deactivated users** see appropriate error messages and cannot access the system

## Files Modified

### Database
- `supabase/migrations/20250911000000_add_active_column_to_profiles.sql` - Adds active column
- `add_active_column.sql` - Manual SQL script for applying the change

### Frontend
- `admin.html` - Updated deactivate function, added reactivate function, updated UI
- `admin-dashboard.html` - Same updates as admin.html  
- `staff-common.js` - Added active check to `requireStaffSession()`

### Test Files
- `test_deactivation.js` - Automated test for the functionality

## Database Changes

```sql
-- Add active column with default true
ALTER TABLE public.profiles 
ADD COLUMN active boolean DEFAULT true NOT NULL;

-- Add index for performance
CREATE INDEX idx_profiles_active ON public.profiles(active);
```

## Key Features

### Visual Indicators
- **Active users**: Green "Active" status chip, "Deactivate" button
- **Deactivated users**: Red "Deactivated" status chip, blue "Reactivate" button  
- **Invited users**: Yellow "Invited" status chip, "Cancel Invite" button

### Security
- Authentication flows check the `active` column
- Deactivated users cannot bypass the login prevention
- All admin actions are properly scoped to the correct site

### Data Preservation
- **User stays in**: auth.users, profiles, kiosk_users, and all other tables
- **Nothing is deleted** - only login access is blocked
- **Easy to undo** with the Reactivate button

## Installation Steps

1. **Apply database migration**:
   ```bash
   # Option 1: Via Supabase CLI (if working)
   supabase db push
   
   # Option 2: Manual SQL execution
   # Run the contents of add_active_column.sql in Supabase SQL editor
   ```

2. **Test the functionality**:
   ```bash
   node test_deactivation.js
   ```

3. **Verify it works**:
   - Login as admin
   - Try deactivating a user
   - Verify they can't login
   - Try reactivating them
   - Verify they can login again

## Difference vs Cancel Invite

| Feature | Cancel Invite | Deactivate User |
|---------|--------------|----------------|
| **Target** | Pending invitations only | Active users only |
| **What it does** | Completely removes all traces from system | Blocks login, preserves all data |
| **Reversible** | No - user is completely removed | Yes - can reactivate anytime |
| **Data impact** | Deletes from auth.users, kiosk_users, site_invites | Only sets active=false |
| **When to use** | User hasn't accepted invitation yet | User is active but needs access removed |

This implementation provides a proper, secure, and reversible way to manage user access while maintaining data integrity.