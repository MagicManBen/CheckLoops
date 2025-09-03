# Supabase Storage Setup for Training Certificates

## Step 1: Create the Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Configure the bucket:
   - **Name**: `training-certificates`
   - **Public**: ☑️ Make public (so certificates can be downloaded directly)
   - **File size limit**: 10 MB
   - **Allowed MIME types**: 
     ```
     application/pdf
     image/jpeg
     image/jpg
     image/png
     ```

## Step 2: Set Bucket Policies

After creating the bucket, you need to set up Row Level Security policies:

1. Go to **Storage** → **Policies**
2. Click **"New policy"** for the `training-certificates` bucket
3. Create the following policies:

### Policy 1: Allow authenticated users to upload
```sql
-- Policy name: "Allow authenticated users to upload training certificates"
-- Operation: INSERT
-- Target roles: authenticated

-- Policy definition:
((bucket_id = 'training-certificates') AND (auth.role() = 'authenticated'))
```

### Policy 2: Allow authenticated users to view certificates for their site
```sql
-- Policy name: "Allow users to view certificates for their site"  
-- Operation: SELECT
-- Target roles: authenticated

-- Policy definition:
((bucket_id = 'training-certificates') AND 
 (auth.role() = 'authenticated') AND 
 (name LIKE concat((
   SELECT site_id::text 
   FROM profiles 
   WHERE user_id = auth.uid()
 ), '/%')))
```

### Policy 3: Allow authenticated users to update certificates for their site
```sql
-- Policy name: "Allow users to update certificates for their site"
-- Operation: UPDATE
-- Target roles: authenticated

-- Policy definition:  
((bucket_id = 'training-certificates') AND 
 (auth.role() = 'authenticated') AND 
 (name LIKE concat((
   SELECT site_id::text 
   FROM profiles 
   WHERE user_id = auth.uid()
 ), '/%')))
```

### Policy 4: Allow authenticated users to delete certificates for their site
```sql
-- Policy name: "Allow users to delete certificates for their site"
-- Operation: DELETE
-- Target roles: authenticated

-- Policy definition:
((bucket_id = 'training-certificates') AND 
 (auth.role() = 'authenticated') AND 
 (name LIKE concat((
   SELECT site_id::text 
   FROM profiles 
   WHERE user_id = auth.uid()
 ), '/%')))
```

## Step 3: Test the Setup

1. Navigate to the **Training** page in your CheckLoop admin
2. Click on any cell in the training matrix
3. Try uploading a test certificate (PDF or image)
4. Verify the file appears in your Storage bucket
5. Test downloading the certificate

## File Naming Convention

The system automatically names uploaded files as:
```
{site_id}/training-{staff_id}-{training_type_id}-{timestamp}.{extension}
```

For example: `1/training-5-3-1693747200000.pdf`

## Troubleshooting

### Files not uploading?
- Check that the bucket policies are correctly set
- Verify the user is authenticated
- Check browser console for errors

### Files not visible?
- Ensure the bucket is set to "Public"
- Check the SELECT policy allows access
- Verify the file path structure matches the policies

### File size errors?
- Default limit is 10MB - increase in bucket settings if needed
- Check the file type is allowed (PDF, JPG, PNG)

## Optional: Set up automatic cleanup

You can set up a database function to automatically clean up old certificates when training records are deleted:

```sql
CREATE OR REPLACE FUNCTION cleanup_training_certificate()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete the certificate file from storage when the record is deleted
    IF OLD.certificate_url IS NOT NULL THEN
        PERFORM storage.delete(array[replace(OLD.certificate_url, 
            concat(current_setting('app.settings.supabase_url'), '/storage/v1/object/public/training-certificates/'), 
            '')
        ]);
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_certificate_on_delete
    AFTER DELETE ON training_records
    FOR EACH ROW EXECUTE FUNCTION cleanup_training_certificate();
```

This ensures that when a training record is deleted, the associated certificate file is also removed from storage.
