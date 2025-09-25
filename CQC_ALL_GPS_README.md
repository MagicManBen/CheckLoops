# CQC All GPs Integration

This integration creates a denormalized table of GP practices in England with data from the CQC API. The table contains detailed information about each practice, including location details, provider information, ratings, and reports.

## Table of Contents

- [Setup Instructions](#setup-instructions)
- [Deployment](#deployment)
- [Usage](#usage)
- [Verification](#verification)
- [Structure](#structure)

## Setup Instructions

### 1. Set Supabase Secrets

First, set the required Supabase secrets for the CQC API key:

```bash
# Set CQC API Key
supabase secrets set CQC_API_KEY=5b91c30763b4466e89727c0c555e47a6
```

### 2. Deploy SQL Migration

Run the migration to create the `"CQC All GPs"` table:

```bash
# Deploy the migration
supabase migration up 20250925_create_cqc_all_gps
```

### 3. Deploy Edge Function

Deploy the Edge Function to your Supabase project:

```bash
# Deploy the function
supabase functions deploy sync-cqc-all-gps
```

## Deployment

### Manual Deployment via Supabase CLI

```bash
# Deploy with Supabase CLI
cd /Users/benhoward/Desktop/CheckLoop/CheckLoops
supabase functions deploy sync-cqc-all-gps
```

## Usage

### Full Sync Mode

To perform a full synchronization of all GP practices:

```bash
# Full sync mode - fetches all GP practices
curl -X GET "https://unveoqnlqnobufhublyw.functions.supabase.co/sync-cqc-all-gps?mode=full" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME" \
  -H "Content-Type: application/json"
```

### Delta Sync Mode

To perform an incremental sync of changes since a specific time:

```bash
# Delta sync mode - only fetches changes since specified time
curl -X GET "https://unveoqnlqnobufhublyw.functions.supabase.co/sync-cqc-all-gps?mode=delta&startTimestamp=2025-09-01T00:00:00Z" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME" \
  -H "Content-Type: application/json"
```

You can also specify an end timestamp:

```bash
# Delta sync with end timestamp
curl -X GET "https://unveoqnlqnobufhublyw.functions.supabase.co/sync-cqc-all-gps?mode=delta&startTimestamp=2025-09-01T00:00:00Z&endTimestamp=2025-09-25T00:00:00Z" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME" \
  -H "Content-Type: application/json"
```

## Verification

After running the sync, you can verify the data has been imported correctly with these SQL queries:

### Count total number of GP practices

```sql
SELECT COUNT(*) FROM public."CQC All GPs";
```

### Sample lookup by postcode

```sql
SELECT 
  location_id, 
  location_name, 
  address_line_1, 
  postcode, 
  overall_rating,
  last_inspection_date
FROM public."CQC All GPs"
WHERE postcode LIKE 'SW1%'
ORDER BY postcode
LIMIT 10;
```

### Search by GP practice name

```sql
SELECT 
  location_id, 
  location_name, 
  address_line_1, 
  town_city,
  postcode, 
  overall_rating
FROM public."CQC All GPs"
WHERE location_name ILIKE '%health centre%'
LIMIT 10;
```

### Check distribution of ratings

```sql
SELECT 
  overall_rating, 
  COUNT(*) as count
FROM public."CQC All GPs"
GROUP BY overall_rating
ORDER BY COUNT(*) DESC;
```

## Structure

### Database Table

The `"CQC All GPs"` table is structured as follows:

- `location_id`: Primary key - CQC location ID
- `location_name`: Name of the GP practice
- `address_line_1`, `address_line_2`: Address components
- `town_city`, `county`, `region`, `postcode`: Location details
- `latitude`, `longitude`: Geographical coordinates
- `provider_id`: CQC provider ID for the organization
- `overall_rating`: Current overall rating
- `last_inspection_date`: Date of most recent inspection
- `registration_date`, `closure_date`: Administrative dates
- `location_source`, `provider_source`: Raw JSON data from API
- `ratings`, `regulated_activities`, `contacts`, `inspection_areas`: Nested JSON data
- `reports`: Array of report metadata objects
- `created_at`, `updated_at`, `last_seen_at`: Book-keeping timestamps

### Edge Function

The Edge Function supports two modes:

- `full`: Fetches all GP practices and their related data
- `delta`: Fetches only changes since a specified timestamp

Parameters:
- `mode`: `full` or `delta` (required)
- `startTimestamp`: Required for delta mode, ISO8601 format (e.g., `2025-09-01T00:00:00Z`)
- `endTimestamp`: Optional for delta mode, ISO8601 format