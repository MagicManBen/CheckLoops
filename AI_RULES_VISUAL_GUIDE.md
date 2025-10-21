# AI Rules Page - Quick Visual Guide

## 📍 Where to Find It

```
emis_reporting.html Navigation Bar:
┌──────────────────────────────────────────────────────────────┐
│  Dashboard  │  Raw Data  │  ⭐ AI Rules  │  Settings  │  Calendar  │
└──────────────────────────────────────────────────────────────┘
                               ↑
                         Click here!
```

## 🎨 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  AI Rule Creator                                                │
│  Create validation rules using natural language...              │
├─────────────────────────────────────┬───────────────────────────┤
│                                     │                           │
│  LEFT COLUMN (Input & Preview)      │  RIGHT COLUMN (Rules)     │
│                                     │                           │
│  ┌───────────────────────────────┐ │  ┌─────────────────────┐ │
│  │ Describe Your Rule            │ │  │ Active Rules        │ │
│  │                               │ │  │                     │ │
│  │ [Large Textarea]              │ │  │ ┌─────────────────┐ │ │
│  │                               │ │  │ │ Rule 1         │ │ │
│  │                               │ │  │ │ [Toggle] ON    │ │ │
│  └───────────────────────────────┘ │  │ └─────────────────┘ │ │
│                                     │  │                     │ │
│  [🪄 Generate Rule]  [❌ Clear]    │  │ ┌─────────────────┐ │ │
│                                     │  │ │ Rule 2         │ │ │
│  Quick Examples:                    │  │ │ [Toggle] OFF   │ │ │
│  [Min Duration] [Daily Count]       │  │ └─────────────────┘ │ │
│  [Clinician Restriction]            │  │                     │ │
│                                     │  │ ┌─────────────────┐ │ │
│  ┌───────────────────────────────┐ │  │ │ Rule 3         │ │ │
│  │ ✅ Generated Rule             │ │  │ │ [Toggle] ON    │ │ │
│  │                               │ │  │ └─────────────────┘ │ │
│  │ Dr Saeed Minimum Appointment  │ │  └─────────────────────┘ │
│  │ Duration                      │ │                           │
│  │                               │ │                           │
│  │ Type: slot_duration_requirement│ │                           │
│  │ Severity: error               │ │                           │
│  │                               │ │                           │
│  │ [💾 Save Rule]  [▶ Test]     │ │                           │
│  └───────────────────────────────┘ │                           │
│                                     │                           │
│  ┌───────────────────────────────┐ │                           │
│  │ 📋 Test Results               │ │                           │
│  │                               │ │                           │
│  │ ✅ No violations found!       │ │                           │
│  │ Tested 87 appointments        │ │                           │
│  └───────────────────────────────┘ │                           │
│                                     │                           │
└─────────────────────────────────────┴───────────────────────────┘
```

## 🔄 Workflow

```
1. Type Rule
   ↓
2. Click "Generate Rule"
   ↓
3. AI Processes (2-5 seconds)
   ↓
4. Preview Appears (Green Box)
   ↓
5. OPTIONAL: Click "Test"
   ↓
6. Review Test Results (Yellow Box)
   ↓
7. Click "Save Rule"
   ↓
8. Rule Appears in Right Column
   ↓
9. Rule is Now Active! ✅
```

## 💬 Example Inputs

### Example 1: Duration Rule
```
Input: "Dr Saeed cannot have appointments less than 60 minutes"

AI Returns:
✅ Dr Saeed Minimum Appointment Duration
   Type: slot_duration_requirement
   Clinician: SAEED, Salman (Dr)  ← Matched to exact DB name!
   Operator: gte
   Value: 60
```

### Example 2: Daily Count Rule
```
Input: "There must be at least 5 emergency slots each weekday"

AI Returns:
✅ Daily Emergency Slot Requirement
   Type: daily_slot_count
   Slot Types: [Emergency]
   Operator: gte
   Count: 5
   Days: Mon-Fri
```

### Example 3: Clinician Restriction
```
Input: "Dr Smith cannot perform surgery appointments"

AI Returns:
✅ Dr Smith Surgery Restriction
   Type: clinician_slot_restriction
   Clinician: SMITH, Jane (Dr)  ← Matched!
   Slot Types: [Surgery]
   Restriction: cannot_perform
```

## 🎨 Color Coding

```
🟢 Green = Success / Generated Rule
   - Background: #f0fdf4
   - Border: #86efac
   - Used for: Generated rule preview

🟡 Yellow = Testing / Information
   - Background: #fef3c7
   - Border: #fbbf24
   - Used for: Test results section

🔵 Blue = Primary Actions
   - Background: #3b82f6
   - Used for: Generate button, active nav button

⚪ White = Content / Cards
   - Background: white
   - Border: #e2e8f0
   - Used for: Rule cards, input areas

🟢 Green Toggle = Rule Enabled
🔘 Gray Toggle = Rule Disabled
```

## 🎯 Quick Test Scenarios

### Test 1: Min Duration Rule
```
1. Click "AI Rules" in navigation
2. Click [Min Duration] quick example
3. Click "Generate Rule"
4. Wait 2-5 seconds
5. Review generated rule
6. Click "Test" (optional)
7. Click "Save Rule"
8. ✅ Rule saved!
```

### Test 2: Custom Rule
```
1. Type: "Dr Brown needs at least 30 minute appointments"
2. Click "Generate Rule"
3. Verify AI matched "Dr Brown" to exact DB name
4. Click "Test"
5. Review violations (if any)
6. Click "Save Rule"
7. ✅ Rule is active!
```

### Test 3: Toggle Rule
```
1. Find a rule in right column
2. Click the toggle switch
3. Green = Enabled
4. Gray = Disabled
5. ✅ Rule status updated!
```

## 🎭 States

### Loading State
```
┌────────────────────┐
│   [Spinner]        │
│   Loading rules... │
└────────────────────┘
```

### Empty State
```
┌────────────────────┐
│ No rules created   │
│ yet                │
└────────────────────┘
```

### Generating State
```
[⏳ Generating...]  ← Button shows spinner
```

### Success State
```
✅ Rule saved successfully!
```

### Error State
```
❌ Failed to generate rule: [error message]
```

## 📊 Test Results Examples

### No Violations (Success)
```
┌─────────────────────────────────┐
│ 📋 Test Results                 │
│                                 │
│   ✅ No violations found!       │
│   Tested 87 appointments from   │
│   the last 7 days               │
└─────────────────────────────────┘
```

### Violations Found (Warning)
```
┌─────────────────────────────────────────────────────┐
│ 📋 Test Results                                     │
│                                                     │
│ Found 3 violations in 87 appointments tested:       │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ 2025-10-20 09:00 - SAEED, Salman (Dr)      │   │
│ │ Routine - Duration 15min doesn't meet       │   │
│ │ requirement (gte 60min)                     │   │
│ ├─────────────────────────────────────────────┤   │
│ │ 2025-10-20 14:30 - SAEED, Salman (Dr)      │   │
│ │ Emergency - Duration 30min doesn't meet     │   │
│ │ requirement (gte 60min)                     │   │
│ ├─────────────────────────────────────────────┤   │
│ │ 2025-10-21 10:15 - SAEED, Salman (Dr)      │   │
│ │ Routine - Duration 20min doesn't meet       │   │
│ │ requirement (gte 60min)                     │   │
│ └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## 🔧 Troubleshooting

### Problem: "Please select a site first"
**Solution:** Select a site from the site dropdown at the top before navigating to AI Rules

### Problem: No clinicians loading
**Solution:** Make sure the selected site has appointment data in `emis_apps_raw` table

### Problem: AI returns wrong clinician name
**Solution:** Check the diagnostic tool (`test_context_data.html`) to see exact names in database

### Problem: Can't save rule
**Solution:** Check browser console for errors, verify Supabase connection

### Problem: Test doesn't show results
**Solution:** Make sure site has appointments in last 7 days in `emis_apps_filled` table

## 📱 Responsive Design

```
Desktop (>1200px):
┌──────────────────┬──────────┐
│ Input & Preview  │  Rules   │
│                  │  List    │
└──────────────────┴──────────┘

Mobile (<768px):
┌──────────────────┐
│ Input & Preview  │
├──────────────────┤
│ Rules List       │
│ (stacked below)  │
└──────────────────┘
```

## 🎉 Success Indicators

✅ Rule created and appears in list
✅ Toggle switch shows green (enabled)
✅ Test shows "No violations found"
✅ Input clears after save
✅ Rule preview disappears after save
✅ Success alert appears

---

**Ready to create your first rule?** Open `emis_reporting.html`, select a site, click "AI Rules" in the nav bar, and start typing! 🚀
