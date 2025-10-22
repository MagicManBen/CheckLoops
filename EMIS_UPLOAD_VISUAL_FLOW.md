# EMIS Upload System - Visual Flow

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER UPLOADS CSV                         │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Edge Function (emis-upload)                  │
│  • Validates CSV data                                            │
│  • Adds created_at timestamp (same for entire batch)             │
│  • Inserts all rows into emis_apps_raw                          │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                       emis_apps_raw TABLE                        │
│  ┌───────────────────────────────────────────────────┐          │
│  │  Upload 1 (created_at: 2025-10-20 10:00:00)      │ KEPT ✓   │
│  │  • 500 appointment records                        │          │
│  └───────────────────────────────────────────────────┘          │
│  ┌───────────────────────────────────────────────────┐          │
│  │  Upload 2 (created_at: 2025-10-21 15:30:00)      │ KEPT ✓   │
│  │  • 520 appointment records                        │          │
│  └───────────────────────────────────────────────────┘          │
│  ┌───────────────────────────────────────────────────┐          │
│  │  Upload 3 (created_at: 2025-10-22 09:15:00) ⭐️   │ KEPT ✓   │
│  │  • 485 appointment records                        │ LATEST   │
│  └───────────────────────────────────────────────────┘          │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    emis_apps_filled VIEW (FILTERED)              │
│  ┌───────────────────────────────────────────────────┐          │
│  │  ONLY Upload 3 (created_at: 2025-10-22 09:15:00) │          │
│  │  • Forward-filled data                            │          │
│  │  • Cleaned and processed                          │          │
│  │  • 485 records visible                            │          │
│  └───────────────────────────────────────────────────┘          │
│                                                                   │
│  Filter Logic:                                                   │
│  WHERE created_at = (SELECT MAX(created_at) FROM emis_apps_raw) │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    HTML DASHBOARD QUERIES                        │
│  • Appointment Dashboard → emis_apps_filled                     │
│  • Staff Schedules → emis_apps_filled                          │
│  • Slot Types → emis_apps_raw (with created_at filter)         │
│  • AI Rules Context → emis_apps_raw (with created_at filter)   │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      USER SEES IN BROWSER                        │
│  ✅ Only the latest upload (485 records)                        │
│  ✅ No duplicates                                               │
│  ✅ Correct metrics and counts                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Filter Mechanism

### Before (Problem):
```
SQL Query: SELECT * FROM emis_apps_raw
Results:   Upload 1 + Upload 2 + Upload 3 = 1,505 records
Dashboard: Shows 1,505 records ❌ (duplicates!)
```

### After (Solution):
```
SQL Query: SELECT * FROM emis_apps_filled
           (filters to: WHERE created_at = MAX(created_at))
Results:   Only Upload 3 = 485 records
Dashboard: Shows 485 records ✅ (latest only!)
```

## Upload Lifecycle

```
TIME: 10:00 AM
┌────────────────┐
│  Upload CSV 1  │
│  100 records   │
└───────┬────────┘
        │
        ▼
┌────────────────────────┐
│  emis_apps_raw         │
│  Records: 100          │
│  Displayed: 100 ✓      │
└────────────────────────┘

TIME: 2:00 PM (Same Day)
┌────────────────┐
│  Upload CSV 2  │
│  100 records   │
└───────┬────────┘
        │
        ▼
┌────────────────────────┐
│  emis_apps_raw         │
│  Total: 200            │
│  Displayed: 100 ✓      │  ← Only latest shown
│  (Old: 100 kept)       │  ← Historical preserved
└────────────────────────┘

TIME: Next Day
┌────────────────┐
│  Upload CSV 3  │
│  100 records   │
└───────┬────────┘
        │
        ▼
┌────────────────────────┐
│  emis_apps_raw         │
│  Total: 300            │
│  Displayed: 100 ✓      │  ← Only latest shown
│  (Old: 200 kept)       │  ← Historical preserved
└────────────────────────┘
```

## Historical Data Access

While the dashboard shows only the latest upload, you can access historical data:

```sql
-- See all uploads
SELECT created_at, COUNT(*) as records
FROM emis_apps_raw
GROUP BY created_at
ORDER BY created_at DESC;

-- Compare two specific dates
SELECT 
    created_at,
    appointment_date,
    COUNT(*) as count
FROM emis_apps_raw
WHERE created_at IN (
    '2025-10-22 09:15:00+00',
    '2025-10-21 15:30:00+00'
)
GROUP BY created_at, appointment_date
ORDER BY appointment_date;
```

## Key Components

| Component | Purpose | Filters Latest? |
|-----------|---------|-----------------|
| `emis_apps_raw` | Stores ALL uploads | ❌ No (keeps all) |
| `emis_apps_filled` | View for dashboard | ✅ Yes (latest only) |
| `emis_apps_raw_latest` | Raw latest data | ✅ Yes (latest only) |
| Edge Function | Handles uploads | N/A (inserts all) |
| HTML Queries | Display data | ✅ Yes (uses views) |

## Summary

✅ **All uploads preserved** for historical tracking  
✅ **Dashboard shows latest** to avoid duplicates  
✅ **Automatic filtering** via database views  
✅ **No manual intervention** required  
✅ **Historical comparison** available via SQL
