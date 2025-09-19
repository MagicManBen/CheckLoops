# Quick Testing Guide for Fuzzy Match Holiday System

## Step 1: Deploy Database Changes
Run this SQL in Supabase SQL Editor (https://unveoqnlqnobufhublyw.supabase.co):

```sql
-- Copy and paste the entire contents of fuzzy_match_schema.sql
```

## Step 2: Test Admin Upload

1. **Access Admin Page**
   - Go to: http://127.0.0.1:58156/admin-dashboard.html
   - Click "Holiday Import" in the navigation

2. **Download Template**
   - Click "Download Excel Template"
   - Open the downloaded file

3. **Add Test Data**
   In the Excel template, add:
   ```
   Name: John Test User
   Start Date: 01/01/2024
   End Date: 05/01/2024
   Total Hours: 30
   Total Sessions: (leave blank)
   Reason: Christmas Holiday
   ```

4. **Upload File**
   - Save the Excel file
   - Drag it onto the upload zone
   - Review the preview
   - Click "Confirm Upload"

## Step 3: Test User Matching

1. **Create Test User**
   - In Admin Dashboard → Users
   - Invite a new user with name "John Test User"
   - Use a test email address

2. **Log In as Test User**
   - Sign out of admin
   - Sign in with test user credentials

3. **Check Dashboard**
   - You should see a purple notification banner
   - "Holiday Records Found!"
   - Shows count of pending records

4. **Review Matches**
   - Click "Review Now"
   - See the holiday record card
   - Shows dates, hours, reason

5. **Accept Match**
   - Click "Accept & Import"
   - Confirm in modal
   - Record should transfer

6. **Verify Transfer**
   - Go to "My Holidays" page
   - Should see the imported holiday
   - Status should be "approved"

## Step 4: Verify in Database (Optional)

Check these tables in Supabase:
- `fuzzy_match_holidays` - Should show record with status 'transferred'
- `4_holiday_requests` - Should have new approved holiday record

## Expected Results

✅ **Admin can:**
- Download Excel template
- Upload holiday data
- View all fuzzy match records
- See statistics

✅ **Users see:**
- Notification if matches exist
- Clear review interface
- Can accept or reject matches
- Accepted holidays appear in their history

✅ **System handles:**
- Site-specific data isolation
- Automatic name matching
- Secure transfer to holiday requests
- Proper status tracking

## Troubleshooting

**If notification doesn't appear:**
- Check the name matches exactly (case-insensitive)
- Verify same site_id for user and fuzzy match record
- Check browser console for errors

**If upload fails:**
- Ensure Excel file format is .xlsx or .xls
- Check date format is DD/MM/YYYY
- Verify either hours or sessions is provided

**If transfer fails:**
- Check user has kiosk_user_id in profiles table
- Verify fuzzy match record hasn't already been transferred
- Look for error messages in browser console