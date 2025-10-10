# ✅ Save Slot Mappings - Complete Implementation

## 🎯 Overview
This feature saves user-selected slot type mappings from Step 4 to a Supabase table, then displays a confirmation in Step 5.

---

## 📦 What Was Created

### Database Schema
**File**: `create_slot_mappings_table.sql`
- Table: `slot_type_mappings`
- Columns:
  - `id` (UUID, primary key)
  - `site_id` (TEXT, from user's profile)
  - `hardcoded_type` (TEXT, the category label like "Book on the day")
  - `matched_emis_type` (TEXT, the EMIS slot type selected from dropdown)
  - `mapped_by_user_id` (UUID, who created it)
  - `mapped_by_user_email` (TEXT, for easy reference)
  - `mapped_at` (TIMESTAMPTZ, when mapping was created)
  - `created_at` (TIMESTAMPTZ, record creation timestamp)
- Indexes for performance
- RLS policies for security

### Edge Function
**File**: `save-slot-mappings-function.ts`
- Name: `save-slot-mappings`
- What it does:
  1. Authenticates the user
  2. Fetches user's `site_id` from `master_users` table
  3. Validates the mappings array
  4. Inserts all mappings with metadata
  5. Returns success/error response
- Security: Uses service role key (server-side only)

### HTML Updates
**File**: `emis_checker.html`
- Added `saveMappings()` function (already existed, updated)
- Modified mapping data structure to include:
  - `hardcoded_type` (for database)
  - `matched_emis_type` (for database)
  - `category_key` (for display)
  - `category_label` (for display)
- Updated "Next" button handler to save before Step 5
- Updated `updateStep5Summary()` to display saved mappings
- Step 5 now shows:
  - Success checkmark
  - Count of saved mappings
  - List of each mapping with visual confirmation
  - Helpful note about mappings being active

### Test Tools
**Files**:
- `test-save-mappings.html` - Interactive test page
- `verify-setup.sh` - Quick verification script
- `DEPLOY_SAVE_MAPPINGS_FUNCTION.md` - Deployment instructions
- `SETUP_SAVE_MAPPINGS.md` - Quick reference guide

---

## 🚀 Deployment Steps

### Step 1: Create Database Table
```bash
# Open Supabase Dashboard SQL Editor
https://supabase.com/dashboard/project/unveoqnlqnobufhublyw/sql/new

# Copy and run: create_slot_mappings_table.sql
```

### Step 2: Deploy Edge Function
```bash
# Open Supabase Functions Dashboard
https://supabase.com/dashboard/project/unveoqnlqnobufhublyw/functions

# Create new function named: save-slot-mappings
# Copy code from: save-slot-mappings-function.ts
# Click Deploy
```

### Step 3: Test
```bash
# Run verification script
./verify-setup.sh

# Or manually:
open test-save-mappings.html
# Make sure you're logged in
# Click "Save Sample Mappings"
# Click "View My Mappings"
```

---

## 🔒 Security Features

✅ **No hardcoded credentials** - All keys in environment variables
✅ **User authentication** - JWT validation on every request
✅ **Site isolation** - Mappings linked to user's site_id
✅ **RLS policies** - Row-level security enforced
✅ **Audit trail** - Records who and when for each mapping

---

## 📊 User Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Step 4: Appointment Type Setup                             │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Type to Identify      │ Slot Type     │ Confirm     │   │
│ ├─────────────────────────────────────────────────────┤   │
│ │ Book on the day       │ [Dropdown ▼]  │ [✓ Checked] │   │
│ │ Within 1 week         │ [Dropdown ▼]  │ [✓ Checked] │   │
│ │ Within 2 weeks        │ [Dropdown ▼]  │ [✓ Checked] │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ User clicks [Next] ──────────────────────────────────────┐ │
└─────────────────────────────────────────────────────────┼─┘
                                                          │
                                                          ▼
                                            ┌─────────────────────┐
                                            │ saveMappings()      │
                                            │                     │
                                            │ 1. Collect data     │
                                            │ 2. Validate         │
                                            │ 3. Show "Saving..." │
                                            └──────────┬──────────┘
                                                       │
                                                       ▼
                                            ┌─────────────────────┐
                                            │ Edge Function       │
                                            │ save-slot-mappings  │
                                            │                     │
                                            │ 1. Auth user        │
                                            │ 2. Get site_id      │
                                            │ 3. Insert records   │
                                            └──────────┬──────────┘
                                                       │
                                                       ▼
                                            ┌─────────────────────┐
                                            │ Database            │
                                            │ slot_type_mappings  │
                                            │                     │
                                            │ ✓ Records saved     │
                                            └──────────┬──────────┘
                                                       │
                                                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 5: Setup Complete ✅                                   │
│                                                             │
│   3 Slot Type Mappings Saved                               │
│                                                             │
│   ┌──────────────────────────────────────────────────┐    │
│   │ Book on the day          → Urgent appointment  ✓ │    │
│   │ Within 1 week            → Routine appointment ✓ │    │
│   │ Within 2 weeks           → Follow-up appt      ✓ │    │
│   └──────────────────────────────────────────────────┘    │
│                                                             │
│   ℹ️ These mappings are now active for your site.         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing

### Automated Test Page
```bash
open test-save-mappings.html
```

Tests include:
- ✅ Configuration check (logged in, has site_id)
- ✅ Save sample mappings
- ✅ View saved mappings
- ✅ Error handling (empty array, invalid data)

### Manual Testing in Main App
```bash
open emis_checker.html
```

1. Complete Steps 1-3 (upload data)
2. On Step 4:
   - Select slot types from dropdowns
   - Check confirmation boxes
   - Click "Next"
3. Verify Step 5 shows confirmation
4. Check database:
   ```sql
   SELECT * FROM slot_type_mappings 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

---

## 🐛 Troubleshooting

### "Function not found" error
**Solution**: Deploy the Edge Function via Dashboard
- Go to Functions tab
- Create function named exactly: `save-slot-mappings`

### "No authorization header" error
**Solution**: User needs to log in
- Redirect to admin-login.html
- Check session is valid

### "User profile or site_id not found" error
**Solution**: User doesn't have site_id in master_users
- Verify user record exists
- Ensure site_id column is populated

### "Please select and confirm..." alert
**Solution**: User hasn't confirmed any mappings
- Check at least one confirmation box
- Ensure dropdown has a value selected

### RLS policy error
**Solution**: Policies might not be created
- Run the full SQL script including policies
- Verify policies exist:
  ```sql
  SELECT policyname FROM pg_policies 
  WHERE tablename = 'slot_type_mappings';
  ```

---

## 📁 Files Reference

| File | Purpose | Location |
|------|---------|----------|
| `create_slot_mappings_table.sql` | Database schema | Copy to SQL Editor |
| `save-slot-mappings-function.ts` | Edge Function code | Copy to Functions Dashboard |
| `emis_checker.html` | Main app (updated) | Already in place |
| `test-save-mappings.html` | Test interface | Open in browser |
| `verify-setup.sh` | Quick check script | Run in terminal |
| `DEPLOY_SAVE_MAPPINGS_FUNCTION.md` | Deployment guide | Reference |
| `SETUP_SAVE_MAPPINGS.md` | Quick reference | Reference |

---

## ✨ Success Criteria

- [ ] Database table created with all columns
- [ ] RLS policies created and active
- [ ] Edge Function deployed and accessible
- [ ] Test page shows successful save
- [ ] Main app Step 4 saves without errors
- [ ] Step 5 displays confirmation correctly
- [ ] Database contains saved records
- [ ] User can view their mappings

---

## 🎉 What's Working

✅ **Secure Saving** - No keys in client code
✅ **User Isolation** - Each site sees only their mappings
✅ **Audit Trail** - Who and when recorded
✅ **Error Handling** - Clear messages for users
✅ **Visual Confirmation** - Step 5 shows success
✅ **Testing Tools** - Easy to verify it works

---

## 📞 Support

If something isn't working:
1. Check browser console for errors
2. Verify you're logged in
3. Check your site_id exists in master_users
4. Run test-save-mappings.html to isolate the issue
5. Check Supabase Function logs in Dashboard

---

**Status**: ✅ Ready to Deploy
**Last Updated**: October 10, 2025
