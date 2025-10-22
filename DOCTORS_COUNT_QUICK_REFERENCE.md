# Quick Reference: Doctors Count Feature

## What Was Added?
A new **"Doctors"** metric to the Appointment Dashboard that shows how many unique doctors (with "Dr" in their name) are working each day.

## Where Can You See It?
- **Page:** Appointment Dashboard (the default page when you open `emis_reporting.html`)
- **Location:** Last row of each day card (after "Duty" metric)
- **Color:** Purple gradient (`#a78bfa` to `#9370db`)
- **Display:** Shows a number (e.g., "2 Doctors", "5 Doctors")

## How It Works

### The Logic
1. For each day, the system queries the `emis_apps_filled` table
2. Looks for all appointments that day in "On the Day" slot types
3. Extracts the session holder names
4. Counts unique names that contain "Dr" (case-insensitive)
5. Displays the count as a purple metric card

### Example
If Monday has these session holders:
- Dr Smith (2 appointments)
- Dr Jones (1 appointment)
- Admin User (3 appointments)
- Dr Khan (1 appointment)

**Result:** Shows "3 Doctors" (unique doctors: Smith, Jones, Khan)

## Doctor Detection Rules

✅ **Will be counted:**
- Dr Smith
- DR Anderson
- Dr. Jones
- Dr Khan

❌ **Will NOT be counted:**
- Doctor Smith (uses full word "Doctor")
- Drs Smith (plural)
- Admin User (no "Dr")
- Smith (no "Dr")

## Files Modified
- `emis_reporting.html` - Added doctor count query and display

## Testing the Feature

### In Browser Console (F12)
Look for these log messages:
```
Doctor count result: 3 (unique doctors found)
Final results for 20-Oct-2025: OTD=25, Not BKD=12, Duty=true, Partner=true, Doctors=3
```

### Manual Verification
1. Open Supabase and check `emis_apps_filled` table
2. Filter by a date and look at "Full Name of the Session Holder of the Session"
3. Count names with "Dr" prefix manually
4. Compare with dashboard display

## Customization

### Change the Display Label
**File:** `emis_reporting.html`, Line ~2355
**Current:**
```html
<span class="metric-label">Doctors</span>
```
**Change to:**
```html
<span class="metric-label">Clinicians</span>
```

### Change the Color
**File:** `emis_reporting.html`, Line ~2354
**Current:**
```html
style="background: linear-gradient(135deg, #a78bfa, #9370db); color: white;"
```
**Change to:**
```html
style="background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white;"  <!-- Blue like Partner -->
```

### Change the Doctor Detection Pattern
**File:** `emis_reporting.html`, Line ~2515
**Current:**
```javascript
.filter(name => name && /\bDr\b/i.test(name))
```
**Alternatives:**
```javascript
.filter(name => name && /\bDoctor\b/i.test(name))  // Find "Doctor" instead
.filter(name => name && /^Dr\s/i.test(name))      // Only at start: "Dr Smith"
.filter(name => name && name.includes('Dr'))      // Simple substring (less precise)
```

## Performance Impact
- **Minimal:** Adds one database query per day
- **Query:** Selects only name column, not full rows
- **Client-side:** Uses efficient Set for deduplication
- **Caching:** None currently; could be added in future for optimization

## Database Requirements

### Table: `emis_apps_filled`
Required columns:
- `"Appointment Date"` (date format)
- `"Slot Type"` (text)
- `"Full Name of the Session Holder of the Session"` (text)

### Pre-requisites
- Must have slot type mappings configured (for "On the Day" types)
- User must be authenticated
- User's site must have data in `emis_apps_filled`

## Troubleshooting

### Showing "0 Doctors" for all days
**Possible causes:**
1. No data in `emis_apps_filled` table
2. Slot type mappings not configured
3. No session holder names contain "Dr"

**Fix:**
- Check browser console (F12) for error messages
- Verify slot mappings are set up in Settings
- Manually check Supabase for data

### Wrong doctor count
**Possible causes:**
1. Names don't have "Dr" prefix exactly
2. Different capitalization/formatting
3. Data not yet loaded

**Fix:**
- Check exact name format in Supabase (may have abbreviations)
- Adjust regex pattern if needed
- Refresh page to reload data

### Not seeing the metric at all
**Possible causes:**
1. JavaScript error in createDayCard()
2. HTML rendering issue
3. CSS conflict

**Fix:**
- Check browser console (F12) for errors
- Open DevTools → Elements tab → find "class='metric'"
- Look for the purple doctors card

## Real-World Example

**Sample Dashboard Display:**

```
┌─────────────────────────────────────────┐
│         MONDAY                    13...  │
├─────────────────────────────────────────┤
│ Book on the Day         25         [#]  │
│ Available Book on Day   12         [#]  │
│ Partner In              ✓               │
│ Duty                    ✗               │
│ Doctors                 3          [#]  │
└─────────────────────────────────────────┘
```

The purple "Doctors" metric shows "3", indicating 3 unique doctors are scheduled for Monday.

## Future Enhancements

Ideas for future versions:
- [ ] Show list of doctor names on hover
- [ ] Color-code based on minimum threshold (red if < 2, etc.)
- [ ] Filter out certain names (titles that aren't real doctors)
- [ ] Show doctors by specialty
- [ ] Track historical trends
- [ ] Set alerts for low doctor count

---

**Last Updated:** October 22, 2025  
**Version:** 1.0  
**Status:** ✅ Production Ready
