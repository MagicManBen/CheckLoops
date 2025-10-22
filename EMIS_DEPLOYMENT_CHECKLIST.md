# EMIS Latest Upload Filter - Deployment Checklist

## Pre-Deployment

- [ ] Review `EMIS_LATEST_UPLOAD_VIEW.sql` script
- [ ] Backup current `emis_apps_filled` view definition (optional)
- [ ] Note current record counts for comparison

## Deployment Steps

### Step 1: Run SQL Script
- [ ] Open Supabase Dashboard: https://unveoqnlqnobufhublyw.supabase.co
- [ ] Navigate to SQL Editor
- [ ] Copy entire contents of `EMIS_LATEST_UPLOAD_VIEW.sql`
- [ ] Paste into SQL Editor
- [ ] Click "Run" or press Cmd+Enter
- [ ] Verify no errors in output

### Step 2: Verify Database Changes
Run verification queries:

```sql
-- Check view exists
SELECT COUNT(*) FROM emis_apps_filled;

-- Check latest timestamp being used
SELECT DISTINCT created_at FROM emis_apps_filled;

-- Should only show ONE timestamp (the latest)
```

- [ ] `emis_apps_filled` view returns data
- [ ] Only ONE `created_at` timestamp is shown
- [ ] Record count matches latest upload

### Step 3: Test HTML Dashboard
- [ ] Clear browser cache (Cmd+Shift+R on Mac)
- [ ] Open `emis_reporting.html`
- [ ] Navigate to Appointment Dashboard
- [ ] Verify data loads correctly
- [ ] Check that numbers look reasonable (not inflated)

### Step 4: Test Upload Flow
- [ ] Export a test CSV from EMIS
- [ ] Upload via "Upload CSV" button
- [ ] Wait for success message
- [ ] Refresh Appointment Dashboard
- [ ] Verify new data is shown
- [ ] Check that old data is NOT duplicated

## Verification Tests

### Test 1: Duplicate Prevention
Before deploying, note the current counts:
```sql
SELECT COUNT(*) as current_count FROM emis_apps_filled;
```
Current count: ____________

After deploying:
```sql
SELECT COUNT(*) as new_count FROM emis_apps_filled;
```
New count: ____________

- [ ] New count is LESS than or equal to current count (duplicates removed)

### Test 2: Latest Upload Filter
```sql
-- See all uploads in raw table
SELECT created_at, COUNT(*) 
FROM emis_apps_raw 
GROUP BY created_at 
ORDER BY created_at DESC;

-- See what's displayed in view
SELECT created_at, COUNT(*) 
FROM emis_apps_filled 
GROUP BY created_at;
```

- [ ] Multiple timestamps exist in `emis_apps_raw`
- [ ] Only ONE timestamp exists in `emis_apps_filled`
- [ ] The timestamp in `emis_apps_filled` is the LATEST one

### Test 3: Dashboard Functionality
Check each dashboard feature:
- [ ] Appointment Dashboard shows correct dates
- [ ] Doctor count is accurate
- [ ] Slot types load correctly
- [ ] Staff schedules display
- [ ] AI Rules page loads context data
- [ ] No duplicate appointments shown

### Test 4: Upload New Data
- [ ] Upload a small test CSV
- [ ] Dashboard updates to show new data
- [ ] Old data is NOT shown alongside new data
- [ ] Refresh page - new data persists
- [ ] Historical data still in `emis_apps_raw`

## Post-Deployment

### Monitor for 24 Hours
- [ ] Check dashboard daily for accuracy
- [ ] Verify no duplicate data appears
- [ ] Monitor for user reports of missing data
- [ ] Check error logs in browser console

### Documentation
- [ ] Share `EMIS_LATEST_UPLOAD_INSTRUCTIONS.md` with team
- [ ] Update any internal documentation
- [ ] Note deployment date and SQL script version

## Rollback Plan (If Needed)

If something goes wrong:

1. **Immediate Rollback:**
```sql
-- Restore original view (shows ALL data)
-- Use REVERT_ALL_VERSIONING.sql if available
-- Or use SIMPLE_FIX_FRESH_START.sql without the filter
```

2. **Verify Rollback:**
```sql
SELECT COUNT(*) FROM emis_apps_filled;
-- Should show all records from all uploads again
```

3. **Report Issues:**
   - What went wrong?
   - Error messages?
   - Which part failed?

## Success Criteria

✅ **Deployment is successful when:**
- [ ] SQL script runs without errors
- [ ] Dashboard shows only latest upload
- [ ] No duplicate appointments
- [ ] Upload function works correctly
- [ ] Historical data preserved in `emis_apps_raw`
- [ ] All dashboard features function normally
- [ ] No errors in browser console

## Sign-Off

Deployed by: ________________  
Date: ________________  
Time: ________________  

Verified by: ________________  
Date: ________________  

Issues encountered: ________________

Notes: ________________

---

## Quick Reference

**SQL Script:** `EMIS_LATEST_UPLOAD_VIEW.sql`  
**Instructions:** `EMIS_LATEST_UPLOAD_INSTRUCTIONS.md`  
**Visual Guide:** `EMIS_UPLOAD_VISUAL_FLOW.md`  
**Summary:** `EMIS_UPLOAD_FILTER_SUMMARY.md`

**Support Contact:** [Your contact info]  
**Documentation:** This file and related markdown files in the project
