# Setup Instructions for Avatar Emotion Changes

## The Problem
The error `relation "public.avatar_emotion_changes" does not exist` means the table hasn't been created yet.

Additionally, when it is created, there's a type mismatch error:
- `master_users.site_id` is an INTEGER
- `activity_likes.site_id` is TEXT
- We need `avatar_emotion_changes.site_id` to be TEXT with proper type casting in RLS policies

## The Solution

### Step 1: Create the Table
Run this SQL in your Supabase SQL Editor:

**File: `create_avatar_emotion_changes_SIMPLE.sql`**

```sql
-- Create the avatar_emotion_changes table
CREATE TABLE IF NOT EXISTS public.avatar_emotion_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_id TEXT NOT NULL,  -- TEXT to match activity_likes
  mood TEXT NOT NULL,
  mood_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_avatar_emotion_changes_user_id ON public.avatar_emotion_changes(user_id);
CREATE INDEX IF NOT EXISTS idx_avatar_emotion_changes_site_id ON public.avatar_emotion_changes(site_id);
CREATE INDEX IF NOT EXISTS idx_avatar_emotion_changes_created_at ON public.avatar_emotion_changes(created_at DESC);

-- Enable RLS
ALTER TABLE public.avatar_emotion_changes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view avatar changes in their site" ON public.avatar_emotion_changes;
DROP POLICY IF EXISTS "Users can insert their own avatar changes" ON public.avatar_emotion_changes;

-- Create SELECT policy with type casting
CREATE POLICY "Users can view avatar changes in their site"
ON public.avatar_emotion_changes
FOR SELECT
USING (
  site_id IN (
    SELECT site_id::TEXT  -- CRITICAL: Cast INTEGER to TEXT
    FROM public.master_users
    WHERE auth_user_id = auth.uid()
  )
);

-- Create INSERT policy
CREATE POLICY "Users can insert their own avatar changes"
ON public.avatar_emotion_changes
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Grant permissions
GRANT ALL ON public.avatar_emotion_changes TO authenticated;
GRANT ALL ON public.avatar_emotion_changes TO service_role;
GRANT ALL ON public.avatar_emotion_changes TO anon;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.avatar_emotion_changes;
```

### Step 2: Verify the Table
Run the verification script to ensure everything is set up correctly:

**File: `verify_avatar_emotion_table.sql`**

This will check:
- Table structure
- Indexes
- RLS status
- Policies
- Realtime status
- Type casting

### Step 3: Test the Features
After running the SQL:

1. **Test Love Heart Tooltips:**
   - Double-click an activity to like it
   - Click on the heart to see who liked it
   - Should show avatar and nickname

2. **Test Avatar Emotion Updates:**
   - Change your avatar emotion
   - Should immediately appear in the activity feed
   - All avatars across the page should update

## Key Points

1. **Type Casting is Critical:** The `site_id::TEXT` cast in the RLS policy converts INTEGER to TEXT for comparison

2. **Table Must Exist First:** The table must be created via SQL before the feature will work

3. **Realtime Updates:** The table is added to the realtime publication for instant updates

4. **Already Fixed in Code:**
   - JavaScript code now properly converts site_id to String()
   - Removed automatic table creation attempts
   - Added proper error messages

## Troubleshooting

If you get errors:

1. **"relation does not exist"** - Run the create table SQL script
2. **"operator does not exist: text = integer"** - Make sure the policy has `site_id::TEXT` casting
3. **Realtime not working** - Check if the table is in the supabase_realtime publication
4. **RLS errors** - Verify you're logged in and your user has a site_id in master_users

## Files Changed
- `staff.html` - Updated to handle types correctly, removed auto-create
- `activity-likes-tooltips.js` - Fixed to work with click events
- `activity-likes.js` - Prevented double-click conflicts