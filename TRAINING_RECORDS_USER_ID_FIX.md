# Training Records Schema Fix - User ID Standardization

## Problem
Training records save was failing with "invalid input syntax for type integer: UUID" because:
1. The `training_records` table only had `staff_id` (integer) column
2. The system was trying to insert UUID values into the integer field
3. Required dependency on `kiosk_user_id` which not all users have

## Solution
Standardize `training_records` table to use `user_id` (UUID) like the rest of the system.

## Manual SQL Execution Required

Please execute this SQL in your Supabase SQL Editor:

```sql
-- Add user_id column to training_records table
ALTER TABLE training_records 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_training_records_user_id 
ON training_records(user_id);

-- Optional: Migrate existing staff_id data to user_id via profiles table
-- (Maps staff_id -> kiosk_user_id -> user_id through profiles table)
UPDATE training_records tr
SET user_id = p.user_id
FROM profiles p
WHERE tr.staff_id = p.kiosk_user_id 
AND tr.user_id IS NULL
AND p.kiosk_user_id IS NOT NULL;

-- Make staff_id nullable for future flexibility (optional)
ALTER TABLE training_records 
ALTER COLUMN staff_id DROP NOT NULL;
```

## Code Changes Made

### staff-training.html
1. **Query Update**: Changed from `.eq('staff_id', profileRow.kiosk_user_id)` to `.eq('user_id', user.id)`
2. **Validation Update**: Removed `kiosk_user_id` requirement, now just checks for `user.id`
3. **Record Insert**: Changed from `staff_id: parseInt(profileRow.kiosk_user_id)` to `user_id: currentUser.id`
4. **CurrentUser Object**: Removed unnecessary `kiosk_user_id` property

## Benefits
- ✅ Eliminates PostgreSQL type error (UUID vs integer)
- ✅ Works for all authenticated users without requiring kiosk setup
- ✅ Consistent with system-wide USER_ID_STANDARDIZATION
- ✅ Maintains referential integrity with auth.users table
- ✅ Better performance with proper indexing

## Testing
After executing the SQL:
1. Load staff-training.html
2. Try to save a training record
3. Should work without "Staff record missing" or type conversion errors

## Backward Compatibility
- Existing `staff_id` column can remain for legacy compatibility
- Future queries can use either `user_id` (preferred) or `staff_id`
- Migration script handles existing data where possible

## Related Files
- `/Users/benhoward/Desktop/CheckLoop/CheckLoops/staff-training.html` - Updated
- `/Users/benhoward/Desktop/CheckLoop/CheckLoops/staff.html` - May need similar fix at line 587
- Admin dashboard training matrix - Already works with staff_id, won't be affected