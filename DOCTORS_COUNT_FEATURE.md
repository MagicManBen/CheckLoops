# Doctors Count Feature - Appointment Dashboard

## Overview
Added a new **"Doctors"** row/metric to the Appointment Dashboard that displays the count of unique doctors (session holders with "Dr" in their name) for each day.

## Changes Made

### 1. **Data Query Enhancement** (`loadAppointmentsForDate` function)
Added a new section to count unique doctors with "Dr" in their full name:

**Location:** Line ~2505 in `emis_reporting.html`

```javascript
// Count Doctors (session holders with "Dr" in their name)
let doctorCount = 0;
if (slotMappings.bookOnDayTypes.length > 0) {
  console.log(`Querying Doctors: WHERE "Appointment Date" = '${dateStr}' AND "Slot Type" IN [${slotMappings.bookOnDayTypes.join(', ')}] AND "Full Name of the Session Holder of the Session" contains "Dr"`);
  
  const { data: doctorData, error: doctorError } = await window.supabase
    .from('emis_apps_filled')
    .select('"Full Name of the Session Holder of the Session"')
    .eq('"Appointment Date"', dateStr)
    .in('"Slot Type"', slotMappings.bookOnDayTypes);
  
  if (!doctorError && doctorData) {
    // Count unique doctors (session holders with "Dr" in their name)
    const uniqueDoctors = new Set(
      doctorData
        .map(row => row['Full Name of the Session Holder of the Session'])
        .filter(name => name && /\bDr\b/i.test(name))
    );
    doctorCount = uniqueDoctors.size;
    console.log(`Doctor count result: ${doctorCount} (unique doctors found)`);
  } else if (doctorError) {
    console.error('Error loading doctor data:', doctorError);
  }
}
```

**Key Features:**
- Queries only the `emis_apps_filled` table for the specific date and "On the Day" slot types
- Filters for names containing "Dr" (case-insensitive) using regex `/\bDr\b/i`
- Uses a `Set` to count unique doctors (in case the same doctor has multiple sessions)
- Includes comprehensive error handling and logging

### 2. **Return Value Update**
Updated the return object in `loadAppointmentsForDate` to include `doctors`:

```javascript
return {
  otd: otdCount,
  notBkd: notBkdCount,
  partnerIn: hasPartner,
  hasDuty: hasDuty,
  doctors: doctorCount  // NEW
};
```

### 3. **Error Return Update**
Updated the error catch block to also include `doctors: 0`:

```javascript
catch (error) {
  console.error(`Error loading data for ${dateStr}:`, error);
  return {
    otd: 0,
    notBkd: 0,
    partnerIn: 999,
    hasDuty: false,
    doctors: 0  // NEW
  };
}
```

### 4. **UI Display** (`createDayCard` function)
Added a new metric card to display the doctors count:

**Location:** Line ~2355 in `emis_reporting.html`

```javascript
<div class="metric" style="background: linear-gradient(135deg, #a78bfa, #9370db); color: white;">
  <span class="metric-label">Doctors</span>
  <span class="metric-value">${metrics.doctors || 0}</span>
</div>
```

**Visual Design:**
- **Color:** Purple gradient (`#a78bfa` to `#9370db`) to distinguish from other metrics
- **Position:** Last row after "Duty" metric
- **Default:** Shows 0 if no doctors found or if metrics.doctors is undefined
- **Format:** Displays the numeric count (e.g., "2", "5", etc.)

## Database Query Details

### Source Table
- `emis_apps_filled` - Contains the filled appointment data from EMIS

### Query Logic
```sql
SELECT DISTINCT "Full Name of the Session Holder of the Session"
FROM emis_apps_filled
WHERE "Appointment Date" = '${dateStr}'
  AND "Slot Type" IN (bookOnDayTypes)
  AND "Full Name of the Session Holder of the Session" LIKE '%Dr%'
```

### Filter Criteria
1. **Date Match:** Only appointments for the specific date
2. **Slot Type:** Only includes "Book on the Day" slot types
3. **Name Match:** Session holder name contains "Dr" (case-insensitive, word boundary)

### Uniqueness
- Uses JavaScript `Set` to ensure each doctor is counted only once, even if they have multiple sessions

## Integration Points

### Dashboard Flow
1. `updateDashboardStats()` → calls `loadAppointmentsForDate()` for each day
2. `loadAppointmentsForDate()` → returns metrics including `doctors`
3. `createDayCard()` → renders the metrics, including the new doctors count

### Data Flow
```
updateDashboardStats()
  └─> For each day (Mon-Fri, this week & next week):
      └─> loadAppointmentsForDate(dateStr, slotMappings)
          ├─> Query OTD count
          ├─> Query Not BKD count
          ├─> Query Duty status
          ├─> Query Partner status
          └─> Query Doctor count ← NEW
              └─> createDayCard() displays all metrics
```

## Testing Checklist

### Manual Testing
- [ ] Dashboard loads and displays doctor counts for all days
- [ ] Doctor counts match manual verification in Supabase
- [ ] Purple "Doctors" metric appears as the last row in each day card
- [ ] Counts update when navigating between weeks
- [ ] Zero is displayed when no doctors are found
- [ ] Doctor names are correctly identified (contains "Dr")

### Edge Cases
- [ ] Days with no appointments show 0 doctors
- [ ] Days with appointments but no doctors show 0
- [ ] Names like "Dr Smith", "Dr. Jones", "DR Anderson" are all counted
- [ ] Names without "Dr" prefix are excluded
- [ ] Duplicate doctors (same name, multiple slots) are counted once

### Console Logging
Check browser console (F12) for:
- `Doctor count result: X (unique doctors found)` - confirms query success
- `Final results for ${dateStr}: ... Doctors=X` - shows complete metrics
- No `Error loading doctor data:` messages

## Color Scheme

The new metric uses a purple gradient to visually distinguish it:
- **Primary:** `#a78bfa` (light purple)
- **Secondary:** `#9370db` (medium purple)
- **Text:** White on gradient background

This matches the modern design system while being distinct from:
- Yellow: OTD/Not BKD metrics
- Green: Partner/Duty checkmarks
- Blue: Partner-specific accent

## Performance Considerations

### Query Optimization
- Only fetches the session holder names (not full rows)
- Filters happen at database level
- Client-side filtering uses efficient regex with word boundary

### Set Deduplication
- JavaScript `Set` ensures O(1) lookup for uniqueness
- More efficient than array filtering for this use case

### Caching
- Currently no caching; loads fresh on each dashboard update
- Future optimization: Could cache doctor lists by date if refresh rate becomes an issue

## Regex Pattern Explanation

```javascript
/\bDr\b/i
```

- `\b` - Word boundary (ensures "Dr" is a complete word, not part of another word)
- `Dr` - Literal text "Dr"
- `\b` - Word boundary (end)
- `i` - Case-insensitive flag (matches "DR", "Dr", "dr", etc.)

Examples:
- ✅ "Dr Smith" - matches
- ✅ "Dr. Jones" - matches (period is not a word character, so word boundary still works)
- ✅ "DR Anderson" - matches (case-insensitive)
- ✅ "Dr Khan" - matches
- ❌ "Doctor Smith" - does NOT match (uses full word "Doctor")
- ❌ "Drs Smith" - does NOT match (plural form)

## Files Modified

- **`emis_reporting.html`** - Main appointment dashboard
  - Line ~2312: `createDayCard()` function - added Doctors metric display
  - Line ~2505: `loadAppointmentsForDate()` function - added doctor count query
  - Line ~2530: Return object updated with `doctors`
  - Line ~2542: Error return updated with `doctors: 0`

## Rollback Instructions

If you need to remove this feature, reverse the following changes:

1. Remove the doctor count query section from `loadAppointmentsForDate()`
2. Remove `doctors: doctorCount` from the return object
3. Remove `doctors: 0` from the error return
4. Remove the doctors metric div from `createDayCard()`

## Future Enhancements

Potential improvements:
- [ ] Add threshold settings for doctors count (e.g., warn if < 2 doctors)
- [ ] Color code doctors metric based on count (red if < min, green if >= min)
- [ ] Show list of doctor names on hover/click
- [ ] Track doctors by specialty/skill level
- [ ] Historical tracking of doctor availability trends
- [ ] Exclude certain names (e.g., admin staff with "Dr" title)
