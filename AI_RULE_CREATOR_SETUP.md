# AI Rule Creator System - Setup & Documentation

## 🚀 Overview

This system allows users to create EMIS validation rules using natural language. Simply type a rule in plain English (e.g., "Dr Smith cannot see wound check appointments"), and ChatGPT converts it into a structured JSON format that can be stored and executed.

## 📋 Files Created

1. **`/supabase/functions/ai-rule-generator/index.ts`** - Edge Function that processes natural language via ChatGPT
2. **`emis_rule_creator_ai.html`** - Beautiful UI for creating and managing rules
3. **`AI_RULE_CREATOR_SETUP.md`** - This documentation file

## 🔧 Setup Instructions

### Step 1: Deploy the Edge Function

```bash
# Navigate to your project root
cd /Users/benhoward/Desktop/CheckLoop/checkloops

# Deploy the edge function with the OpenAI API key
supabase functions deploy ai-rule-generator --no-verify-jwt

# Set the OpenAI API key as an environment secret
supabase secrets set OPENAI_API_KEY=<YOUR_OPENAI_API_KEY>
```

### Step 2: Test the Edge Function

```bash
# Test with curl (replace with your actual Supabase URL and anon key)
curl -X POST 'https://unveoqnlqnobufhublyw.supabase.co/functions/v1/ai-rule-generator' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME' \
  -H 'Content-Type: application/json' \
  -d '{"rule_text": "Dr Smith cannot see wound check appointments", "site_id": 2}'
```

### Step 3: Open the UI

Simply open `emis_rule_creator_ai.html` in your browser. The file is standalone and includes all necessary code.

## 📚 Supported Rule Types

The AI can interpret and create these rule types:

### 1. **Clinician Slot Restriction**
Restricts specific clinicians from performing certain appointment types.

**Examples:**
- "Dr Smith cannot see wound check appointments"
- "Dr Jones can only perform consultation appointments"
- "Dr Brown and Dr Wilson are not allowed to do surgical procedures"

**JSON Structure:**
```json
{
  "rule_type": "clinician_slot_restriction",
  "config": {
    "clinician_names": ["Dr Smith"],
    "slot_types": ["Wound Check"],
    "restriction_type": "cannot_perform"
  }
}
```

### 2. **Slot Duration Requirement**
Enforces minimum or maximum duration for appointment types.

**Examples:**
- "Wound checks must be at least 15 minutes long"
- "Consultation appointments should be no longer than 30 minutes"
- "Emergency slots must be exactly 20 minutes"

**JSON Structure:**
```json
{
  "rule_type": "slot_duration_requirement",
  "config": {
    "slot_types": ["Wound Check"],
    "operator": "gte",
    "value": 15,
    "applies_to_all_clinicians": true
  }
}
```

**Operators:**
- `gte` = greater than or equal to (>=)
- `gt` = greater than (>)
- `lte` = less than or equal to (<=)
- `lt` = less than (<)
- `eq` = equal to (=)

### 3. **Daily Slot Count**
Requires minimum or maximum count of specific appointment types per day.

**Examples:**
- "There must be at least 2 emergency slots each day"
- "We need exactly 1 Duty appointment on weekdays"
- "No more than 5 walk-in appointments per day"

**JSON Structure:**
```json
{
  "rule_type": "daily_slot_count",
  "config": {
    "slot_types": ["Emergency"],
    "operator": "gte",
    "count": 2,
    "days": "all"
  }
}
```

### 4. **Slot Distribution**
Ensures appointments are distributed across multiple clinicians.

**Examples:**
- "Dr Martinez, Dr Chen, and Dr Patel must each have at least one teaching session per week"
- "Every doctor should have at least 2 consultation slots daily"

**JSON Structure:**
```json
{
  "rule_type": "slot_distribution",
  "config": {
    "slot_types": ["Teaching Session"],
    "required_clinicians": ["Dr Martinez", "Dr Chen", "Dr Patel"],
    "min_per_clinician": 1,
    "period": "weekly"
  }
}
```

### 5. **Time Restriction**
Restricts when certain appointments can be scheduled.

**Examples:**
- "Surgical procedures cannot be scheduled after 4pm on Fridays"
- "Blood tests must be done between 8am and 10am"
- "Dr Johnson only sees patients after 2pm on Wednesdays"

**JSON Structure:**
```json
{
  "rule_type": "time_restriction",
  "config": {
    "slot_types": ["Surgical Procedure"],
    "allowed_times": {
      "start_time": "00:00",
      "end_time": "16:00"
    },
    "days": ["Friday"]
  }
}
```

### 6. **Slot Sequence**
Requires specific ordering or gaps between appointments.

**Examples:**
- "Pre-op assessments must come before surgery appointments"
- "There must be at least 30 minutes between consecutive surgeries"

**JSON Structure:**
```json
{
  "rule_type": "slot_sequence",
  "config": {
    "primary_slot_type": "Surgery",
    "requires_before": ["Pre-op Assessment"],
    "min_gap_minutes": 30
  }
}
```

## 🎯 Usage Guide

### Creating a New Rule

1. **Select a Site** - Choose which medical practice/site the rule applies to
2. **Describe the Rule** - Type your rule in natural language
3. **Click "Generate with AI"** - ChatGPT interprets and structures the rule
4. **Review the Preview** - Check the human-readable interpretation
5. **Save** - Store the rule in the database

### Example Workflow

```
User Input: "Dr Smith cannot perform blood test appointments"

AI Output:
{
  "rule_type": "clinician_slot_restriction",
  "name": "Dr Smith Blood Test Restriction",
  "description": "Prevents Dr Smith from being assigned blood test appointments",
  "severity": "error",
  "config": {
    "clinician_names": ["Dr Smith"],
    "slot_types": ["Blood Test"],
    "restriction_type": "cannot_perform"
  },
  "human_readable": "Dr Smith is not permitted to conduct Blood Test appointments"
}
```

## 🔍 Testing Examples

Here are test cases you can try:

### Test Case 1: Simple Clinician Restriction
```
Input: "Dr Johnson cannot do home visits"
Expected: clinician_slot_restriction with cannot_perform
```

### Test Case 2: Duration Requirement
```
Input: "All consultations must be at least 20 minutes"
Expected: slot_duration_requirement with operator "gte" and value 20
```

### Test Case 3: Daily Count with Days
```
Input: "We need at least one Duty appointment each weekday"
Expected: daily_slot_count with days Monday-Friday
```

### Test Case 4: Complex Distribution
```
Input: "Dr Lee, Dr Kim, and Dr Park must each have at least 3 patient slots daily"
Expected: slot_distribution with specified clinicians
```

### Test Case 5: Time Window
```
Input: "Blood draws can only happen between 7am and 10am"
Expected: time_restriction with start_time "07:00" and end_time "10:00"
```

## 🛠️ Troubleshooting

### Edge Function Returns 500 Error
- **Check OpenAI API Key**: Ensure the key is set correctly in Supabase secrets
- **View Logs**: `supabase functions logs ai-rule-generator`
- **Verify Deployment**: Ensure the function is deployed without errors

### AI Returns Unexpected Results
- **Be Specific**: Include exact names (clinician names, slot types)
- **Use Clear Language**: "cannot do X" is clearer than "shouldn't really do X"
- **Check Examples**: Use the provided examples as templates

### Rules Not Saving
- **Check RLS Policies**: Ensure your Supabase user has INSERT permission on `emis_validation_rules`
- **Verify Site ID**: Make sure you've selected a valid site
- **Console Errors**: Open browser DevTools to see detailed error messages

## 🔐 Security Notes

1. **API Key Storage**: The OpenAI API key is stored as a Supabase secret (not in code)
2. **CORS**: The edge function allows all origins - restrict this in production if needed
3. **RLS**: Ensure Row Level Security policies are properly configured on `emis_validation_rules`

## 📊 Database Schema

The system uses the existing `emis_validation_rules` table:

```sql
CREATE TABLE public.emis_validation_rules (
  id BIGSERIAL PRIMARY KEY,
  site_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  severity TEXT NOT NULL DEFAULT 'warning',
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🚧 Future Enhancements

Potential improvements:
- **Rule Templates**: Pre-defined templates for common rules
- **Bulk Import**: Upload multiple rules from CSV
- **Rule Testing**: Simulate rules against historical data
- **Conflict Detection**: Identify rules that contradict each other
- **Version History**: Track changes to rules over time
- **Export/Import**: Share rules between sites

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Review Supabase function logs: `supabase functions logs ai-rule-generator`
3. Test the edge function directly with curl
4. Verify your OpenAI API key is valid and has credits

## 🎉 Success Metrics

The system is working correctly when:
- ✅ Natural language rules are converted to structured JSON
- ✅ Rules save successfully to the database
- ✅ Existing rules display correctly in the UI
- ✅ Rule enable/disable toggle works
- ✅ Multiple rule types are supported

---

**Created:** October 2025  
**Version:** 1.0  
**System:** EMIS Validation Rules - AI Creator
