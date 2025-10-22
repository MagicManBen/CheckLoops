# 🧹 Cleanup - Everything You Need

## ⚡ FASTEST WAY (Copy-Paste Ready)

### 1️⃣ Delete Database Records

**In Supabase Dashboard:**
```
SQL Editor → New Query → Paste below → Execute
```

**SQL to paste:**
```sql
DELETE FROM public.training_records;
ALTER SEQUENCE training_records_id_seq RESTART WITH 1;
```

**File with comments:** `CLEANUP_SQL_COPY_PASTE.sql`

---

### 2️⃣ Delete Storage Files

**In Terminal:**
```bash
cd /Users/benhoward/Desktop/CheckLoop/checkloops
node cleanup-certs.mjs
```

---

## ✅ Status After Cleanup

```
✅ Training Records: 0
✅ Certificate Files: 0
✅ ID Counter: Reset to 1
✅ Ready for: Fresh test data
```

---

## 📚 All Documentation Files

### Quick Guides
- **CLEANUP_QUICK_START.md** ← Start here (2 min)
- **CLEANUP_SQL_COPY_PASTE.sql** ← Copy-paste ready SQL

### Complete Docs
- **CLEANUP_TESTING_GUIDE.md** ← Full guide with all options
- **CLEANUP_SUMMARY.md** ← Summary with examples

### Scripts
- **cleanup-certs.mjs** ← Run this for storage cleanup
- **CLEANUP_TRAINING_DATA.sql** ← Detailed SQL with comments

---

## 📋 Current Situation

**Before Cleanup:**
```
37 training records in database
1 certificate file in storage
Multiple NULL certificate_url entries
Ready to be cleared for fresh start
```

**After Cleanup:**
```
0 records
0 files
ID counter = 1
Fresh slate ✨
```

---

## 🎯 Testing After Cleanup

After cleanup, test all features:

```
✅ Add training WITHOUT certificate
   - Training saved
   - Message shows "(no certificate)"
   - No upload needed

✅ Add training WITH certificate
   - Select file first
   - Training saved
   - Message shows "Certificate uploaded"
   - Click View → Modal opens

✅ View certificate modal
   - Opens on same page
   - Shows PDF or image
   - Download button works
   - ESC key closes it
```

---

## 🚨 Important

⚠️ This deletes ALL training records and certificates  
⚠️ Use only in test/development environment  
✅ Safe - no other data affected  
✅ Reversible - you can restore from backup if needed  

---

## 📞 Need Help?

| Question | Answer |
|----------|--------|
| What gets deleted? | Training records + certificate files |
| What stays? | Training types, user profiles, everything else |
| Can I undo? | Only if you have a backup |
| How long? | 2 minutes total |
| Is it safe? | Yes, test environment only |

---

## 🚀 Let's Go!

1. **Copy SQL** from `CLEANUP_SQL_COPY_PASTE.sql`
2. **Paste in Supabase** SQL Editor
3. **Execute** the query
4. **Run script** in terminal: `node cleanup-certs.mjs`
5. **Verify** deletion is complete
6. **Start fresh** with test data! 🎉

---

**Last Updated:** October 21, 2025  
**Status:** ✅ All scripts tested and ready
