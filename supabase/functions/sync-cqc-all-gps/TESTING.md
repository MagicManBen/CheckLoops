# Testing Guide: CQC GP Practice Integration

This guide outlines how to test the CQC GP Practice integration with Supabase. Follow these steps to ensure your implementation is working correctly.

## 1. Prerequisites

- Access to your Supabase project dashboard
- A valid JWT token for authenticating with Edge Functions

## 2. Testing the Database Table Creation

First, verify that the database table was created successfully:

1. Go to the [Supabase Dashboard](https://app.supabase.io)
2. Select your project
3. Navigate to "Table Editor" in the left sidebar
4. Look for the "CQC All GPs" table in the list of tables

If the table exists, you should be able to see its structure by clicking on it. Verify that it has all the required columns:

- `location_id`
- `location_name`
- `address_line_1`
- `address_line_2`
- `town_city`
- `county`
- `region`
- `postcode`
- `latitude`
- `longitude`
- `provider_id`
- `overall_rating`
- `last_inspection_date`
- `registration_date`
- `closure_date`
- `location_source` (JSONB)
- `provider_source` (JSONB)
- `ratings` (JSONB)
- `regulated_activities` (JSONB)
- `contacts` (JSONB)
- `inspection_areas` (JSONB)
- `reports` (JSONB)
- `created_at`
- `updated_at`
- `last_seen_at`

You can also verify the table creation with the following SQL query:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'CQC All GPs';
```

## 3. Testing the Edge Function (Limited Test)

Before running a full sync (which may take a long time), let's test with a modified version that processes just a few records:

1. Get a JWT token for authentication:
   ```bash
   SUPABASE_TOKEN=$(curl -X POST 'https://unveoqnlqnobufhublyw.supabase.co/auth/v1/token?grant_type=password' \
     -H "apikey: YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"email":"YOUR_EMAIL", "password":"YOUR_PASSWORD"}' | jq -r '.access_token')
   ```

2. Update the Edge Function temporarily to limit the number of records processed (Optional):
   
   Modify the `fullSync` function to only process the first 5 locations:
   ```typescript
   async function fullSync(
     apiClient: CqcApiClient, 
     dataProcessor: DataProcessor, 
     dbInterface: DatabaseInterface, 
     stats: ProcessingStats
   ): Promise<void> {
     // Fetch all GP locations but limit to first 5 for testing
     const allLocations = await apiClient.fetchAllGpLocations();
     const locations = allLocations.slice(0, 5); // Limit to first 5
     stats.pagesTraversed = Math.ceil(locations.length / 500);
     
     // Rest of the function remains the same...
   }
   ```

   Deploy the modified function:
   ```bash
   supabase functions deploy sync-cqc-all-gps --project-ref unveoqnlqnobufhublyw
   ```

3. Trigger the limited test:
   ```bash
   curl -X POST 'https://unveoqnlqnobufhublyw.functions.supabase.co/sync-cqc-all-gps?mode=full' \
     -H "Authorization: Bearer $SUPABASE_TOKEN" \
     -H "Content-Type: application/json"
   ```

4. Check the function logs:
   ```bash
   supabase functions logs sync-cqc-all-gps --project-ref unveoqnlqnobufhublyw
   ```

5. Verify data import in the table:
   ```sql
   SELECT * FROM public."CQC All GPs" LIMIT 10;
   ```

## 4. Testing the Full Sync

Once you've verified the function works with a limited test, you can run the full sync:

1. If you modified the function for the limited test, revert those changes and redeploy

2. Trigger the full sync:
   ```bash
   curl -X POST 'https://unveoqnlqnobufhublyw.functions.supabase.co/sync-cqc-all-gps?mode=full' \
     -H "Authorization: Bearer $SUPABASE_TOKEN" \
     -H "Content-Type: application/json"
   ```

   Note: The full sync may take 30+ minutes to complete depending on the number of GP practices.

3. Monitor the progress:
   - Check the function logs periodically
   - Query the table to see how many records have been added:
     ```sql
     SELECT COUNT(*) FROM public."CQC All GPs";
     ```

4. Verify data completeness:
   ```sql
   -- Check distribution by region
   SELECT region, COUNT(*) 
   FROM public."CQC All GPs" 
   GROUP BY region 
   ORDER BY COUNT(*) DESC;
   
   -- Check ratings distribution
   SELECT overall_rating, COUNT(*) 
   FROM public."CQC All GPs" 
   GROUP BY overall_rating 
   ORDER BY COUNT(*) DESC;
   
   -- Check for any records with missing essential data
   SELECT COUNT(*) 
   FROM public."CQC All GPs" 
   WHERE location_name IS NULL OR location_id IS NULL;
   ```

## 5. Testing the Delta Sync

After a successful full sync, you can test the delta sync functionality:

1. Get the latest timestamp from the database:
   ```sql
   SELECT MAX(updated_at) FROM public."CQC All GPs";
   ```

2. Use that timestamp as the starting point for a delta sync:
   ```bash
   curl -X POST 'https://unveoqnlqnobufhublyw.functions.supabase.co/sync-cqc-all-gps?mode=delta&startTimestamp=2023-06-01T00:00:00Z' \
     -H "Authorization: Bearer $SUPABASE_TOKEN" \
     -H "Content-Type: application/json"
   ```

   Note: Replace the timestamp with the value you got from the query.

3. Check that only changes since that date were processed:
   ```sql
   SELECT COUNT(*) FROM public."CQC All GPs" WHERE updated_at > '2023-06-01T00:00:00Z';
   ```

## 6. Performance Validation

Check the performance characteristics of your implementation:

1. Query execution time:
   ```sql
   EXPLAIN ANALYZE SELECT * FROM public."CQC All GPs" WHERE postcode LIKE 'SW1%';
   ```

2. Index usage:
   ```sql
   SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'CQC All GPs';
   ```

3. Table statistics:
   ```sql
   SELECT 
     pg_size_pretty(pg_total_relation_size('"CQC All GPs"')) as total_size,
     pg_size_pretty(pg_relation_size('"CQC All GPs"')) as table_size,
     pg_size_pretty(pg_total_relation_size('"CQC All GPs"') - pg_relation_size('"CQC All GPs"')) as index_size;
   ```

## 7. Security Testing

1. Test the Row Level Security policy by querying from both authenticated and anonymous contexts:
   
   As anonymous:
   ```sql
   -- In the SQL Editor, select "anon" role
   SELECT COUNT(*) FROM public."CQC All GPs";
   ```

   As authenticated:
   ```sql
   -- In the SQL Editor, select your user role
   SELECT COUNT(*) FROM public."CQC All GPs";
   ```

2. Verify API access restrictions:
   ```bash
   # Should fail without authentication
   curl -X POST 'https://unveoqnlqnobufhublyw.functions.supabase.co/sync-cqc-all-gps?mode=full' \
     -H "Content-Type: application/json"
   ```

## 8. Error Recovery Testing

Test how the system handles errors:

1. Simulate API failure:
   - Temporarily modify the API key to an invalid value
   - Run the sync and verify it handles the error gracefully
   - Check the error reporting in the response

2. Test with invalid parameters:
   ```bash
   # Missing mode parameter
   curl -X POST 'https://unveoqnlqnobufhublyw.functions.supabase.co/sync-cqc-all-gps' \
     -H "Authorization: Bearer $SUPABASE_TOKEN" \
     -H "Content-Type: application/json"
   
   # Invalid mode parameter
   curl -X POST 'https://unveoqnlqnobufhublyw.functions.supabase.co/sync-cqc-all-gps?mode=invalid' \
     -H "Authorization: Bearer $SUPABASE_TOKEN" \
     -H "Content-Type: application/json"
   
   # Delta mode without startTimestamp
   curl -X POST 'https://unveoqnlqnobufhublyw.functions.supabase.co/sync-cqc-all-gps?mode=delta' \
     -H "Authorization: Bearer $SUPABASE_TOKEN" \
     -H "Content-Type: application/json"
   ```

## 9. Cleanup (For Testing Only)

If you need to reset the table for testing purposes:

```sql
TRUNCATE TABLE public."CQC All GPs";
```

Or to completely remove it:

```sql
DROP TABLE IF EXISTS public."CQC All GPs";
```

## 10. Production Readiness Checklist

- [x] Database table created with appropriate indexes
- [x] Edge Function deployed with hardcoded credentials
- [ ] Full sync tested and verified
- [ ] Delta sync tested and verified
- [ ] Row Level Security policy configured correctly
- [ ] Monitoring and alerting set up
- [ ] Regular sync schedule established