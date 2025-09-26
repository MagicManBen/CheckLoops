# 🚨 IMMEDIATE ACTION REQUIRED - NHS/CQC Integration Fix

## Quick Test Instructions

### 1. Deploy the Fixed Edge Function

```bash
supabase functions deploy fetch-nhs-data-complete
```

### 2. Test the Integration

1. Open `cqctest-detailed-full-fixed.html` in your browser
2. Search for any GP surgery (e.g., "london")
3. Click on a result to open the modal
4. Click **"Run CQC → NHS (Sequential)"** button
5. Watch the phases complete:
   - Phase 1: Fetches and saves CQC data
   - Phase 2: Fetches and saves NHS ODS data

### 3. Verify Success

Click "Show raw JSON" to see:
- `phase1_cqc` with `database_updated: true`
- `phase2_ods` with `database_updated: true`
- `updated_row` showing populated fields:
  - `ods_code` (extracted from CQC)
  - `nhs_ods_data` (NHS JSON)
  - `last_nhs_update` (timestamp)
  - Flattened fields (phone, website, address)

### What Was Fixed:
✅ CQC phase now saves ALL flattened fields (not just basic)
✅ ODS code extracted from CQC JSON automatically
✅ NHS ODS data properly saved to database
✅ Timestamps correctly updated
✅ Both raw JSON and flattened fields persisted

---

# 🚨 IMMEDIATE ACTION REQUIRED

## Step 1: Run SQL to Create Bucket

**Copy and paste ALL of this SQL into Supabase SQL Editor and execute:**

```sql
-- Create the training_certificates storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'training_certificates',
  'training_certificates',
  false,
  10485760,
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']::text[];

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create upload policy
CREATE POLICY "Users can upload training certificates"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'training_certificates');

-- Create view policy
CREATE POLICY "Users can view training certificates"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'training_certificates');

-- Create delete policy
CREATE POLICY "Users can delete training certificates"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'training_certificates');

-- Create update policy
CREATE POLICY "Users can update training certificates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'training_certificates');
```

## Step 2: Verify Bucket Created

After running the SQL above, go to:
1. Supabase Dashboard → **Storage**
2. You should see `training_certificates` in the list

## Step 3: Test Upload

Now try uploading a certificate again. It should work!

## What Was Fixed:
✅ Created the missing `training_certificates` bucket
✅ Fixed bucket name inconsistency (was using `training-certificates` with hyphen)
✅ Set up proper RLS policies for authenticated users
✅ Set 10MB file size limit and allowed PDF/PNG/JPG files

The upload should work now! 🎉