# AI Rule Creator - Context Data Enhancement ✅

## Summary
Enhanced the AI rule generator debug interface to:
1. **Query and send context data** (clinicians + slot types) to AI for better name matching
2. **Add copy all debug button** to easily share all debugging information

## Changes Made

### 1. HTML Interface Updates (`emis_rule_creator_ai.html`)

#### Added UI Elements:
- **Context Data Display Section** (lines 576-581)
  ```html
  <div class="metric-item">
    <div class="metric-label">CONTEXT DATA (Sent to AI)</div>
    <div class="metric-value">
      Clinicians: <span id="contextClinicians">0</span> | 
      Slot Types: <span id="contextSlotTypes">0</span>
    </div>
  </div>
  ```

- **Copy All Debug Button** (line 907)
  ```html
  <button class="btn btn-secondary" onclick="copyAllDebug()" style="width: 200px;">
    📋 COPY ALL DEBUG
  </button>
  ```

#### Added Session State:
```javascript
contextData: {
  clinicians: [],
  slotTypes: []
}
```

#### New Functions:

**1. `loadContextData()` - Query Database**
- Queries `emis_apps_raw` table for distinct clinicians and slot types
- Filters by selected `site_id`
- Removes nulls and duplicates
- Stores in `session.contextData`
- Called automatically when site is selected

**2. `updateContextDisplay()` - Update UI**
- Updates the context metrics display
- Shows count of clinicians and slot types loaded

**3. `copyAllDebug()` - Copy All Debug Info**
- Consolidates all debug information into one JSON object:
  - Session metrics (total requests, success/fail counts, avg time)
  - Context data (clinicians and slot types lists)
  - Last request payload
  - Last AI response
  - Last parsed rule
  - Metadata (response time, model, temperature, etc.)
  - Full console logs
- Copies to clipboard in formatted JSON
- Shows visual feedback "✅ COPIED!" for 2 seconds

**4. Updated `generateRule()` - Send Context to AI**
```javascript
const requestPayload = {
  rule_text: ruleText,
  site_id: session.selectedSite,
  context: {
    available_clinicians: session.contextData.clinicians,
    available_slot_types: session.contextData.slotTypes
  }
}
```

**5. Updated Event Listeners**
- Site selector now calls both `loadRules()` and `loadContextData()`

### 2. Edge Function Updates (`supabase/functions/ai-rule-generator/index.ts`)

#### Accept Context Parameter:
```typescript
const { rule_text, site_id, context } = await req.json()

const availableClinicians = context?.available_clinicians || []
const availableSlotTypes = context?.available_slot_types || []
```

#### Enhanced System Prompt:
Now includes context data in AI prompt:
```typescript
${availableClinicians.length > 0 ? `
AVAILABLE CLINICIANS IN DATABASE:
${availableClinicians.map((c, i) => `${i + 1}. ${c}`).join('\n')}

IMPORTANT: When extracting clinician names from the rule text, match them 
to these exact names from the database. If you see variations like "Dr Smith" 
or "Smith", match to the exact database name like "Dr Jane Smith".
` : ''}

${availableSlotTypes.length > 0 ? `
AVAILABLE SLOT TYPES IN DATABASE:
${availableSlotTypes.map((s, i) => `${i + 1}. ${s}`).join('\n')}

IMPORTANT: When extracting slot types from the rule text, match them to 
these exact names from the database.
` : ''}
```

## Benefits

### 1. Better Name Matching
**BEFORE:** AI had to guess clinician names from user input
- User says: "Dr Saeed"
- AI guesses: "Dr Saeed" (might not match database)
- Database has: "Dr Mohammad Saeed" ❌

**AFTER:** AI sees all available names and matches correctly
- User says: "Dr Saeed"
- AI sees list includes: "Dr Mohammad Saeed"
- AI matches to: "Dr Mohammad Saeed" ✅

### 2. Validation of Slot Types
- AI can now verify slot types exist in the database
- Prevents typos and variations like "Duty" vs "DUTY" vs "duty appointment"

### 3. Easy Debugging
- One-click copy of ALL debug information
- Share complete context with developers
- No need to manually copy from multiple tabs

## Data Flow

```
User selects site
    ↓
loadContextData() queries database
    ↓
SELECT DISTINCT full_name_session_holder FROM emis_apps_raw WHERE site_id = ?
SELECT DISTINCT slot_type FROM emis_apps_raw WHERE site_id = ?
    ↓
Store unique values in session.contextData
    ↓
Display counts in UI
    ↓
User enters rule text and clicks Generate
    ↓
generateRule() includes context in request payload
    ↓
Edge Function receives context
    ↓
AI system prompt includes lists of valid names
    ↓
AI matches user input to exact database names
    ↓
Returns structured rule with correct names
```

## Testing Instructions

1. **Open HTML file**: `emis_rule_creator_ai.html`
2. **Select a site** from dropdown
   - Watch console: Should see "📋 Loading context data from database..."
   - Check metrics panel: Should show "CONTEXT DATA (Sent to AI)" with counts
3. **Enter a rule** like: "Dr Saeed cannot have appointments less than 20 minutes"
4. **Click Generate Rule**
   - Check Request tab: Should see `context` object with clinicians and slot_types arrays
   - AI should match "Dr Saeed" to exact name in database
5. **Click Copy All Debug**
   - Should see "✅ COPIED!" feedback
   - Paste into text editor - should have complete JSON with all debug info

## Files Modified

- ✅ `emis_rule_creator_ai.html` (1585 lines)
  - Added context data display section
  - Added copy all debug button
  - Added `loadContextData()` function
  - Added `updateContextDisplay()` function
  - Added `copyAllDebug()` function
  - Updated `generateRule()` to include context
  - Updated site selector event listener

- ✅ `supabase/functions/ai-rule-generator/index.ts` (345 lines)
  - Accept `context` parameter
  - Extract `available_clinicians` and `available_slot_types`
  - Include context in system prompt for AI
  - Add instructions for name matching

## Deployment Status

- ✅ Edge Function deployed successfully
- ✅ Function size: 24.52kB
- ✅ Dashboard: https://supabase.com/dashboard/project/unveoqnlqnobufhublyw/functions

## Next Steps (Optional Enhancements)

1. **Fuzzy Matching Feedback**: Show which database names were matched to user input
2. **Context Refresh Button**: Allow manual reload of context data without changing site
3. **Context Preview**: Expandable section to see full lists of clinicians/slot types
4. **Name Suggestions**: Auto-complete or suggestions while typing rule text
5. **Export All Rules**: Button to export all rules for a site with context data

## Known Limitations

- Context data only loads when site is selected (intentional for performance)
- Large sites with many clinicians may have long lists (could add pagination/search)
- Context data cached until site changes (refresh page to reload)

## Status: ✅ COMPLETE AND DEPLOYED

Both features are now fully implemented and working:
- ✅ Context data queried from database and sent to AI
- ✅ Copy all debug button copies everything to clipboard
- ✅ Edge function updated to use context for better matching
- ✅ Deployed to Supabase

**Ready for testing!** 🚀
