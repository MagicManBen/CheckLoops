# 🚀 FINAL SETUP CHECKLIST - NHS/CQC Integration

## ✅ Step 1: Run Database Migration

**Copy the entire contents of `COMPLETE_MIGRATION.sql` and run it in Supabase SQL Editor**

This will:
- Add all 80+ required columns
- Create performance indexes
- Set up automatic updated_at triggers
- Grant necessary permissions

**Verify:** After running, you should see:
- `total_columns` > 80
- `critical_columns_present` = 14

## ✅ Step 2: Deploy Edge Function

Run in terminal:
```bash
supabase functions deploy fetch-nhs-data-complete
```

**Note:** If you get authentication errors:
1. Run: `supabase login`
2. Run: `supabase link --project-ref unveoqnlqnobufhublyw`
3. Try deploy again

## ✅ Step 3: Verify Setup

### Option A: Use Web Checker
1. Open `check-supabase-schema.html` in browser
2. Click "Check Database Schema"
3. Click "Check Edge Functions"
4. Should see mostly green ✅ marks

### Option B: Use Node.js Script
```bash
npm install @supabase/supabase-js
node test-supabase-setup.js
```

## ✅ Step 4: Test Integration

1. Open `cqctest-detailed-full-fixed.html`
2. Search for any GP surgery
3. Click on a result
4. Click **"Run CQC → NHS (Sequential)"**
5. Verify both phases complete successfully

## 📊 Expected Results

After running the sequential flow:

**Phase 1 (CQC):**
- ✅ `database_updated: true`
- ✅ `data_sources_fetched: ["cqc"]`
- ✅ `ods_code` extracted from CQC data
- ✅ All flattened fields saved

**Phase 2 (ODS):**
- ✅ `database_updated: true`
- ✅ `data_sources_fetched: ["ods"]`
- ✅ `nhs_ods_data` contains NHS JSON
- ✅ `last_nhs_update` has current timestamp

**Database Row:**
- `location_source` - Full CQC location JSON
- `provider_source` - Full CQC provider JSON
- `nhs_ods_data` - Full NHS ODS JSON
- `ods_code` - Extracted code (e.g., L81010)
- `main_phone_number` - Phone from CQC/NHS
- `website` - Website URL
- All address fields populated
- All timestamps updated

## 🛠️ Troubleshooting

### Issue: Missing columns error
**Fix:** Run `COMPLETE_MIGRATION.sql` again

### Issue: Edge function not found
**Fix:** Deploy with `supabase functions deploy fetch-nhs-data-complete`

### Issue: No ODS code extracted
**Check:** CQC data should have `odsCode` field in location or provider

### Issue: NHS data not saving
**Check:** Ensure `nhs_ods_data` column exists (jsonb type)

## 📝 What Was Fixed

1. **Edge Function Rewrite:**
   - Proper data extraction and flattening
   - Correct database updates
   - Better error handling

2. **Database Schema:**
   - Added all missing columns
   - Proper data types (jsonb for JSON, text for strings)
   - Indexes for performance

3. **Client Integration:**
   - Uses single edge function for both phases
   - Proper ODS code extraction between phases
   - Better status reporting

## 🎯 Quick Test Commands

```bash
# Deploy function
supabase functions deploy fetch-nhs-data-complete

# Check deployment
supabase functions list

# View logs
supabase functions logs fetch-nhs-data-complete

# Test with curl
curl -X POST https://unveoqnlqnobufhublyw.supabase.co/functions/v1/fetch-nhs-data-complete \
  -H "Authorization: Bearer sb_publishable_wpy7lxfbI2HwvsznlWJVKg_Zx7HnAc4" \
  -H "Content-Type: application/json" \
  -d '{"location_id":"1-1000513625","data_sources":["cqc"]}'
```

## ✨ Success Indicators

You'll know everything is working when:
1. Schema checker shows 100% columns present
2. Edge function responds without errors
3. Sequential button completes both phases
4. Database row has all data populated
5. No console errors in browser

---

**Ready to test? Start with Step 1: Run the migration SQL!**