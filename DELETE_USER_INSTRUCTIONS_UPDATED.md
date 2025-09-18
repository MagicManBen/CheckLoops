# Instructions to Delete User ben.howard@stoke.nhs.uk

## ⚠️ IMPORTANT: Column Issue Fixed

The error you encountered shows that `auth_user_id` column doesn't exist in `user_achievements` table yet. I've created fixed versions that handle this.

## Recommended Method

### Use the Quick Delete Script (delete_user_quick.sql)

1. Open Supabase SQL Editor
2. Copy and paste the entire contents of `delete_user_quick.sql`
3. Run all the DELETE statements
4. Check the final verification message

This script:
- ✅ Works without auth_user_id column
- ✅ Deletes all user data in correct order
- ✅ Uses subqueries so you don't need to copy/paste UUIDs

## Alternative: Fixed Automated Script

If you prefer the automated approach:
1. Open Supabase SQL Editor
2. Copy and paste contents of `delete_user_ben_howard_fixed.sql`
3. Click "Run"

This script:
- ✅ Automatically checks if auth_user_id column exists
- ✅ Uses appropriate deletion method based on your schema
- ✅ Provides detailed status messages

## What Gets Deleted

- ✅ Auth user account
- ✅ Profile data
- ✅ Master users record (if table exists)
- ✅ Achievements (via kiosk_user_id)
- ✅ Quiz attempts
- ✅ Holiday profiles
- ✅ Staff welcome data
- ✅ Site invites
- ✅ Sessions and tokens

## After Successful Deletion

You can now:
1. Invite ben.howard@stoke.nhs.uk fresh from admin dashboard
2. Test complete onboarding flow
3. Verify achievements work properly

## Note About Achievements

Since `auth_user_id` column doesn't exist yet in your `user_achievements` table, achievements are only being tracked by `kiosk_user_id`. After deleting the user and before testing again, you may want to run the achievement fix SQL to add the auth_user_id column for better tracking.