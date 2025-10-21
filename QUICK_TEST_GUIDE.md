# 🧪 Quick Test Guide - AI Rule Fixes

## ✅ Edge Function Deployed
**Status:** Deployed successfully at 2025-10-21  
**Function:** `ai-rule-generator`  
**Project:** unveoqnlqnobufhublyw

---

## 🎯 Test Case: Dr Saeed Minimum Duration Rule

### Step 1: Open the AI Rules Page
1. Navigate to `http://100.65.70.83/emis_reporting.html`
2. Click **"AI Rules"** tab in the navigation

### Step 2: Generate the Rule
1. In the text box, type:
   ```
   Dr Saeed cannot have appointments less than 60 minutes
   ```
2. Leave severity as **"warning"** (or change to "error")
3. Click **"🪄 Generate Rule"** button

### Step 3: Check Console (Critical!)
**Press F12** or **Cmd+Option+I** to open DevTools, then check Console tab.

You should see:
```
🤖 === GENERATING RULE ===
User input: Dr Saeed cannot have appointments less than 60 minutes
Severity: warning
Site ID: 2
Context - Clinicians: 25 available
Context - Slot Types: 32 available
📡 Calling AI edge function...
Request body: { ... }
📥 AI response received: { ... }
✅ AI generated rule: {
  "rule_type": "slot_duration",     ← Should be "slot_duration" NOT "slot_duration_requirement"
  "config": {
    "slot_types": [],                ← Empty = applies to all slot types
    "operator": "gte",               ← "greater than or equal"
    "value": 60,
    "applies_to_all_clinicians": false,
    "clinician_names": ["SAEED, Salman (Dr)"]  ← Should match database name exactly
  }
}
🐛 Debug info from AI: {
  "ai_generated_type": "slot_duration_requirement",  ← AI uses this
  "db_compatible_type": "slot_duration"              ← But DB receives this
}
```

**✅ Success Criteria:**
- `rule_type` in final rule is `"slot_duration"` (not `slot_duration_requirement`)
- `config.clinician_names` contains exact DB name (e.g., `"SAEED, Salman (Dr)"`)
- Debug info shows the type mapping worked

---

### Step 4: Test the Rule
1. Click **"🧪 Test"** button
2. **Check Console again** for detailed test logs

Expected console output:
```
🧪 === RUNNING RULE TEST ===
Rule: { ... full rule ... }
📅 Querying appointments from 2025-10-14 onwards (7 days)
📊 Retrieved 1000 appointments to test
Sample appointment structure: { ... }

🔍 Testing slot_duration rule...
Rule config: { ... }
📋 Rule parameters:
  - Slot types filter: ALL SLOT TYPES
  - Operator: gte
  - Value: 60 minutes
  - Applies to all clinicians: false
  - Specific clinicians: SAEED, Salman (Dr)

✅ Test complete:
  - Total appointments: 1000
  - Matched clinician filter: 85      ← How many had Dr Saeed
  - Matched slot type filter: 1000    ← All slot types
  - Actually tested: 85               ← Intersection of both filters
  - Violations found: 85              ← Should be > 0 if appointments are < 60 min
```

**✅ Success Criteria:**
- "Matched clinician filter" should be > 0 (Dr Saeed's appointments found)
- "Violations found" should be > 0 (if all Dr Saeed's appointments are < 60 min)
- **UI should show violations list** with dates, times, durations

**❌ If you see "No violations found" but Dr Saeed HAS appointments < 60 min:**
- This would indicate the test logic is still broken
- Check console logs to see actual durations being tested

---

### Step 5: Review Test Results in UI
The test results panel should show:

**If violations found:**
```
Found 85 violations in 1000 appointments tested

📊 Debug Info (click to expand)
  rule_type: "slot_duration"
  rule_config: { ... }
  total_appointments_queried: 1000
  violations_found: 85

21-Oct-2025 09:00 - SAEED, Salman (Dr)
Unknown Slot Type - Duration 15min violates rule (gte 60min)

[... more violations ...]
```

**If no violations:**
```
✅ No violations found!
Tested 1000 appointments from the last 7 days (limit 1000)

📊 Debug Info (click to expand)
  [Shows why no violations were found]
```

---

### Step 6: Save the Rule
1. Click **"💾 Save Rule"** button
2. **Check Console** for save logs

Expected:
```
💾 === SAVING RULE ===
Rule to save: { ... }
📤 Sending to database...
✅ Rule saved successfully: [{ id: "...", ... }]
```

**✅ Success Criteria:**
- No error alert appears
- See "✅ Rule saved successfully!" alert
- Rule appears in the rules list on the right

**❌ If you see constraint error:**
```
❌ Database error: {
  "code": "23514",
  "message": "... violates check constraint ..."
}
```
This means the type mapping didn't work. Check the `rule_type` value being sent.

---

## 🐛 Troubleshooting

### Problem: "No violations found" but should find violations

**Check console for:**
1. **"Matched clinician filter"** - Should be > 0
   - If 0: Clinician name in rule doesn't match DB names
   - Fix: Check `contextData.clinicians` array for exact name

2. **"Actually tested"** - Should match clinician filter count (if no slot type filter)
   - If 0: Both filters passing but intersection is empty
   - Check slot type matching logic

3. **Sample appointment structure** - Verify field names
   - Duration field: `"Slot Duration"`
   - Clinician field: `"Full Name of the Session Holder of the Session"`

### Problem: Constraint violation when saving

**Check console for:**
```
Rule to save: {
  "rule_type": "???"  ← What is this value?
}
```

Should be one of: `daily_check`, `slot_duration`, `slot_count`, `custom`

If it's `slot_duration_requirement`, the edge function mapping didn't work.

**Fix:** Re-deploy edge function:
```bash
cd /Users/benhoward/Desktop/CheckLoop/checkloops
npx supabase functions deploy ai-rule-generator
```

### Problem: AI not matching clinician names

**Check console for:**
```
Context - Clinicians: 25 available
```

Then check the actual list:
```javascript
console.log(AIRules.contextData.clinicians)
```

The AI should match "Dr Saeed" to something like:
- `"SAEED, Salman (Dr)"`
- `"Dr Salman Saeed"`
- `"Salman Saeed"`

If not matching, the context data may not be loading correctly.

---

## 📊 Expected vs Actual Results

| Check | Expected | How to Verify |
|-------|----------|---------------|
| **Rule generation** | rule_type = "slot_duration" | Console: `✅ AI generated rule` |
| **Type mapping** | Debug shows AI→DB mapping | Console: `debug.db_compatible_type` |
| **Clinician match** | Exact DB name in config | Console: `clinician_names` array |
| **Test query** | 1000 appointments retrieved | Console: `📊 Retrieved 1000 appointments` |
| **Clinician filter** | > 0 matched | Console: `Matched clinician filter: 85` |
| **Violations** | > 0 if data has violations | Console: `Violations found: 85` |
| **UI display** | Violations list visible | Look at test results panel |
| **Save** | No error, success alert | Console: `✅ Rule saved successfully` |
| **DB check** | Rule appears in rules list | Right-side rules list updates |

---

## 🎯 Quick Win Test

**Fastest way to verify everything works:**

1. Open `emis_reporting.html` → AI Rules
2. Open DevTools Console (F12)
3. Type rule: `"Dr Saeed cannot have appointments less than 60 minutes"`
4. Click Generate → Check console for `rule_type: "slot_duration"`
5. Click Test → Check console for `Violations found: N` where N > 0
6. If violations found, click Save → Should succeed with no error

**Time: ~30 seconds**

If all 6 steps pass → ✅ **All fixes working!**

---

## 📝 Report Results

After testing, reply with:

```
✅ PASSED / ❌ FAILED

Step 1 - Rule Generated: [ ] rule_type correct
Step 2 - Type Mapped: [ ] debug info shows mapping
Step 3 - Test Ran: [ ] violations found
Step 4 - UI Updated: [ ] violations displayed
Step 5 - Save Worked: [ ] no constraint error

Console logs: [paste key lines]
```

---

**Ready to test!** 🚀
