# EMIS Dashboard Custom Thresholds Implementation

## Overview
Added a configurable threshold system allowing users to customize color-coding thresholds for OTD and Not BKD metrics on a per-weekday basis, with gradient color transitions.

## What Was Added

### 1. Database Table: `emis_rules`
- **File**: `create_emis_rules_table.sql`
- **Purpose**: Store configurable thresholds and rules for EMIS dashboard
- **Schema**:
  - `site_id`: Links rules to specific sites
  - `rule_type`: Type of rule ('otd_threshold', 'not_bkd_threshold')
  - `rule_config`: JSONB column storing day-specific thresholds and gradient settings
  - `is_active`: Enable/disable rules
  - RLS policies ensure users can only access rules for their site
  - Unique constraint on (site_id, rule_type) prevents duplicates

### 2. Rules & Alerts Page UI
- **Location**: Rules & Alerts page in `emis_reporting.html`
- **Features**:
  - OTD Thresholds section: 5 inputs for Monday-Friday
  - Not BKD Thresholds section: 5 inputs for Monday-Friday
  - Gradient Settings section:
    - Red threshold: Show red when below X% of threshold
    - Green threshold: Show green when above Y% of threshold
    - Yellow automatically shown between red and green
  - Save/Cancel buttons
  - Success message after saving
  - Auto-loads current settings when page opens

### 3. Gradient Color System
- **Old behavior**: Solid red or green based on threshold
- **New behavior**: Three-color gradient
  - **Red**: Value < (threshold × red_percentage)
  - **Yellow**: Value between red and green thresholds
  - **Green**: Value ≥ (threshold × green_percentage)
- **Example**: With threshold 20, red at 80%, green at 100%
  - 0-15: Red
  - 16-19: Yellow
  - 20+: Green

### 4. Dashboard Integration
- **Functions Updated**:
  - `getThreshold(dayOfWeek, metric)`: Gets threshold for specific day/metric
  - `getGradientColor(value, threshold)`: Calculates red/yellow/green based on gradient settings
  - `createDayCard()`: Uses new color calculation
- **Global Variable**: `window.thresholdRules` stores loaded rules for dashboard use
- **Auto-loads**: Rules loaded on page init, available to dashboard immediately

## How to Use

### Step 1: Create the Database Table
1. Go to Supabase SQL Editor
2. Copy the entire contents of `create_emis_rules_table.sql`
3. Paste and run it
4. This creates the table, RLS policies, and default values for site_id='2'

### Step 2: Configure Thresholds
1. Open `emis_reporting.html`
2. Navigate to **Rules & Alerts** page
3. Set your desired thresholds for each weekday:
   - **OTD thresholds**: Minimum "on the day" appointments needed
   - **Not BKD thresholds**: Minimum available appointments needed
4. Configure gradient percentages:
   - **Red below**: e.g., 80% means show red if value < 80% of threshold
   - **Green above**: e.g., 100% means show green if value ≥ 100% of threshold
5. Click **Save Settings**

### Step 3: View Dashboard
1. Navigate to **Dashboard** page
2. Metrics now use your custom thresholds
3. Colors will be:
   - **Red**: Critical (below red threshold)
   - **Yellow**: Warning (between red and green)
   - **Green**: Good (above green threshold)

## Default Values
If no rules are configured, defaults are used:
- **Monday**: 25
- **Tuesday-Friday**: 20
- **Gradient**: Red below 80%, Green above 100%

## Technical Details

### Rule Config JSON Structure
```json
{
  "monday": 25,
  "tuesday": 20,
  "wednesday": 20,
  "thursday": 20,
  "friday": 20,
  "gradient": {
    "red_below": 0.8,      // 80% - show red below this
    "yellow_between": [0.8, 1.0],  // 80-100% - show yellow
    "green_above": 1.0     // 100% - show green above this
  }
}
```

### CSS Classes Added
- `.metric.otd.yellow` - Yellow background for OTD warning state
- `.metric.not-bkd.yellow` - Yellow background for Not BKD warning state

### JavaScript Functions Added
- `loadRules()`: Fetches rules from database
- `populateRulesForm(rules)`: Fills form inputs with rule values
- `saveRules()`: Saves form values to database
- `getThreshold(dayOfWeek, metric)`: Gets threshold for calculation
- `getGradientColor(value, threshold)`: Calculates color based on gradient

## Database Query Examples

### View all rules for a site:
```sql
SELECT * FROM emis_rules WHERE site_id = '2' AND is_active = true;
```

### Update OTD Monday threshold:
```sql
UPDATE emis_rules 
SET rule_config = jsonb_set(rule_config, '{monday}', '30')
WHERE site_id = '2' AND rule_type = 'otd_threshold';
```

### Change gradient thresholds:
```sql
UPDATE emis_rules 
SET rule_config = jsonb_set(
  jsonb_set(rule_config, '{gradient,red_below}', '0.7'),
  '{gradient,green_above}', '1.1'
)
WHERE site_id = '2' AND rule_type = 'otd_threshold';
```

## Future Enhancements
The `emis_rules` table is designed to support additional rule types:
- Email alert rules
- Data validation rules
- Booking pattern analysis rules
- Partner availability rules
- Custom business logic rules

All rules follow the same pattern:
- One row per rule type per site
- JSONB config for flexibility
- RLS ensures data isolation
- Audit trail with created_by/updated_at fields

## Benefits
1. **Customizable**: Each site can have different thresholds
2. **Flexible**: Different thresholds for each weekday
3. **Visual**: Gradient colors provide more nuanced feedback
4. **User-friendly**: No code changes needed to adjust thresholds
5. **Scalable**: Easy to add new rule types in the future
6. **Secure**: RLS ensures data isolation between sites
