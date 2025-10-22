# 🚀 Quick Start - Clean & Reset Everything

## TL;DR - Clean Everything in 2 Minutes

### Step 1: Clean Database
```
1. Go to Supabase Dashboard
2. Click SQL Editor
3. Copy this and run:

DELETE FROM public.training_records;
ALTER SEQUENCE training_records_id_seq RESTART WITH 1;
```

### Step 2: Clean Storage
```
cd /Users/benhoward/Desktop/CheckLoop/checkloops
node cleanup-certs.mjs
```

**Done!** ✅ All old training records and certificates deleted.

---

## What This Does

✅ **Deletes all:**
- Training records from database
- Certificate files from storage
- Resets ID counter to 1

✅ **Keeps intact:**
- Training types (still available to select)
- User profiles
- Everything else

✅ **Result:**
- Start fresh with blank training table
- Upload new test data cleanly
- No interference from old records

---

## After Cleanup - Test It

### Add Training Without Certificate
1. Open staff-training.html
2. Click "Add Training Certificate"
3. Select training type + date
4. **Skip the file** (don't upload anything)
5. Click Save
6. ✅ Record created with ID = 1
7. ✅ Shows "(no certificate)" in message

### Add Training With Certificate
1. Click "Add Training Certificate"
2. Select training type + date
3. **Select a certificate file**
4. Click Save
5. ✅ Record created with ID = 2
6. ✅ Shows "Certificate uploaded" in message
7. ✅ Click "View" → Opens modal on same page

---

## Files Included

- `CLEANUP_TRAINING_DATA.sql` - SQL to delete records
- `cleanup-certs.mjs` - Node.js script to delete storage files
- `CLEANUP_TESTING_GUIDE.md` - Full guide with troubleshooting

---

## Need Help?

See `CLEANUP_TESTING_GUIDE.md` for:
- Selective cleanup (by user or training type)
- Troubleshooting errors
- Safety tips
- Verification steps

---

**Status:** ✅ Ready  
**Time:** 2 minutes  
**Risk:** None (test environment)
