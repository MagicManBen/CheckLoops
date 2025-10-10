# Quick Setup Guide: Save Slot Mappings Feature

## 🎯 What This Does
When users complete Step 4 (appointment type setup) and click "Next", their slot type mappings are saved to the database. Step 5 then shows a confirmation summary.

## 📋 Setup Checklist

### 1. Create the Database Table ✅
Run this SQL in Supabase Dashboard → SQL Editor:

```bash
# Navigate to: https://supabase.com/dashboard/project/unveoqnlqnobufhublyw/sql/new
# Then copy-paste the contents of: create_slot_mappings_table.sql
```

Or run directly:
```sql
-- See: create_slot_mappings_table.sql
CREATE TABLE public.slot_type_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id TEXT NOT NULL,
  hardcoded_type TEXT NOT NULL,
  matched_emis_type TEXT NOT NULL,
  mapped_by_user_id UUID NOT NULL,
  mapped_by_user_email TEXT,
  mapped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Plus indexes and RLS policies...
```

### 2. Deploy the Edge Function ✅
Since CLI isn't working, use Supabase Dashboard:

1. Go to: https://supabase.com/dashboard/project/unveoqnlqnobufhublyw/functions
2. Click "Create a new function"
3. Name: `save-slot-mappings`
4. Copy code from: `save-slot-mappings-function.ts`
5. Click "Deploy"

### 3. Test Everything ✅

**Option 1: Use the test page**
```bash
open test-save-mappings.html
```
- Make sure you're logged in first
- Click "Save Sample Mappings"
- Click "View My Mappings" to verify

**Option 2: Use the main app**
```bash
open emis_checker.html
```
- Navigate through the wizard to Step 4
- Select and confirm some mappings
- Click "Next"
- Should show Step 5 with confirmation

## 🔍 Verification

Check if the table was created:
```sql
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'slot_type_mappings'
ORDER BY ordinal_position;
```

Check if RLS policies exist:
```sql
SELECT policyname, tablename, cmd
FROM pg_policies
WHERE tablename = 'slot_type_mappings';
```

View saved mappings:
```sql
SELECT 
  id,
  site_id,
  hardcoded_type,
  matched_emis_type,
  mapped_by_user_email,
  created_at
FROM slot_type_mappings
ORDER BY created_at DESC
LIMIT 10;
```

## 📊 Data Flow

```
Step 4: User Setup
   ↓
   User selects mappings and checks confirmation boxes
   ↓
   Clicks "Next"
   ↓
HTML: saveMappings() function
   ↓
   Collects all confirmed mappings from form
   ↓
   Calls: supabase.functions.invoke('save-slot-mappings')
   ↓
Edge Function: save-slot-mappings
   ↓
   1. Authenticates user
   2. Gets user's site_id from master_users
   3. Validates mappings array
   4. Inserts records into slot_type_mappings table
   ↓
   Returns: { success: true, count: X, data: [...] }
   ↓
HTML: Stores result in window.savedMappingsResult
   ↓
   Calls: updateStep5Summary()
   ↓
Step 5: Confirmation
   ↓
   Shows summary of saved mappings with checkmarks
```

## 🛡️ Security Features

✅ **No Hardcoded Keys**: Edge Function uses environment variables
✅ **User Authentication**: Validates JWT token from header
✅ **Site Isolation**: Each mapping linked to user's site_id
✅ **RLS Policies**: Users can only view/insert for their own site
✅ **Audit Trail**: Records who created mapping and when

## 🐛 Troubleshooting

### Function not found error
- Check function is deployed in Dashboard
- Verify function name is exactly: `save-slot-mappings`

### Permission denied
- Verify RLS policies are created
- Check user has site_id in master_users table

### Empty mappings error
- Make sure user checked at least one confirmation box
- Verify select dropdown has a value selected

### Session expired
- User needs to log in again
- Check auth token is being passed correctly

## 📝 Manual Testing Commands

Test with curl (get token from browser devtools):
```bash
# Get your auth token from browser localStorage
# Key: sb-unveoqnlqnobufhublyw-auth-token

curl -X POST \
  https://unveoqnlqnobufhublyw.supabase.co/functions/v1/save-slot-mappings \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "mappings": [
      {
        "hardcoded_type": "Book on the day",
        "matched_emis_type": "Urgent appointment"
      }
    ]
  }'
```

## 📁 Files Modified/Created

- ✅ `create_slot_mappings_table.sql` - Database schema
- ✅ `save-slot-mappings-function.ts` - Edge Function code
- ✅ `emis_checker.html` - Updated with save functionality
- ✅ `test-save-mappings.html` - Testing interface
- ✅ `DEPLOY_SAVE_MAPPINGS_FUNCTION.md` - Deployment guide
- ✅ This file - Quick reference

## ✨ What's Next?

After successful deployment:
1. Test with the test page first
2. Then test in the main app
3. Verify data is being saved correctly
4. Check Step 5 confirmation looks good

All done! 🎉
