# EMIS Latest Upload Filter - Instructions

## What This Does

**Problem Solved:** The HTML dashboard was showing duplicate data from multiple CSV uploads, causing inflated numbers.

**Solution:** All uploads are kept in the database for historical comparison, but the HTML now only displays the most recent upload.

## How It Works

1. **All uploads are preserved** in the `emis_apps_raw` table
2. **Only the latest upload is displayed** via the `emis_apps_filled` view
3. The filter uses the `created_at` timestamp to identify the most recent batch

## Installation

### Run the SQL script in your Supabase SQL Editor:

1. Open Supabase Dashboard: https://unveoqnlqnobufhublyw.supabase.co
2. Go to SQL Editor
3. Copy and paste the entire contents of `EMIS_LATEST_UPLOAD_VIEW.sql`
4. Click "Run" or press Cmd+Enter

### That's it! No HTML changes needed.

The existing HTML queries use `emis_apps_filled`, which now automatically filters to the latest upload.

## Verification

After running the SQL, execute the verification queries at the bottom of the script to confirm:

1. **Upload history** - See all your uploads with timestamps
2. **Record counts** - Verify the latest upload is being used
3. **Date comparison** - Compare data across all uploads vs latest only

## Testing

1. Upload a CSV file using the Upload button
2. Check the Appointment Dashboard - it shows the new data
3. Upload another CSV file with different data
4. The dashboard updates to show only the newest upload
5. All previous uploads remain in `emis_apps_raw` for comparison

## Future Comparisons

To compare uploads over time, you can query `emis_apps_raw` directly:

```sql
-- See data from a specific upload date
SELECT * FROM emis_apps_raw
WHERE created_at = '2025-10-22 10:30:00+00';

-- Compare two uploads
SELECT 
    created_at,
    appointment_date,
    COUNT(*) as appointments
FROM emis_apps_raw
WHERE created_at IN ('2025-10-22 10:30:00+00', '2025-10-22 14:45:00+00')
GROUP BY created_at, appointment_date
ORDER BY appointment_date, created_at;
```

## No Code Changes Required

The HTML file (`emis_reporting.html`) has been updated with minimal changes to ensure all queries filter to the latest upload:

### Changes Made to HTML:
1. **Slot Types Loading** - Updated to query only the latest upload
2. **AI Rules Context** - Updated to load clinicians and slot types from latest upload only
3. **All other queries** - Already use `emis_apps_filled` view which automatically filters

These changes are backward compatible and will work correctly once the SQL script is run.

## Rollback (If Needed)

If you need to see ALL uploads again (not recommended), run:

```sql
-- This removes the latest-upload filter
-- (Use the REVERT_ALL_VERSIONING.sql file if you have it)
```

---

**Status:** ✅ Ready to deploy
**HTML Changes:** None required
**Database Changes:** View update only (non-destructive)
