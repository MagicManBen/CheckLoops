# 🧹 Cleanup & Reset Training Data - Complete Guide

## Overview

Clean up all training records and certificates to start fresh for testing.

---

## Method 1: Complete Cleanup (Recommended)

### Step 1: Delete Database Records (SQL)

**In Supabase Dashboard:**
1. Go to **SQL Editor**
2. Create new query
3. Copy and paste from `CLEANUP_TRAINING_DATA.sql`
4. Click **Execute**

**SQL to run:**
```sql
DELETE FROM public.training_records;
ALTER SEQUENCE training_records_id_seq RESTART WITH 1;
```

**Expected result:**
```
✅ All rows deleted
✅ ID counter reset to 1
```

---

### Step 2: Delete Storage Files (Node.js)

**Run the cleanup script:**
```bash
cd /Users/benhoward/Desktop/CheckLoop/checkloops
node cleanup-certs.mjs
```

**Script will:**
```
✅ List all files in training_certificates bucket
✅ Delete all certificate files by site folder
✅ Verify deletion was successful
✅ Show summary of deleted files
```

**Expected output:**
```
🧹 Starting certificate cleanup...

📋 Listing files in training_certificates bucket...
✅ Found 16 items in bucket

🗑️  Deleting 15 certificate files...

📂 Deleting from folder "2" (15 files)...
   ✅ Successfully deleted 15 files

📊 Deletion Summary:
   ✅ Deleted: 15 files
   ✅ Remaining files in bucket: 0

✨ Cleanup complete!
```

---

## Method 2: Selective Cleanup (By User or Training Type)

### Delete for Specific User Only

```sql
DELETE FROM public.training_records
WHERE user_id = 'USER_UUID_HERE';
```

Replace `'USER_UUID_HERE'` with the actual user ID.

### Delete for Specific Training Type Only

```sql
DELETE FROM public.training_records
WHERE training_type_id = 66;
```

Replace `66` with the training type ID.

### Delete by Date Range

```sql
DELETE FROM public.training_records
WHERE created_at >= '2025-10-21'
  AND created_at < '2025-10-22';
```

---

## Method 3: Manual Deletion via Dashboard

### Delete Database Records
1. Go to Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run cleanup SQL
4. Verify with: `SELECT COUNT(*) FROM training_records;`

### Delete Storage Files
1. Go to **Storage** section
2. Click **training_certificates** bucket
3. Select all files (or filter by site folder)
4. Click **Delete**
5. Confirm deletion

---

## Verify Cleanup

### Check Database
```sql
SELECT COUNT(*) as record_count FROM public.training_records;
```
Should return: `0`

### Check Storage
```bash
node cleanup-certs.mjs
```
Should show: `Remaining files in bucket: 0`

### Test Upload
1. Open staff-training.html
2. Add a new training record with certificate
3. Verify it appears as the first record (ID = 1)

---

## What Gets Deleted

### ✅ Database
- All rows from `training_records` table
- ID counter resets to 1
- Optional: `pending_training_records` (see advanced)

### ✅ Storage
- All files in `training_certificates` bucket
- Site folders (e.g., `2/training_certificates/...`)
- All certificate files (PDF, JPG, PNG, etc.)

### ⚠️ NOT Deleted
- Training types (remain intact)
- User profiles
- Achievement records
- Other unrelated data

---

## Advanced: Partial Cleanup

### Keep Specific Users' Records
```sql
DELETE FROM public.training_records
WHERE user_id != 'KEEP_USER_UUID';
```

### Keep Recent Records Only
```sql
DELETE FROM public.training_records
WHERE created_at < NOW() - INTERVAL '1 day';
```

### Keep Specific Training Types
```sql
DELETE FROM public.training_records
WHERE training_type_id NOT IN (66, 70, 90);
```

---

## Troubleshooting

### Issue: "Cannot delete files - Permission denied"
**Solution:**
- Ensure using service key (sb_secret_...)
- Check RLS policies on storage bucket
- Try deleting manually via dashboard

### Issue: "SQL execution failed"
**Solution:**
- Check for foreign key constraints
- Ensure table name is correct: `public.training_records`
- Try deleting in smaller batches

### Issue: "Files still showing after deletion"
**Solution:**
- Refresh the storage page (F5)
- Clear browser cache
- Run cleanup script again
- Check storage.objects table directly

### Issue: "Node script won't run"
**Solution:**
```bash
# Install dependencies first
npm install @supabase/supabase-js

# Then run script
node cleanup-certs.mjs
```

---

## Safety Tips

✅ **Before Cleanup**
- [ ] Back up important data (if not test environment)
- [ ] Note any important training records
- [ ] Inform team if shared database
- [ ] Test in development first

✅ **During Cleanup**
- [ ] Don't interrupt process
- [ ] Keep terminal open until completion
- [ ] Watch for error messages

✅ **After Cleanup**
- [ ] Verify deletion with queries
- [ ] Test new upload workflow
- [ ] Check storage bucket is empty
- [ ] Confirm IDs reset to 1

---

## Testing After Cleanup

### Test 1: Add Training Without Certificate
```
1. Click "Add Training Certificate"
2. Select type + date (no file)
3. Click Save
4. Verify: Record ID = 1, no certificate
```

### Test 2: Add Training With Certificate
```
1. Click "Add Training Certificate"
2. Select type + date + file
3. Click Save
4. Verify: Record ID = 2, certificate shows
5. Click View → Modal opens
```

### Test 3: Re-upload Certificate
```
1. Find record without cert
2. Click "Re-upload"
3. Select file
4. Verify certificate now shows
```

---

## Files Provided

| File | Purpose |
|------|---------|
| `CLEANUP_TRAINING_DATA.sql` | SQL script for database cleanup |
| `cleanup-certs.mjs` | Node.js script for storage cleanup |
| `CLEANUP_TESTING_GUIDE.md` | This guide |

---

## Quick Commands

### Full Cleanup (2-step)
```bash
# Step 1: Delete database records via Supabase SQL Editor
# (Copy-paste from CLEANUP_TRAINING_DATA.sql and execute)

# Step 2: Delete storage files
node cleanup-certs.mjs
```

### Verify Empty
```bash
# Check if storage is clean
node cleanup-certs.mjs

# Should show: "Remaining files in bucket: 0"
```

### Quick Reset
```bash
# Everything in one command (assuming both steps run)
node cleanup-certs.mjs
```

---

## What's Next?

After cleanup:
1. ✅ Start fresh test with new data
2. ✅ Upload certificates from scratch
3. ✅ Test all features (optional cert, modal viewer, etc.)
4. ✅ Verify everything works as expected
5. ✅ Deploy to production when ready

---

## Help & Support

If cleanup doesn't work:
1. Check Supabase dashboard logs
2. Verify service key is correct
3. Ensure proper permissions on bucket
4. Try manual deletion via dashboard
5. Check for constraints or triggers

---

**Last Updated:** October 21, 2025  
**Status:** ✅ Ready for Testing
