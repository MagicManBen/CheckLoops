# Certificate URL Missing - Root Cause & Fix

## Problem Summary
Users uploading certificates through the manual upload form in `staff-training.html` were getting:
- ✅ Training record created with completion date and expiry date
- ✅ Status shows "Valid" with correct expiry countdown
- ❌ Certificate button shows "No certificate" instead of "View"
- ❌ Database shows `certificate_url = NULL`

## Root Cause
The `saveTrainingRecord()` function in `staff-training.html` had a logic flaw:

```javascript
// BEFORE (BUGGY):
let certificateUrl = null;

if (window.uploadedFile) {
  // Upload file...
  certificateUrl = filePath;
}

// If window.uploadedFile is null, certificateUrl stays null
// Record is saved with certificate_url = NULL even though dates are saved
const recordData = {
  certificate_url: certificateUrl  // NULL if no file
};
```

This allowed records to be created **without a file**, which could happen if:
1. User filled in the form but forgot to select a file before clicking "Save"
2. The file selection was cleared/lost
3. The form was submitted multiple times

## Fix Applied

### 1. **Require File Upload (Lines 941-945)**
Added validation to prevent saving without a file:

```javascript
// Certificate file is REQUIRED for manual upload
if (!window.uploadedFile) {
  errorDiv.textContent = 'Please select a certificate file before saving.';
  errorDiv.style.display = 'block';
  return;  // Stop execution - won't save
}
```

### 2. **Added Logging (Lines 966-968)**
Added console logging to track what's being saved:

```javascript
console.log('[TRAINING] Saving record with:', recordData);
// ... after save succeeds:
console.log('[TRAINING] ✅ Record saved successfully');
```

### 3. **Page Refresh After Save (Lines 1008-1011)**
Ensure the page reloads to show the updated certificate:

```javascript
setTimeout(() => {
  console.log('[TRAINING] Reloading training records from database');
  window.location.reload();
}, 1000);  // Wait 1 second for database to finish writing
```

### 4. **Better Success Message (Line 1016)**
Show user if certificate was uploaded:

```javascript
showToast(`Training record saved successfully!${certificateUrl ? ' Certificate uploaded.' : ''}`, 'success', 3000);
```

## How to Fix Existing Records

If you have training records with NULL certificate_url but need certificates, you have two options:

### Option A: Delete and Re-upload (Recommended)
1. Go to staff-training.html
2. Find the training record that shows "No certificate"
3. Click the "Re-upload" button (action column)
4. **Make sure to select a file** before clicking "Save"
5. The page will refresh and show the certificate

### Option B: Direct Database Fix (Admin Only)
If you need to match a file to an existing record:

```sql
UPDATE training_records
SET certificate_url = '2/training_certificates/[filename]'
WHERE id = [record_id]
AND certificate_url IS NULL;
```

## Files Modified
- **staff-training.html**: Lines 941-945 (validation), 966-968 (logging), 1008-1011 (refresh), 1016 (message)

## Testing

### Before Uploading
✅ Check that file input shows selected file name
✅ Verify "Save" button is ready to click

### After Uploading
✅ Watch browser console for `[TRAINING]` log messages
✅ Page should reload automatically after 1 second
✅ Certificate button should show "View" instead of "No certificate"
✅ Clicking "View" should open the certificate in a new window

## Debugging
If the issue persists:

1. **Check browser console** (F12 → Console tab)
   - Look for `[TRAINING]` log messages
   - Check for any error messages in red

2. **Verify file upload**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Upload a certificate
   - Look for successful storage upload request

3. **Check database directly**
   - Query: `SELECT * FROM training_records WHERE id = [record_id];`
   - Verify `certificate_url` is NOT NULL
   - Verify path looks like: `2/training_certificates/filename.ext`

## Related Files
- `certificate-uploader-pdf-to-image.js` - AI certificate upload (uses different flow)
- `supabase.storage` - Stores actual certificate files
- `training_records` table - Stores metadata and paths

## Prevention
The new validation ensures:
- Users cannot submit forms without a file
- Error message guides users to select a file
- Console logging helps diagnose issues
- Page refresh ensures data is fresh
