# Instructions to Delete User ben.howard@stoke.nhs.uk

## Quick Method (Recommended)

1. Open Supabase SQL Editor
2. Copy and paste the entire contents of `delete_user_ben_howard.sql`
3. Click "Run"
4. Check the output messages to confirm deletion

## Alternative Method (If Quick Method Fails)

1. Open Supabase SQL Editor
2. First run this to get the user ID:
   ```sql
   SELECT id FROM auth.users WHERE email = 'ben.howard@stoke.nhs.uk';
   ```
3. Copy the UUID that appears (something like `a1234567-89ab-cdef-0123-456789abcdef`)
4. Open `delete_user_simple.sql`
5. Replace all instances of `YOUR_USER_ID_HERE` with the actual UUID
6. Run each DELETE statement one by one

## What Gets Deleted

- ✅ Auth user account
- ✅ Profile data
- ✅ Master users record
- ✅ Achievements
- ✅ Quiz attempts
- ✅ Holiday profiles
- ✅ Welcome data
- ✅ Invites
- ✅ Sessions and tokens
- ✅ Any linked kiosk user data

## After Deletion

You can now:
1. Invite ben.howard@stoke.nhs.uk fresh from the admin dashboard
2. Test the complete onboarding flow
3. Verify achievements unlock properly

## Troubleshooting

If you get foreign key constraint errors:
- The script already handles deletion order
- But if issues persist, check for any custom triggers or constraints in your database

If the user still exists after running the script:
- Check the output messages for any errors
- Try the alternative method with manual deletion
- Ensure you have proper permissions to delete from auth.users