# FINAL Instructions to Delete ben.howard@stoke.nhs.uk

## The Problem
The error shows that `quiz_attempts` table has data for this user that's preventing deletion due to foreign key constraint `quiz_attempts_user_id_fkey`.

## Solution Steps

### Step 1: First Check What Data Exists
Run `check_foreign_keys.sql` to see exactly what tables have data for this user.

### Step 2: Use the Specific Delete Script
Run `delete_user_specific.sql` - this script:
1. **FIRST deletes from quiz_attempts** (the blocker)
2. Then deletes from all other tables in correct order
3. Finally deletes the user from auth.users

### Step 3: If Still Failing, Use Force Delete
Run `force_delete_user.sql` which:
- Uses a transaction
- Handles tables that might not exist
- More aggressively ensures all data is deleted

## Quick Commands to Run in Order

```sql
-- 1. Delete quiz data FIRST (this is what's blocking you)
DELETE FROM quiz_attempts WHERE user_id = '0c465189-6b8b-4011-89cc-32dc7e863986';
DELETE FROM practice_quiz_attempts WHERE user_id = '0c465189-6b8b-4011-89cc-32dc7e863986';

-- 2. Verify quiz data is gone
SELECT COUNT(*) FROM quiz_attempts WHERE user_id = '0c465189-6b8b-4011-89cc-32dc7e863986';
-- Should return 0

-- 3. Now you can delete from Supabase Auth UI
-- Or continue with the script to delete everything via SQL
```

## If Deleting from Supabase UI

After running the quiz deletion commands above, you should be able to:
1. Go to Authentication > Users in Supabase
2. Find ben.howard@stoke.nhs.uk
3. Click delete - it should work now

## Files Created

1. **delete_user_specific.sql** - Complete deletion for this specific user ID
2. **force_delete_user.sql** - Aggressive deletion with transaction
3. **check_foreign_keys.sql** - Diagnostic to see what's blocking

## The Key Issue

**quiz_attempts** table has foreign key constraint to auth.users. This data MUST be deleted first before the user can be deleted. The scripts handle this by deleting quiz data as the very first step.