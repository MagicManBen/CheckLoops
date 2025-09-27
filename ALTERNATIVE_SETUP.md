# Alternative Setup: Using Supabase Dashboard

Since you're getting permission errors with SQL policies, let's use the Supabase Dashboard instead:

## 🎯 **Method 1: Dashboard Setup (Recommended)**

### Step 1: Create Storage Bucket
1. Go to **Supabase Dashboard** → **Storage**
2. Click **"New Bucket"**
3. Set:
   - **Name**: `training_certificates`
   - **Public**: `false` (private)
   - **File size limit**: `10 MB`
   - **Allowed MIME types**: `image/png, image/jpeg, application/pdf`

### Step 2: Configure RLS Policies
1. In **Storage** → **Policies** → **training_certificates**
2. Click **"New Policy"**
3. Create policy:
   - **Policy Name**: "Allow authenticated uploads"
   - **Allowed operation**: `INSERT`
   - **Target roles**: `authenticated`
   - **USING expression**: `true`
   - **WITH CHECK expression**: `true`

4. Create another policy:
   - **Policy Name**: "Allow authenticated reads"
   - **Allowed operation**: `SELECT`
   - **Target roles**: `authenticated` 
   - **USING expression**: `true`

## 🎯 **Method 2: Try Basic SQL First**

Run **only the bucket creation** part:

```sql
INSERT INTO storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types, avif_autodetection
) VALUES (
  'training_certificates', 'training_certificates', false, 10485760,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'], false
) ON CONFLICT (id) DO NOTHING;
```

## 🎯 **Method 3: Test Without Policies**

The certificate upload system might work even without explicit policies if:
- The bucket exists
- You're authenticated
- Supabase has default storage policies

## 🧪 **Test It Now:**

1. Try **Method 2** (just create the bucket)
2. **Open** `staff-training.html` 
3. **Upload** your PDF certificate
4. **Check console** for `[PDF-IMG]` logs
5. If it works → Great! If not → Use **Method 1** (Dashboard)

## 🔍 **Debug Upload Issues:**

If upload fails, check the error message:
- `"Failed to upload certificate"` → Bucket doesn't exist
- `"Not authenticated"` → Login required
- `"Row Level Security"` → Need policies (use Method 1)

The system should work once the bucket exists, even without custom policies in most cases!