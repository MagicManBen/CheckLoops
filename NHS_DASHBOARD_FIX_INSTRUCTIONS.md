# NHS GP Dashboard - Fix Instructions

## Issues Found & Fixed

### ✅ 1. Invalid Supabase API Key
**Problem:** The dashboard was using an incorrect API key format
**Solution:** Updated to correct anon key from your `.env` file

### ⚠️ 2. Edge Function Not Deployed
**Problem:** The edge function `fetch-nhs-data-complete` is not accessible
**Solution:** Need to deploy the edge function to Supabase

### ⚠️ 3. NHS Columns May Be Missing
**Problem:** The CQC table may not have NHS data columns
**Solution:** Need to add NHS columns to the CQC table

## Steps to Complete the Fix

### Step 1: Add NHS Columns to Database
1. Open Supabase Dashboard: https://supabase.com/dashboard/project/unveoqnlqnobufhublyw
2. Go to SQL Editor
3. Open and run: `ADD_NHS_COLUMNS_TO_CQC_TABLE.sql`
4. This will add NHS data columns to your CQC table

### Step 2: Deploy Edge Function
**Option A - Using the Script (Easiest):**
```bash
./deploy-nhs-edge-function.sh
```

**Option B - Manual Deployment:**
```bash
# Install Supabase CLI if needed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref unveoqnlqnobufhublyw

# Deploy the edge function
supabase functions deploy fetch-nhs-data-complete

# Check logs
supabase functions logs fetch-nhs-data-complete
```

### Step 3: Test the Dashboard
1. Open: `/Users/benhoward/Desktop/CheckLoop/checkloops/nhs-gp-dashboard-ultra-debug.html`
2. Click "Run Full Test" button
3. You should see:
   - ✅ Supabase Connection: Success
   - ✅ Database Tables: Available
   - ✅ Edge Functions: Deployed
   - ✅ Search results appearing
   - ✅ NHS data fetching when clicking on practices

## What You'll See When Working

The Ultra Debug Console will show every action:
```
[07:15:23.456] [#0001] [0.123s] [⚙️ SYSTEM] Dashboard initialized
[07:15:23.789] [#0002] [0.456s] [📤 API-SEND] [SUPABASE] Request initiated
[07:15:24.012] [#0003] [0.679s] [📥 API-RECV] [STATUS:200] Response received
[07:15:24.234] [#0004] [0.901s] [✅ SUCCESS] Connection successful
```

## API Keys & Credentials

All credentials are properly configured:
- **Supabase URL:** https://unveoqnlqnobufhublyw.supabase.co
- **Anon Key:** Loaded from `.env` file (correct key now in place)
- **CQC API Key:** 5b91c30763b4466e89727c0c555e47a6 (embedded in edge function)
- **Service Role Key:** Used securely in edge function only

## Troubleshooting

If you still see errors after deployment:

1. **Check Edge Function Status:**
   ```bash
   supabase functions list
   ```

2. **View Edge Function Logs:**
   ```bash
   supabase functions logs fetch-nhs-data-complete --tail
   ```

3. **Verify Database Columns:**
   Run this in SQL Editor:
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'CQC All GPs' AND column_name LIKE 'nhs_%';
   ```

4. **Test Edge Function Directly:**
   ```bash
   curl -X POST https://unveoqnlqnobufhublyw.supabase.co/functions/v1/fetch-nhs-data-complete \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"location_id": "1-101681804", "ods_code": "A81001"}'
   ```

## Files Created/Updated

1. **nhs-gp-dashboard-ultra-debug.html** - Fixed API key
2. **ADD_NHS_COLUMNS_TO_CQC_TABLE.sql** - SQL to add NHS columns
3. **deploy-nhs-edge-function.sh** - Deployment script
4. **NHS_DASHBOARD_FIX_INSTRUCTIONS.md** - This file

## Next Steps

After completing the deployment:
1. Test the full integration
2. Search for GP practices
3. Click on a practice to view details
4. Click "Fetch All NHS Data" to test the edge function
5. Send me any error logs if issues persist