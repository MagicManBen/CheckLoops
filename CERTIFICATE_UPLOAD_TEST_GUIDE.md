# 🧪 Certificate Upload Fix - Testing Guide

## Quick Start
This guide will help you test that the certificate upload fix is working correctly.

## Test Scenario

### Test 1: Attempting Save Without File (Should Fail)
**What to do:**
1. Open staff-training.html
2. Click "Add Training Certificate"
3. Select a training type (e.g., "Information Governance")
4. Select a completion date
5. **DO NOT select any file**
6. Click "Save"

**Expected Result:**
- ❌ Error message appears: "Please select a certificate file before saving."
- ❌ Page does NOT reload
- ❌ No record is created

**If this happens:** ✅ Fix is working!

---

### Test 2: Uploading with File (Should Succeed)
**What to do:**
1. Open staff-training.html
2. Click "Add Training Certificate"
3. Select a training type
4. Select a completion date
5. **SELECT A FILE** (PDF, JPG, or PNG)
6. You should see the filename displayed
7. Click "Save"

**Expected Result:**
- ✅ Success message: "Training record saved successfully! Certificate uploaded."
- ✅ Modal closes
- ✅ Page reloads automatically after 1-2 seconds
- ✅ Table shows new record with "Valid" status
- ✅ Certificate column shows "View" button (not "No certificate")
- ✅ Browser console shows: `[TRAINING] ✅ Record saved successfully`

**If all happen:** ✅ Fix is working perfectly!

---

### Test 3: View Uploaded Certificate
**What to do:**
1. After Test 2 completes, find your newly uploaded training record
2. Click the "View" button in the Certificate column
3. The certificate should open in a new window/tab

**Expected Result:**
- ✅ New tab opens
- ✅ Certificate image/PDF displays
- ✅ URL shows it's a Supabase signed URL

**If this happens:** ✅ Complete workflow is working!

---

## Browser Console Debugging

### Enable Console Logging
1. Press F12 to open Developer Tools
2. Click the "Console" tab
3. Look for messages like:

```
[TRAINING] Saving record with: {…}
[TRAINING] ✅ Record saved successfully
[TRAINING] Refreshing page data...
[TRAINING] Reloading training records from database
```

### If You Don't See These Messages
- Check that staff-training.html is loaded from the correct path
- Verify the script has the latest version (no browser cache)
- Try a hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

---

## Database Verification

### Check Saved Records
Run this in your Supabase dashboard or SQL editor:

```sql
SELECT 
  id,
  training_type_id,
  completion_date,
  expiry_date,
  certificate_url,
  created_at
FROM training_records
WHERE user_id = current_user_id
ORDER BY created_at DESC
LIMIT 5;
```

**Look for:**
- ✅ `certificate_url` is NOT NULL
- ✅ Path format: `2/training_certificates/filename.ext`
- ✅ Recent created_at timestamp

### Check Storage Bucket
In Supabase dashboard:
1. Go to Storage → training_certificates
2. Look for your certificate file
3. Format: `2/training_certificates/[userID]_[typeID]_[timestamp].[ext]`

---

## Troubleshooting

### Issue: Still seeing "No certificate" after upload
**Solutions:**
1. Hard refresh the page: Cmd+Shift+R or Ctrl+Shift+R
2. Clear browser cache
3. Check database directly to verify certificate_url is saved
4. Check console for any error messages

### Issue: Upload button doesn't do anything
**Solutions:**
1. Check browser console for errors (F12 → Console)
2. Verify file was actually selected
3. Check file size (must be < 10MB)
4. Try a different file format

### Issue: Page doesn't reload after save
**Solutions:**
1. Manual refresh: F5 or Cmd+R
2. Check console for any JavaScript errors
3. Verify `window.location.reload()` is not blocked

---

## Success Criteria Checklist

After uploading a certificate, verify:

- [ ] File was selected before saving
- [ ] Error message did NOT appear (if no file was selected)
- [ ] Success message appears after save
- [ ] Page reloads automatically
- [ ] New row appears in the training table
- [ ] Status shows "Valid" with expiry countdown
- [ ] Certificate column shows "View" button
- [ ] Clicking "View" opens certificate in new tab
- [ ] Browser console shows `[TRAINING]` log messages
- [ ] Database query shows `certificate_url` is NOT NULL

---

## Still Having Issues?

Check the following:
1. Supabase project is online and accessible
2. Storage bucket "training_certificates" exists
3. RLS policies allow file uploads
4. User has permission to write to training_records table
5. Browser has JavaScript enabled
6. File is valid (not corrupted)

For detailed logs, check:
- `/Users/benhoward/Desktop/CheckLoop/checkloops/CERTIFICATE_URL_FIX.md` for root cause analysis
- Browser console (F12 → Console tab) for runtime errors
- Supabase logs for database/storage issues
