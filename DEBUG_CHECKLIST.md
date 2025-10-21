# Quick Debug Checklist - AI Rule Name Matching

## The Issue
AI returned: `"clinician_names": ["Dr Saeed"]`
But we want: `"clinician_names": ["Dr Mohammad Saeed"]` (exact database name)

## 3-Step Debug Process

### Step 1: Verify Data Exists (30 seconds)
1. Open `test_context_data.html` in browser
2. Look for "Saeed" in the clinician list
3. **Question:** Is there a clinician with "Saeed" in their name?

**If NO:** That's why! Database doesn't have that clinician for site 2.
- Try a different site_id
- Or use a clinician name that exists

**If YES:** Note the exact name format (e.g., "Dr Mohammad Saeed")

---

### Step 2: Verify Context Is Sent (1 minute)
1. Open `emis_rule_creator_ai.html` in browser
2. Select site 2
3. Look at console output:
   ```
   [12:34:56] [INFO] 📋 Sample clinicians: Dr Mohammad Saeed, Dr Jane Smith...
   ```
4. Enter your rule and click Generate
5. Click **REQUEST** tab
6. **Question:** Does `context.available_clinicians` have names in it?

**If NO:** Context not loading!
- Check console for errors
- Verify Supabase connection
- Try refreshing page

**If YES:** Context is being sent correctly ✅

---

### Step 3: Check AI Response (1 minute)
1. After generating rule, click **PARSED RULE** tab
2. Look at `config.clinician_names` array
3. **Question:** Does it match the exact database name?

**If NO:** AI didn't match correctly
- This was the original issue
- Should be fixed with new deployment
- Edge Function redeployed with stronger instructions

**If YES:** Working correctly! ✅

---

## Quick Visual Check

### What You Should See in Console
```
[12:34:56] [INFO] Site selected: 2
[12:34:56] [INFO] 📋 Loading context data from database...
[12:34:57] [SUCCESS] ✅ Loaded 25 clinicians and 8 slot types
[12:34:57] [INFO] 📋 Sample clinicians: Dr Mohammad Saeed, Dr Jane Smith, Dr John Brown...
[12:34:57] [INFO] 📋 Sample slot types: Duty, Routine, Emergency...
```

### What You Should See in REQUEST Tab
```json
{
  "rule_text": "Dr Saeed cannot have appointments less than 20 minutes",
  "site_id": 2,
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

### What You Should See in PARSED RULE Tab
```json
{
  "rule_type": "slot_duration_requirement",
  "name": "Dr Saeed Minimum Appointment Duration",
  "config": {
    "clinician_names": ["Dr Mohammad Saeed"],  ← Exact database name!
    "slot_types": [],
    "operator": "gte",
    "value": 20,
    "applies_to_all_clinicians": false
  }
}
```

---

## Common Issues & Quick Fixes

| Issue | What You See | Fix |
|-------|-------------|-----|
| No data for site | `Clinicians: 0` in metrics | Use different site_id |
| Context not loading | Empty arrays in REQUEST | Check Supabase connection |
| AI not matching | Wrong name in PARSED RULE | Already fixed - try again! |
| Database has different format | Name exists but different format | AI should fuzzy match |

---

## Files to Use

1. **test_context_data.html** - See what's in database
2. **emis_rule_creator_ai.html** - Main interface
3. **Supabase Dashboard** - Check Edge Function logs

---

## The Fix (Already Applied)

The Edge Function now:
- ✅ Shows context data **first** (before schema)
- ✅ Uses **🚨 CRITICAL** markers to emphasize matching
- ✅ Explicitly says **"DO NOT use user's input verbatim"**
- ✅ Provides example showing matching: "Dr Saeed" → "Dr Mohammad Saeed"
- ✅ Deployed and active

---

## One-Line Test Command

Try this in console after selecting site:
```javascript
console.log('Context:', session.contextData)
```

Should show arrays of clinicians and slot types.

---

## Expected Timeline

- ⏱️ 30 seconds: Run test_context_data.html
- ⏱️ 1 minute: Verify context in emis_rule_creator_ai.html
- ⏱️ 30 seconds: Generate rule and check result
- ⏱️ **Total: ~2 minutes to verify fix**

---

**Bottom Line:** The fix is deployed. If AI still returns wrong names, check that the database actually has the clinician for that site using the test tool.
