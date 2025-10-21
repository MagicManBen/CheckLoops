# Quick Test Guide - AI Rule Creator Context Enhancement

## What Was Added

1. **Context Data**: System now sends lists of all clinicians and slot types to AI
2. **Copy Debug Button**: One-click copy of all debug information

## Visual Changes You'll See

### Metrics Panel (Top Right)
```
┌─────────────────────────────────────┐
│ SESSION METRICS                     │
│ Total Requests: 0                   │
│ Success: 0 | Failed: 0              │
│ Avg Response Time: 0ms              │
│                                     │
│ CONTEXT DATA (Sent to AI)      ← NEW│
│ Clinicians: 25 | Slot Types: 8 ← NEW│
└─────────────────────────────────────┘
```

### Test Examples Section (Bottom)
```
[Quick Test #1] [Quick Test #2] [Quick Test #3] [📋 COPY ALL DEBUG] ← NEW
```

## How to Test

### Test 1: Context Data Loading
1. Open `emis_rule_creator_ai.html` in browser
2. Select a site from dropdown (e.g., "Riverside Medical Centre")
3. **Check Console** - Should see:
   ```
   [12:34:56] [INFO] 📋 Loading context data from database...
   [12:34:57] [SUCCESS] ✅ Loaded 25 clinicians and 8 slot types
   ```
4. **Check Metrics Panel** - Should show:
   ```
   CONTEXT DATA (Sent to AI)
   Clinicians: 25 | Slot Types: 8
   ```

### Test 2: Context Sent to AI
1. Enter rule: `Dr Saeed cannot have appointments less than 20 minutes`
2. Click **🚀 GENERATE RULE**
3. Click **REQUEST** tab
4. **Look for `context` object**:
   ```json
   {
     "rule_text": "Dr Saeed cannot have appointments less than 20 minutes",
     "site_id": 1,
     "context": {
       "available_clinicians": [
         "Dr Mohammad Saeed",
         "Dr Jane Smith",
         "Dr John Brown",
         ...
       ],
       "available_slot_types": [
         "Duty",
         "Routine",
         "Emergency",
         ...
       ]
     }
   }
   ```

### Test 3: AI Uses Context for Matching
1. Same rule as above
2. Click **PARSED RULE** tab
3. **Check clinician_names array**:
   ```json
   {
     "rule_type": "slot_duration_requirement",
     "name": "Dr Saeed Minimum Appointment Duration",
     "config": {
       "clinician_names": ["Dr Mohammad Saeed"],  ← Should match exact DB name
       "slot_types": [],
       "operator": "gte",
       "value": 20
     }
   }
   ```
   ✅ AI should match "Dr Saeed" to exact database name "Dr Mohammad Saeed"

### Test 4: Copy All Debug
1. After generating a rule (success or fail)
2. Click **📋 COPY ALL DEBUG** button
3. Button should briefly show: **✅ COPIED!**
4. Paste into text editor
5. **Should see complete JSON with**:
   ```json
   {
     "timestamp": "2025-01-29T12:34:56.789Z",
     "site": 1,
     "session_metrics": {
       "total_requests": 3,
       "success_count": 2,
       "fail_count": 1,
       "avg_response_time_ms": 2156
     },
     "context_data": {
       "clinicians_count": 25,
       "clinicians": ["Dr Mohammad Saeed", "Dr Jane Smith", ...],
       "slot_types_count": 8,
       "slot_types": ["Duty", "Routine", ...]
     },
     "last_request": { ... },
     "last_response": { ... },
     "last_parsed_rule": { ... },
     "last_metadata": { ... },
     "console_logs": [ ... ]
   }
   ```

## Expected Behaviors

### ✅ PASS Criteria

1. **Context loads automatically** when site is selected
2. **Counts display** in metrics panel
3. **Request includes context** in payload (check REQUEST tab)
4. **AI matches exact names** from database (check PARSED RULE tab)
5. **Copy button works** and captures everything
6. **Copy button feedback** shows "✅ COPIED!" briefly

### ❌ FAIL Indicators

1. Context shows `Clinicians: 0 | Slot Types: 0` after selecting site
2. REQUEST tab missing `context` object
3. AI returns wrong clinician names (not matching database)
4. Copy button doesn't work or shows error
5. Console shows errors related to context loading

## Test Cases

### Case 1: Simple Clinician Rule
**Input:** `Dr Smith cannot perform Emergency appointments`
**Expected:** 
- AI finds exact name: "Dr Jane Smith" (from database)
- rule_type: "clinician_slot_restriction"
- clinician_names: ["Dr Jane Smith"]
- slot_types: ["Emergency"]

### Case 2: Duration Rule with Specific Clinician
**Input:** `Dr Brown's appointments must be at least 30 minutes`
**Expected:**
- AI finds exact name: "Dr John Brown"
- rule_type: "slot_duration_requirement"
- clinician_names: ["Dr John Brown"]
- operator: "gte"
- value: 30

### Case 3: Multiple Clinicians
**Input:** `Dr Smith, Dr Jones and Dr Brown must have at least 5 duty slots each day`
**Expected:**
- AI matches all three to exact database names
- rule_type: "daily_slot_count"
- clinician_names: ["Dr Jane Smith", "Dr Alice Jones", "Dr John Brown"]

### Case 4: Unknown Name (Edge Case)
**Input:** `Dr Nonexistent cannot perform surgery`
**Expected:**
- AI should still process but might ask for clarification
- Or best-guess match if similar name exists

## Troubleshooting

### Problem: Context Data Shows 0
**Solution:**
- Check site is selected
- Check browser console for errors
- Check Supabase connection
- Verify `emis_apps_raw` table has data for selected site

### Problem: Copy Button Doesn't Work
**Solution:**
- Check browser console for clipboard permissions error
- Try HTTPS instead of file:// protocol
- Check browser allows clipboard access

### Problem: AI Not Using Context
**Solution:**
- Check REQUEST tab - verify `context` object present
- Check Edge Function logs in Supabase Dashboard
- Verify Edge Function deployed successfully (should show v2+)

### Problem: Wrong Name Matches
**Solution:**
- Verify context data loaded correctly (check REQUEST tab)
- Check database has correct names in `full_name_session_holder`
- AI might still make best guess if name is ambiguous

## Success Indicators

After testing, you should see:
- ✅ Context data loads with every site change
- ✅ Counts display correctly (non-zero for populated sites)
- ✅ REQUEST tab shows context object with arrays
- ✅ AI matches to exact database names (not guesses)
- ✅ Copy button captures and formats all debug info
- ✅ No console errors

## Files to Open for Testing

1. **HTML Interface**: `emis_rule_creator_ai.html`
2. **Edge Function**: Check logs at https://supabase.com/dashboard/project/unveoqnlqnobufhublyw/functions
3. **Database**: Can verify names with:
   ```sql
   SELECT DISTINCT full_name_session_holder 
   FROM emis_apps_raw 
   WHERE site_id = 1 
   ORDER BY full_name_session_holder;
   ```

## Demo Flow (For Showing to Others)

1. **Show empty state**: "No site selected yet"
2. **Select site**: Watch context load in real-time
3. **Show metrics**: "Here's the context data - 25 clinicians, 8 slot types"
4. **Enter rule**: "Let's try Dr Saeed..."
5. **Generate**: Click button, watch console
6. **Show REQUEST**: "Here's the context we sent to AI"
7. **Show RESPONSE**: "Here's what AI returned"
8. **Show PARSED RULE**: "Notice exact database name matched"
9. **Click Copy**: "Now I can share all this debug info"
10. **Paste**: "Here's everything in one JSON object"

---

**Status: Ready for Testing** 🚀

Last Updated: 2025-01-29
Version: 2.0 (with context enhancement)
