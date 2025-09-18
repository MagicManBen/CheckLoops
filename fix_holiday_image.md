# Fix Holiday Image Display

## Issue Found
The image generation is working (it successfully calls OpenAI and gets an image URL), but the image can't be saved or displayed because the `holiday_image_url` column doesn't exist in the database.

## Steps to Fix:

### 1. Add the missing column to your Supabase database
Run this SQL in your Supabase SQL Editor (https://unveoqnlqnobufhublyw.supabase.co):

```sql
-- Add holiday_image_url column to 4_holiday_requests table
ALTER TABLE "4_holiday_requests"
ADD COLUMN IF NOT EXISTS holiday_image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN "4_holiday_requests".holiday_image_url IS 'URL of AI-generated image showing user avatar on holiday at their destination';
```

### 2. Deploy the updated Edge Function
The Edge Function at `/supabase/functions/generate-holiday-avatar/index.ts` has been updated to:
- Use DALL-E-2 (cheaper model)
- Generate 512x512 images (smaller for thumbnails)
- Parse destination from reason text
- Save the image URL to the database

Deploy it using:
```bash
supabase functions deploy generate-holiday-avatar
```

### 3. Test Again
After running the SQL and deploying the function:
1. Go back to my-holidays.html
2. Create a new holiday request with a destination like "Going to Spain" or "Beach holiday in Bali"
3. The image should now appear under the reason text in your holiday request list

## What Changed:
- Added CSS styles for holiday image thumbnails
- Updated submission to trigger image generation
- Updated display to show generated images
- Edge Function now uses DALL-E-2 for cost efficiency