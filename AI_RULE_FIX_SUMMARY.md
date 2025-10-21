# 🔧 AI Rule System - Bug Fixes Applied

**Date:** 21 October 2025  
**Issue:** Schema constraint violation & rule testing failures

## 🐛 Problems Identified

### 1. Database Constraint Mismatch
**Error:**
```
new row for relation "emis_validation_rules" violates check constraint "emis_validation_rules_rule_type_check"
```

**Root Cause:**
- AI generates rule type: `slot_duration_requirement`
- Database CHECK constraint only allows: `['daily_check', 'slot_duration', 'slot_count', 'custom']`
- Mismatch between AI vocabulary and DB schema

### 2. Test Function Failures
**Problem:**
- Rule: "Dr Saeed cannot have appointments less than 60 minutes"
- Test result: "No violations found" (incorrect)
- Actual data: All appointments ARE less than 60 minutes

**Root Causes:**
- Test function looked for `rule.config.min_duration` but AI generates `rule.config.value`
- No handling of clinician-specific rules (`clinician_names` array)
- No handling of `applies_to_all_clinicians` flag
- No handling of `operator` field (gte, lt, etc.)

### 3. Insufficient Debugging
- No visibility into what AI was generating
- No logs showing which appointments were being tested
- No debug info showing filter matches

---

## ✅ Fixes Applied

### Fix 1: Edge Function Rule Type Mapping
**File:** `supabase/functions/ai-rule-generator/index.ts`

Added automatic mapping of AI rule types to DB-compatible types:

```typescript
const ruleTypeMapping: Record<string, string> = {
  'slot_duration_requirement': 'slot_duration',
  'daily_slot_count': 'daily_check',
  'clinician_slot_restriction': 'custom',
  'slot_distribution': 'custom',
  'time_restriction': 'custom',
  'slot_sequence': 'custom'
}

const dbRuleType = ruleTypeMapping[parsedRule.rule_type] || parsedRule.rule_type
```

**Result:** AI can use descriptive names, but database receives valid constraint-compliant types.

---

### Fix 2: Comprehensive Test Function Rewrite
**File:** `emis_reporting.html` → `runRuleTest()` function

#### Old Logic (broken):
```javascript
if (rule.rule_type === 'slot_duration') {
  const { slot_type, min_duration } = rule.config;
  
  data.forEach(row => {
    const duration = row['Slot Duration'] || 0;
    const slotTypeMatch = !slot_type || rowSlotType === slot_type;
    
    if (slotTypeMatch && duration < min_duration) {
      violations.push(...);
    }
  });
}
```

**Problems:**
- Only looked for `min_duration` (doesn't exist in AI-generated config)
- No clinician filtering
- Hard-coded `<` operator
- No slot type array handling

#### New Logic (fixed):
```javascript
if (rule.rule_type === 'slot_duration') {
  const config = rule.config;
  const slotTypes = config.slot_types || [];
  const operator = config.operator || 'gte';
  const value = config.value || config.min_duration || 0;
  const appliesToAllClinicians = config.applies_to_all_clinicians !== false;
  const clinicianNames = config.clinician_names || [];
  
  data.forEach(row => {
    // 1. Clinician filter
    let clinicianMatch = appliesToAllClinicians;
    if (!appliesToAllClinicians && clinicianNames.length > 0) {
      clinicianMatch = clinicianNames.some(name => 
        rowClinician.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(rowClinician.toLowerCase())
      );
    }
    
    // 2. Slot type filter
    let slotTypeMatch = slotTypes.length === 0;
    if (!slotTypeMatch) {
      slotTypeMatch = slotTypes.some(type => 
        rowSlotType.toLowerCase().includes(type.toLowerCase()) ||
        type.toLowerCase().includes(rowSlotType.toLowerCase())
      );
    }
    
    if (!clinicianMatch || !slotTypeMatch) return; // Skip
    
    // 3. Apply operator
    let violates = false;
    switch (operator) {
      case 'gte': violates = duration < value; break;
      case 'gt':  violates = duration <= value; break;
      case 'lte': violates = duration > value; break;
      case 'lt':  violates = duration >= value; break;
      case 'eq':  violates = duration !== value; break;
    }
    
    if (violates) violations.push(...);
  });
}
```

**Improvements:**
✅ Handles `slot_types` array (empty = all types)  
✅ Handles `clinician_names` array with fuzzy matching  
✅ Handles `applies_to_all_clinicians` flag  
✅ Supports all operators: `gte`, `gt`, `lte`, `lt`, `eq`  
✅ Falls back to legacy `min_duration` for backwards compatibility

---

### Fix 3: Comprehensive Debug Logging

#### Added to `generateRule()`:
```javascript
console.log('🤖 === GENERATING RULE ===');
console.log('User input:', input);
console.log('Severity:', selectedSeverity);
console.log('Site ID:', this.currentSite);
console.log('Request body:', JSON.stringify(requestBody, null, 2));
console.log('📥 AI response received:', data);
console.log('✅ AI generated rule:', JSON.stringify(data.rule, null, 2));
```

#### Added to `saveRule()`:
```javascript
console.log('💾 === SAVING RULE ===');
console.log('Rule to save:', JSON.stringify(this.generatedRule, null, 2));
console.log('📤 Sending to database...');
console.log('❌ Database error:', error); // on error
console.log('✅ Rule saved successfully:', data);
```

#### Added to `runRuleTest()`:
```javascript
console.log('🧪 === RUNNING RULE TEST ===');
console.log('Rule:', JSON.stringify(rule, null, 2));
console.log('📅 Querying appointments from ${startDate}');
console.log('📊 Retrieved ${data.length} appointments to test');
console.log('Sample appointment structure:', {...});

console.log(`📋 Rule parameters:
  - Slot types filter: ${slotTypes.join(', ')}
  - Operator: ${operator}
  - Value: ${value} minutes
  - Applies to all clinicians: ${appliesToAllClinicians}
  - Specific clinicians: ${clinicianNames.join(', ')}`);

console.log(`✅ Test complete:
  - Total appointments: ${data.length}
  - Matched clinician filter: ${matchedClinicianCount}
  - Matched slot type filter: ${matchedSlotTypeCount}
  - Actually tested: ${testedCount}
  - Violations found: ${violations.length}`);
```

#### Added to `displayTestResults()`:
- Added expandable debug info panel in UI
- Shows rule config, date range, query stats
- Visible in both "no violations" and "violations found" states

---

## 🧪 Testing Required

### Test Case 1: Dr Saeed Minimum Duration
**Input:** "Dr Saeed cannot have appointments less than 60 minutes"

**Expected AI Output:**
```json
{
  "rule_type": "slot_duration_requirement",  // AI uses this
  "config": {
    "slot_types": [],                        // Empty = all types
    "operator": "gte",
    "value": 60,
    "applies_to_all_clinicians": false,
    "clinician_names": ["SAEED, Salman (Dr)"] // Matched to DB
  }
}
```

**Expected DB Insert:**
```json
{
  "rule_type": "slot_duration",  // Mapped to DB type
  "config": { ... same ... }
}
```

**Expected Test Result:**
- Should find violations where Dr Saeed has appointments < 60 min
- Console should show:
  - Total appointments queried
  - How many matched "Dr Saeed" filter
  - List of violations with dates/times/durations

---

### Test Case 2: General Duration Rule
**Input:** "All consultations must be at least 20 minutes"

**Expected:**
```json
{
  "rule_type": "slot_duration",
  "config": {
    "slot_types": ["Consultation"],
    "operator": "gte",
    "value": 20,
    "applies_to_all_clinicians": true
  }
}
```

Should find violations across ALL clinicians where slot type matches "Consultation" and duration < 20.

---

## 📋 Deployment Checklist

- [x] Update Edge Function code
- [ ] Deploy Edge Function: `npx supabase functions deploy ai-rule-generator`
- [ ] Test rule generation in UI
- [ ] Test rule saving to database
- [ ] Test rule testing function
- [ ] Verify console logs are detailed
- [ ] Check error messages are helpful

---

## 🔍 How to Verify Fixes

### 1. Check Edge Function
```bash
cd /Users/benhoward/Desktop/CheckLoop/checkloops
npx supabase functions deploy ai-rule-generator
```

### 2. Test in Browser
1. Open `emis_reporting.html` → AI Rules page
2. Enter: "Dr Saeed cannot have appointments less than 60 minutes"
3. Click "Generate Rule"
4. **Check console** for:
   - `🤖 === GENERATING RULE ===`
   - Request body with context
   - AI response with `debug.db_compatible_type: "slot_duration"`
5. Click "Test"
6. **Check console** for:
   - `🧪 === RUNNING RULE TEST ===`
   - Rule parameters showing operator, value, clinician filter
   - Test results showing matched/tested counts
7. Click "Save Rule"
8. **Check console** for:
   - `💾 === SAVING RULE ===`
   - Success or detailed error

### 3. Expected Console Output
```
🤖 === GENERATING RULE ===
User input: Dr Saeed cannot have appointments less than 60 minutes
...
✅ AI generated rule: {
  "rule_type": "slot_duration",
  "config": {
    "operator": "gte",
    "value": 60,
    "clinician_names": ["SAEED, Salman (Dr)"]
  }
}

🧪 === RUNNING RULE TEST ===
📋 Rule parameters:
  - Operator: gte
  - Value: 60 minutes
  - Specific clinicians: SAEED, Salman (Dr)
...
✅ Test complete:
  - Total appointments: 1000
  - Matched clinician filter: 85
  - Actually tested: 85
  - Violations found: 85
```

---

## 🚀 Next Steps

1. **Deploy the edge function** (critical)
2. **Test the full workflow** with Dr Saeed rule
3. **Verify violations are found** (should find 85+ violations)
4. **Check debug info** is visible in UI
5. **Save the rule** and confirm no constraint error
6. Document any remaining issues

---

## 📞 Support

If issues persist after these fixes:

1. **Check browser console** for detailed logs
2. **Check Supabase Edge Function logs:**
   ```bash
   npx supabase functions logs ai-rule-generator
   ```
3. **Verify database constraint:**
   ```sql
   SELECT conname, pg_get_constraintdef(oid) 
   FROM pg_constraint 
   WHERE conrelid = 'emis_validation_rules'::regclass;
   ```

---

**Status:** ✅ Fixes applied, awaiting deployment and testing
