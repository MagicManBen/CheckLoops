# EMIS Data Upload - Latest Upload Filter

## Problem
Previously, when uploading CSV files:
- All data was appended to `emis_apps_raw` (keeping old + new)
- The `emis_apps_filled` view showed ALL historical data
- Dashboard counts would **double** if you uploaded the same file twice
- No way to distinguish between old and new uploads

## Solution
Modified the system to:
✅ **Keep all historical uploads** in `emis_apps_raw` for auditing
✅ **Only display the latest upload** in `emis_apps_filled` view
✅ **Prevent duplicate counts** when re-uploading data
✅ **Enable future change tracking** by comparing upload timestamps

## Changes Made

### 1. Edge Function Update (`emis-upload/index.ts`)
- Added a shared `uploadTimestamp` for each batch upload
- Each record now gets the same `created_at` timestamp within a single upload
- This allows identifying which records belong to the same upload batch

**Code Change:**
```typescript
const uploadTimestamp = new Date().toISOString();
// ... then for each record:
processedRecord['created_at'] = uploadTimestamp;
```

### 2. Database View Update (`emis_apps_filled`)
- Modified the view to filter only the most recent `created_at` per site
- Uses a CTE (Common Table Expression) to find the latest upload timestamp
- Then joins to only show rows from that latest upload

**SQL Logic:**
```sql
WITH latest_upload AS (
  SELECT site_id, MAX(created_at) as latest_created_at
  FROM emis_apps_raw
  GROUP BY site_id
)
SELECT ... FROM emis_apps_raw
INNER JOIN latest_upload ON ... AND created_at = latest_created_at
```

## How It Works

### Before (Old Behavior):
1. **Day 1**: Upload 100 appointments → Dashboard shows **100 ✅**
2. **Day 2**: Upload same 100 appointments → Dashboard shows **200 ❌** (duplicates!)
3. Data accumulates forever, counts get inflated

### After (New Behavior):
1. **Day 1**: Upload 100 appointments → Dashboard shows **100 ✅**
2. **Day 2**: Upload same 100 appointments → Dashboard shows **100 ✅** (latest only!)
3. **Day 3**: Upload 120 appointments → Dashboard shows **120 ✅** (new data replaces old)
4. All historical data is preserved in `emis_apps_raw` for change tracking

## Deployment

### Step 1: Deploy Edge Function
```bash
cd supabase/functions/emis-upload
supabase functions deploy emis-upload
```

### Step 2: Deploy Database Migration
```bash
./deploy_latest_upload_filter.sh
```

Or manually:
```bash
supabase link --project-ref unveoqnlqnobufhublyw
supabase db push
```

## Testing

1. **Upload a CSV file** via the dashboard
2. **Check dashboard counts** - note the numbers
3. **Upload the exact same CSV again**
4. **Verify counts remain the same** (not doubled)
5. **Check the database** to confirm old data is still there:
   ```sql
   SELECT 
     created_at, 
     COUNT(*) as row_count 
   FROM emis_apps_raw 
   GROUP BY created_at 
   ORDER BY created_at DESC;
   ```

## Future Enhancements

With this structure in place, you can now:

### 1. **Track Changes Between Uploads**
```sql
-- Compare today's upload to yesterday's
WITH today AS (
  SELECT * FROM emis_apps_filled WHERE site_id = 2
),
yesterday AS (
  SELECT * FROM emis_apps_raw 
  WHERE site_id = 2 
  AND created_at = (
    SELECT MAX(created_at) 
    FROM emis_apps_raw 
    WHERE site_id = 2 
    AND created_at < (SELECT MAX(created_at) FROM emis_apps_raw WHERE site_id = 2)
  )
)
SELECT 
  'Added' as change_type,
  COUNT(*) 
FROM today 
WHERE NOT EXISTS (SELECT 1 FROM yesterday WHERE ...)
```

### 2. **View Upload History**
Create a dashboard page showing:
- Upload timestamps
- Record counts per upload
- Who uploaded it
- Compare any two uploads

### 3. **Rollback to Previous Upload**
If needed, create an admin function to "activate" a previous upload by updating its `created_at` to be the latest.

## Rollback Plan

If this causes issues, you can revert:

```sql
-- Restore the original view (shows all data)
DROP VIEW IF EXISTS emis_apps_filled CASCADE;
CREATE OR REPLACE VIEW emis_apps_filled AS
-- ... (original view definition without the latest_upload filter)
```

## Files Modified
- ✅ `supabase/functions/emis-upload/index.ts` - Added upload timestamp
- ✅ `supabase/migrations/20251021_update_emis_apps_filled_latest_only.sql` - Updated view
- ✅ `deploy_latest_upload_filter.sh` - Deployment script

## Notes
- The `created_at` field already existed in `emis_apps_raw`, we just now populate it explicitly
- This is **per-site**, so different sites can have different latest uploads
- Historical data is never deleted, only hidden from the main view
- Performance impact is minimal (indexed timestamp lookup)
