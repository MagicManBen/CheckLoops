# 📖 Quick Reference - Certificate Updates

## What Changed?

### ✅ Option 1: Add Training WITHOUT Certificate
- Fill in training type and date
- **Don't select a file**
- Click "Save"
- Record saves with `certificate_url = NULL`
- Shows "(no certificate)" in table
- Can re-upload later with "Re-upload" button

### ✅ Option 2: Add Training WITH Certificate
- Fill in training type and date
- **Select a file** (PDF, JPG, PNG)
- Click "Save"
- File uploads to Supabase Storage
- Record saves with certificate_url = file path
- Shows "View" button in table
- Clicking "View" opens modal (same page)

### 🎨 Viewing Certificate
- **Before**: Opened in new tab/window
- **Now**: Opens in professional modal overlay on same page
- Modal shows PDF embedded or image scaled to fit
- Click "Download" to save file locally
- Press ESC or click outside to close
- All without leaving the page!

---

## Key Differences

| Aspect | Before | After |
|--------|--------|-------|
| **Certificate Required** | ❌ Yes (enforced) | ✅ No (optional) |
| **File Upload** | Required | Optional |
| **View Certificate** | 🔗 New tab | 🎨 Modal (same page) |
| **Can Add Training** | Only with file | With or without file |
| **User Feedback** | Generic | Specific (cert/no cert) |

---

## How to Add Training

### Option 1: Just the Facts (No Certificate)
```
1. Click "Add Training Certificate"
2. Select training type
3. Select completion date
4. Click "Save" (skip file upload)
5. Done! Record saved
```

### Option 2: With Certificate
```
1. Click "Add Training Certificate"
2. Select training type
3. Select completion date
4. Select certificate file
5. Click "Save"
6. Done! Record saved with certificate
```

---

## How to View Certificate

```
1. Find training record in table
2. Click "View" button (Certificate column)
3. Modal opens with certificate
4. For PDF: Scroll, zoom, print (browser controls)
5. For Images: View full size
6. Click "Download" to save locally
7. Press ESC or click outside to close
```

---

## Modal Controls

| Action | Result |
|--------|--------|
| Click X button | Closes modal |
| Press ESC | Closes modal |
| Click dark background | Closes modal |
| Click inside modal | Stays open (normal interaction) |
| Download button | Downloads file |
| Scroll (PDFs) | Navigates through pages |

---

## File Support

✅ **Accepted Formats:**
- PDF (.pdf)
- JPEG (.jpg, .jpeg)
- PNG (.png)

❌ **Size Limit:** 10 MB max

**Note:** Other formats may work but are not tested

---

## Success Messages

### With Certificate
```
"Training record saved successfully! Certificate uploaded."
```

### Without Certificate
```
"Training record saved! (no certificate)"
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Certificate not showing after upload | Hard refresh (Cmd+Shift+R or Ctrl+Shift+R) |
| Modal won't open | Check browser console (F12 → Console) for errors |
| Download not working | Try different browser or check file size |
| PDF won't display | Ensure file is valid PDF (try another PDF) |
| Image too small | PDF/image scaling works with browser zoom (Cmd+Plus) |

---

## Browser Support

Works on all modern browsers:
- ✅ Chrome/Edge
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

---

## File Structure Reference

When file uploads, it's stored at:
```
{siteId}/training_certificates/{userId}_{typeId}_{timestamp}.{ext}

Example:
2/training_certificates/61b3f0ba-1ffc-4bfc_70_1761081347888.pdf
```

---

## For Developers

### Updated Function
`downloadCertificate(certPath)` - Now shows modal instead of opening tab

### Modal Features
- Dynamic modal creation
- Signed URL generation
- PDF/Image detection
- Responsive design
- Keyboard support (ESC)
- Click-outside dismiss

### Files Modified
- `staff-training.html` (Lines 468-651 for modal, Line 1107 for optional cert)

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| ESC | Close certificate modal |
| Tab | Navigate modal buttons |
| Enter | Activate Download button |
| Cmd/Ctrl + Plus | Zoom modal content |
| Cmd/Ctrl + Minus | Zoom out modal |

---

## Tips & Tricks

💡 **Tip 1:** You can add multiple certificates for the same training type - the most recent one with an expiry date is used

💡 **Tip 2:** If you accidentally add without a certificate, just click "Re-upload" to add it later

💡 **Tip 3:** Use "Download" button in modal to save certificate locally for your records

💡 **Tip 4:** PDF browser zoom works inside modal - press Cmd/Ctrl+Plus to enlarge

💡 **Tip 5:** Mobile users can tap outside modal or use back button to close

---

**Version:** 2.0  
**Last Updated:** October 21, 2025  
**Status:** ✅ Live
