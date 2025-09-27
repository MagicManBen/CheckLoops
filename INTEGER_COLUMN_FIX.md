# ✅ FIXED: Integer Column Type Error

## The Problem
PostgreSQL error code 22P02:
```
"invalid input syntax for type integer: \"187.5\""
```

The database columns `total_holiday_entitlement` and `holiday_entitlement` are defined as **INTEGER** type, but we were sending decimal values when:
- Weekly hours: 37.5 (decimal)
- Multiplier: 5
- Result: 37.5 × 5 = 187.5 (decimal)

## The Solution
Added `Math.round()` to all places where we update these integer columns:

### Fixed All Update Locations:
1. ✅ `saveRowData()` - Individual row save
2. ✅ `saveAllHolidays()` - Bulk save all rows
3. ✅ `setAllMultiplier()` - Set multiplier for all staff
4. ✅ `toggleMultiplierMode()` - Switch between modes
5. ✅ `toggleOverrideMode()` - Switch to override mode
6. ✅ `liveUpdateMultiplier()` - Live multiplier updates
7. ✅ `liveUpdateManualOverride()` - Live override updates
8. ✅ `saveMultiplier()` - Save multiplier changes
9. ✅ `saveManualOverride()` - Save override changes

### What Happens Now:
```javascript
// BEFORE (causing error):
total_holiday_entitlement: entitlement,  // Could be 187.5
holiday_entitlement: entitlement,         // Could be 187.5

// AFTER (fixed):
total_holiday_entitlement: Math.round(entitlement),  // Now 188
holiday_entitlement: Math.round(entitlement),        // Now 188
```

## Impact on Users:
- **37.5 hours × 5 weeks** = 187.5 hours → Rounded to **188 hours**
- **30 hours × 6 weeks** = 180 hours → Stays **180 hours** (no rounding needed)
- **22.5 hours × 10 weeks** = 225 hours → Stays **225 hours** (no rounding needed)

## Display vs Storage:
- **Display**: Still shows HH:MM format (e.g., "37:30" for 37.5 hours)
- **Storage**: Stores as integers (e.g., 188 for 187.5 hours)
- **Calculation**: The 0.5 hour difference is minimal (30 minutes per year)

## Testing:
1. Set a staff member to 37.5 weekly hours
2. Set multiplier to 5 weeks
3. Click Save - should work without error
4. Entitlement will be saved as 188 hours (rounded from 187.5)

## Alternative Solution (Database):
If exact decimal precision is needed, the database columns could be changed from INTEGER to NUMERIC(10,2), but this requires a database migration.