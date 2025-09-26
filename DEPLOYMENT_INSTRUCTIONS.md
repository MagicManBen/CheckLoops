# Deployment Instructions

## NHS + CQC Integration Fix (December 2024)

### Deploy Updated Edge Function

```bash
supabase functions deploy fetch-nhs-data-complete
```

### How It Works

The `fetch-nhs-data-complete` function now properly handles both CQC and NHS ODS data:

**CQC Phase (`data_sources: ["cqc"]`):**
- Fetches full CQC location and provider data
- Saves raw JSON to `location_source` and `provider_source`
- Flattens all fields (address, phone, website, ratings, etc.)
- Extracts and saves `ods_code` from CQC data
- Returns `database_updated: true` on success

**ODS Phase (`data_sources: ["ods"]`):**
- Fetches NHS ODS data from Spine API
- Saves to `nhs_ods_data` column
- Updates `last_nhs_update` timestamp
- Flattens ODS fields without overwriting CQC data
- Returns `database_updated: true` on success

### Testing

1. Open `cqctest-detailed-full-fixed.html`
2. Search for a GP surgery
3. Click to open modal
4. Use the new buttons:
   - **"Run CQC → NHS (Sequential)"** - Runs both phases automatically
   - **"Run CQC Phase Only"** - Tests CQC fetch and save
   - **"Run ODS Phase Only"** - Tests NHS ODS fetch and save

### Verification

After running the sequential flow:
- `ods_code` populated from CQC data
- `nhs_ods_data` contains NHS JSON
- `last_nhs_update` has current timestamp
- Flattened fields populated (phone, website, address, etc.)
- Both `location_source` and `provider_source` contain CQC JSON

---

# Certificate Upload Feature - Deployment Instructions

## 1. Set Up Storage Bucket in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and run the entire contents of `supabase/setup-training-certificates.sql`
4. Verify the bucket was created:
   - Go to **Storage** section
   - You should see `training_certificates` bucket listed

## 2. Deploy Edge Function

### Option A: Using Supabase CLI (Recommended)

1. Install Supabase CLI if not already installed:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Initialize Supabase in your project (if not already done):
```bash
supabase init
```

4. Link to your project:
```bash
supabase link --project-ref unveoqnlqnobufhublyw
```

5. Deploy the edge function:
```bash
supabase functions deploy extract-certificate-v2
```

### Option B: Manual Deployment via Dashboard

1. Go to your Supabase Dashboard
2. Navigate to **Edge Functions**
3. Click **New Function**
4. Name it: `extract-certificate-v2`
5. Copy the entire contents of `supabase/functions/extract-certificate-v2/index.ts`
6. Paste into the function editor
7. Click **Deploy**

## 3. Configure Environment Variables

**CRITICAL: Set these in Supabase Dashboard, NOT in code**

1. Go to your Supabase Dashboard
2. Navigate to **Edge Functions** → **extract-certificate-v2**
3. Click on **Settings** → **Secrets**
4. Add the following environment variables:

```
OPENAI_API_KEY=sk-proj-YOUR_ACTUAL_KEY_HERE
```

**Note:** Replace with your actual OpenAI API key (starts with `sk-proj-`). Never commit API keys to code.

**Alternative:** If you have an existing environment variable called `CheckLoopsAI`:
```
CheckLoopsAI=sk-proj-YOUR_ACTUAL_KEY_HERE
```

The function checks for both `OPENAI_API_KEY` and `CheckLoopsAI` variables.

## 4. Update Frontend Code (if needed)

The frontend is already configured to use the new endpoint. If you need to switch back to v1:

1. Edit `certificate-uploader.js`
2. Change line 356 from:
   ```javascript
   const apiEndpoint = `${supabaseUrl}/functions/v1/extract-certificate-v2`;
   ```
   To:
   ```javascript
   const apiEndpoint = `${supabaseUrl}/functions/v1/extract-certificate`;
   ```

## 5. Testing the Feature

1. Navigate to the Staff Training page
2. Look for the certificate upload dropzone above the training list
3. Drag and drop a training certificate (PDF, PNG, or JPG)
4. Open browser console to see debug logs
5. The system will:
   - Upload the file to Supabase storage
   - Extract text (client-side if PDF.js available, server-side otherwise)
   - Send to OpenAI for information extraction
   - Display confirmation dialog with extracted details
   - Save the training record upon confirmation

## 6. Debugging

### Check Debug Console
- Click the "Debug" button at bottom-left of the page
- Or run in browser console: `window.debugCertificateUpload()`

### Common Issues

**Deployment Errors:**
- **Syntax errors during deployment**: The function has been fixed to remove incompatible PDF parsing libraries
- **Missing dependencies**: Only uses standard Deno libraries and OpenAI SDK
- **Function not found (404)**: System automatically falls back to v1 endpoint

**PDF.js not loading:**
- The system will automatically fall back to server-side processing
- PDFs are converted to base64 and processed with GPT-4 Vision
- Check console for `[DEBUG] PDF.js` messages

**Storage bucket errors:**
- Verify bucket exists: Check Storage section in Supabase
- Run the SQL script again if needed

**Edge function errors:**
- Check Edge Functions logs in Supabase Dashboard
- Verify OPENAI_API_KEY is set correctly
- Check function deployment status

**Authentication errors:**
- Ensure user is logged in
- Check session token validity
- Verify user has site_id in metadata

## 7. Features

### What It Extracts:
- Person name
- Training name/course
- Completion date
- Expiry date (if available)
- Provider/organization
- Certificate ID
- Additional details

### Supported File Types:
- PDF (with or without PDF.js)
- PNG images
- JPG/JPEG images
- Max file size: 10MB

### Processing Methods:
- **Client-side:** PDF text extraction with PDF.js (faster)
- **Server-side:** Full PDF parsing and image OCR (more robust)
- **AI Models:** GPT-4o-mini for text, GPT-4o for images

## 8. Security Notes

- Never commit API keys to code
- Storage bucket uses RLS policies
- Users can only access certificates from their own site
- Edge function validates authentication
- Service role used only for server-side processing

## 9. Technical Details - V2 Changes

### What Changed in V2:
- **Removed problematic PDF parsing libraries** that were incompatible with Deno
- **PDFs are now processed as images** using GPT-4 Vision API
- **Simplified architecture** with better error handling
- **Automatic fallback** if PDF.js not available client-side

### How It Works:
1. **Client-side (if PDF.js available):**
   - Extracts text from PDF
   - Sends text to edge function
   - Uses GPT-4o-mini for fast processing

2. **Server-side (fallback):**
   - Fetches file from signed URL
   - Converts to base64
   - Uses GPT-4o Vision to read PDF/image
   - Extracts all certificate information

### Models Used:
- **GPT-4o-mini**: For text extraction (fast, cheap)
- **GPT-4o**: For image/PDF vision processing (accurate OCR)

## 10. Monitoring

Check these regularly:
- Edge Function invocations and logs
- Storage usage for training_certificates bucket
- OpenAI API usage and costs
- Error rates in browser console logs