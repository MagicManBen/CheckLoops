# EMIS Slot Type Classification - Patch Summary

## Overview
Integrated Supabase Edge Function `classify-slot-types` into `emis_checker.html` to automatically classify appointment slot types using OpenAI with client-side validation.

## Changes Made to `emis_checker.html`

### 1. Client-Side Nudge Validation (Lines ~1410-1440)
Added regex-based validation to enforce urgent/emergency slots are always in "On the day" category:

```javascript
// Client-side nudge: enforce urgent/emergency slots are in "on_the_day"
const urgentPattern = /\b(emergency|urgent|same\s*day|book\s*on\s*day|bod)\b/i;
const nudgedClassification = {
  on_the_day: [...(classification.on_the_day || [])],
  within_1_week: [],
  within_2_weeks: []
};

// Check within_1_week for urgent slots
(classification.within_1_week || []).forEach(slot => {
  if (urgentPattern.test(slot)) {
    console.log(`🔄 Client nudge: Moving "${slot}" from within_1_week → on_the_day`);
    nudgedClassification.on_the_day.push(slot);
  } else {
    nudgedClassification.within_1_week.push(slot);
  }
});

// Check within_2_weeks for urgent slots
(classification.within_2_weeks || []).forEach(slot => {
  if (urgentPattern.test(slot)) {
    console.log(`🔄 Client nudge: Moving "${slot}" from within_2_weeks → on_the_day`);
    nudgedClassification.on_the_day.push(slot);
  } else {
    nudgedClassification.within_2_weeks.push(slot);
  }
});

// Dedupe on_the_day in case AI already included some
nudgedClassification.on_the_day = [...new Set(nudgedClassification.on_the_day)];
```

### 2. Updated References to Use Nudged Classification
Changed all references from `classification` to `nudgedClassification` after validation:
- Storage: `window.slotTypeClassification = nudgedClassification`
- Display: `displayClassificationResults(nudgedClassification, fnDuration)`
- Logging: All console.log statements updated

### 3. Added Timing Display (Lines ~1480-1510)
Enhanced `displayClassificationResults()` function signature and UI:

```javascript
function displayClassificationResults(classification, timingMs) {
  // ... existing code ...
  
  // Add heading with status box
  const headerRow = document.createElement('div');
  headerRow.style.display = 'flex';
  headerRow.style.justifyContent = 'space-between';
  headerRow.style.alignItems = 'center';
  headerRow.style.marginBottom = '16px';
  resultsContainer.appendChild(headerRow);
  
  const heading = document.createElement('h4');
  heading.style.fontWeight = '600';
  heading.style.margin = '0';
  heading.textContent = 'Appointment Types Classification';
  headerRow.appendChild(heading);
  
  // Status box showing timing
  if (timingMs !== undefined) {
    const statusBox = document.createElement('div');
    statusBox.style.fontSize = '12px';
    statusBox.style.padding = '4px 12px';
    statusBox.style.backgroundColor = '#10b981';
    statusBox.style.color = 'white';
    statusBox.style.borderRadius = '12px';
    statusBox.style.fontWeight = '500';
    statusBox.textContent = `✓ Classified in ${timingMs}ms`;
    headerRow.appendChild(statusBox);
  }
}
```

### 4. Enhanced Error Display (Lines ~1460-1490)
Added UI error display alongside console logging:

```javascript
} catch (err) {
  // ... console logging ...
  
  // Display error in UI
  const step4 = document.querySelector('.wstep[data-wstep="4"] .card-bd');
  if (step4) {
    let errorContainer = document.getElementById('classification-error');
    if (!errorContainer) {
      errorContainer = document.createElement('div');
      errorContainer.id = 'classification-error';
      errorContainer.style.marginTop = '20px';
      errorContainer.style.padding = '16px';
      errorContainer.style.backgroundColor = '#fef2f2';
      errorContainer.style.borderRadius = '8px';
      errorContainer.style.border = '1px solid #fecaca';
      step4.appendChild(errorContainer);
    }
    
    errorContainer.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <span style="font-size: 20px;">⚠️</span>
        <strong style="color: #dc2626;">Classification Failed</strong>
      </div>
      <div style="font-size: 14px; color: #991b1b;">
        ${err.message || 'Unknown error occurred'}
      </div>
    `;
  }
}
```

## Existing Functionality (Already Working)

### Data Loading (Lines ~1260-1330)
- Loads ALL distinct `slot_type` values from `public.emis_apps_raw`
- Pages through data in 1000-row chunks
- Dedupes by normalizing (trim, collapse whitespace)
- Stores in `window.loadedSlotTypes`

### API Call (Lines ~1390-1410)
- Calls `supabase.functions.invoke('classify-slot-types', { body: { slotTypes } })`
- Measures timing with `Date.now()`
- Returns: `{ success: true, classification: { on_the_day: [], within_1_week: [], within_2_weeks: [] } }`

### UI Rendering (Lines ~1480-1640)
- Three color-coded sections:
  - **On the day** (red, #dc2626)
  - **Within 1 week** (blue, #2563eb)
  - **Within 2 weeks** (green, #059669)
- Each section shows:
  - Count badge
  - Scrollable list (max-height: 300px)
  - Empty state message if no items
- Expandable Raw JSON viewer

## Test Results

Edge Function is deployed and working:
```bash
curl -X POST https://unveoqnlqnobufhublyw.supabase.co/functions/v1/classify-slot-types \
  -H "Content-Type: application/json" \
  -d '{"slotTypes":["Book on Day","Follow-up","Routine","Emergency"]}'

# Returns:
{"success":true,"classification":{"on_the_day":["Book on Day"],"within_1_week":["Follow-up","Routine"],"within_2_weeks":["Emergency"]}}
```

**Note**: Client-side nudge will move "Emergency" from `within_2_weeks` → `on_the_day` automatically.

## Files Modified
1. `/Users/benhoward/Desktop/CheckLoop/checkloops/emis_checker.html` - Main changes
2. `/Users/benhoward/Desktop/CheckLoop/checkloops/README-EMIS-UPDATES.md` - Documentation

## Files Already Deployed
1. `/supabase/functions/classify-slot-types/index.ts` - Edge Function
2. Supabase Secret: `OPENAI_API_KEY` - Already set
3. Function deployed with `--no-verify-jwt` flag

## How to Test
1. Open `emis_checker.html` in browser
2. Navigate to Step 4
3. Wait for slot types to load (auto-triggered)
4. Classification will appear automatically with:
   - Three colored category sections
   - Timing badge (e.g., "✓ Classified in 1234ms")
   - Counts for each category
   - Client-side adjustments logged to console

## Next Steps
- Monitor console for client nudge logs showing slots being moved
- Verify urgent/emergency slots always appear in "On the day" section
- Check timing badge shows reasonable response times
- Test error handling by temporarily breaking the Edge Function
