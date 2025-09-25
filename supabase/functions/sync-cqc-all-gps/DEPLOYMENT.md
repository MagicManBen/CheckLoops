# CQC GP Practice Integration: Deployment Guide

This guide provides step-by-step instructions for deploying the CQC GP Practice integration with Supabase. Follow these instructions to create the database table and deploy the Edge Function.

## Prerequisites

1. Supabase CLI installed locally
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   ```

2. Valid Supabase login
   ```bash
   supabase login
   ```

## Step 1: Create the Database Table

Execute the SQL migration file against your Supabase project. You have two options:

### Option A: Using the Supabase Dashboard (Recommended)

1. Navigate to [https://app.supabase.io](https://app.supabase.io)
2. Select your project
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"
5. Paste the entire contents of the `supabase/migrations/20250925_create_cqc_all_gps_table.sql` file into the SQL editor
6. Click "Run" to execute the migration

### Option B: Using the Supabase CLI

1. Link your local project to your Supabase project:
   ```bash
   supabase link --project-ref unveoqnlqnobufhublyw
   ```

2. Apply the migration:
   ```bash
   supabase db push
   ```

## Step 2: Deploy the Edge Function

Deploy the Edge Function using the Supabase CLI:

```bash
cd /Users/benhoward/Desktop/CheckLoop/CheckLoops
supabase functions deploy sync-cqc-all-gps --project-ref unveoqnlqnobufhublyw
```

## Step 3: Test the Deployment

After deploying, test the Edge Function with a full sync:

1. Get a JWT token for authentication (replace with your actual token):
   ```bash
   SUPABASE_TOKEN=$(curl -X POST 'https://unveoqnlqnobufhublyw.supabase.co/auth/v1/token?grant_type=password' \
     -H "apikey: YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"email":"YOUR_EMAIL", "password":"YOUR_PASSWORD"}' | jq -r '.access_token')
   ```

2. Trigger the full sync:
   ```bash
   curl -X POST 'https://unveoqnlqnobufhublyw.functions.supabase.co/sync-cqc-all-gps?mode=full' \
     -H "Authorization: Bearer $SUPABASE_TOKEN" \
     -H "Content-Type: application/json"
   ```

   Note: The full sync may take some time to complete depending on the number of GP practices.

## Step 4: Verify Data Import

Check that data has been successfully imported:

1. Go to the Supabase dashboard
2. Navigate to "Table Editor" in the left sidebar
3. Select the "CQC All GPs" table
4. Verify that records have been imported

Alternatively, you can run the following SQL query in the SQL Editor:

```sql
SELECT COUNT(*) FROM public."CQC All GPs";
```

## Scheduling Regular Syncs

For production use, set up a scheduled task to run the sync function at appropriate intervals:

1. Using GitHub Actions (example):
   ```yaml
   name: Scheduled CQC GP Sync
   on:
     schedule:
       - cron: '0 2 * * *' # Runs at 2 AM daily
   
   jobs:
     sync:
       runs-on: ubuntu-latest
       steps:
         - name: Trigger Full Sync
           run: |
             curl -X POST 'https://unveoqnlqnobufhublyw.functions.supabase.co/sync-cqc-all-gps?mode=full' \
               -H "Authorization: Bearer ${{ secrets.SUPABASE_JWT_TOKEN }}" \
               -H "Content-Type: application/json"
   ```

2. Using Supabase scheduled tasks (when available)

## Troubleshooting

### Common Issues

1. **Rate Limiting**: The CQC API might rate-limit requests. The Edge Function includes retry logic with exponential backoff.

2. **Function Timeout**: If the full sync takes too long, you might hit Edge Function timeouts. In this case:
   - Consider running the sync in chunks (e.g., by region)
   - Implement a continuation token mechanism

3. **Authentication Error**: Ensure your JWT token is valid and hasn't expired.

### Edge Function Logs

Check the Edge Function logs for detailed information:

```bash
supabase functions logs sync-cqc-all-gps --project-ref unveoqnlqnobufhublyw
```