# Classification Function Scope Fix

## Problem
The error "No classification function available" was occurring because:

1. **Scope Issue**: `classifySlotTypes()` and `callClassify()` were defined inside the `setupAppointmentTypes()` function
2. **Inaccessible Functions**: `ensureClassificationOnce()` (defined at top-level scope) couldn't see these functions because they were nested inside another function
3. **Function Not Called**: Even though we tried to expose them via `window.classifySlotTypes = classifySlotTypes`, this line was only executed if `setupAppointmentTypes()` ran, which may not always happen

## Root Cause
```
Top Level Scope
├── ensureClassificationOnce()  ← Looking for classifySlotTypes
└── setupAppointmentTypes()
    ├── callClassify()          ← Defined here (not visible to top level)
    ├── classifySlotTypes()     ← Defined here (not visible to top level)
    └── aiConnectivityTest()
```

## Solution
Moved critical functions to **top-level scope** where they can be accessed by all other functions:

### Changes Made:

1. **Moved `callClassify()` to top level** (line ~1355)
   - Now defined immediately after `<script>` tag
   - Exposed as `window.callClassify` immediately
   - Removed duplicate definition from inside `setupAppointmentTypes()`

2. **Updated `ensureClassificationOnce()`** (line ~1848)
   - Now checks `window.classifySlotTypes` first
   - Falls back to local scope if needed
   - Better error handling

3. **Kept `classifySlotTypes()` inside `setupAppointmentTypes()`** 
   - Still exposed via `window.classifySlotTypes = classifySlotTypes`
   - This works because `classifySlotTypes` uses the global `callClassify` function

4. **Removed duplicate `aiConnectivityTest()`**
   - Kept only the global `window.aiConnectivityTest`
   - Removed local version that was shadowing the global one

## New Function Hierarchy
```
Top Level Scope
├── callClassify()               ← Moved here (globally accessible)
├── window.callClassify          ← Exposed immediately
├── ensureClassificationOnce()   ← Can now find window.classifySlotTypes
└── setupAppointmentTypes()
    └── classifySlotTypes()      ← Exposed as window.classifySlotTypes
```

## Testing
The Edge Function works perfectly (verified with test-classify-function.js):
- ✅ Classifies 10/10 slot types correctly
- ✅ Response time: ~3.3 seconds
- ✅ Proper JSON structure returned

## Expected Behavior After Fix
1. When Step 4 loads, `renderStep4Setup()` is called
2. `ensureClassificationOnce()` is triggered
3. It finds `window.classifySlotTypes` (exposed from setupAppointmentTypes)
4. `classifySlotTypes()` calls the global `callClassify()` function
5. Classification completes successfully
6. Results are stored in `window.slotTypeClassification`

## Verification
To verify the fix works:
1. Open `emis_checker.html` in browser
2. Navigate to Step 4 (Appointment Type Setup)
3. Check console for classification logs
4. Press Alt+D to open debug panel
5. Click "Test AI connectivity" - should show SUCCESS
6. Click "Retry Classification" - should classify all slot types

## Files Modified
- `emis_checker.html` - Moved functions to correct scope
