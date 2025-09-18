# Holiday Approval System Setup Guide

## Overview
I've implemented a holiday approval system that prevents staff members from viewing their holiday entitlements until an admin has approved them. This ensures administrators can review and adjust holiday allowances before staff can access them.

## What's Been Implemented

### 1. Staff Side (my-holidays.html)
- Added a blur overlay that covers the holiday page when holidays are not approved
- Shows a clear message explaining holidays are awaiting admin approval
- Once approved, the overlay is removed and staff can view/manage their holidays normally

### 2. Admin Side (admin-dashboard.html & entitlement-card-layout.js)
- Added "Approve Holidays" button on each staff member's entitlement card
- Shows "✓ Holidays Approved" for staff who have already been approved
- Clicking approve shows a confirmation dialog and updates the database

### 3. Database Setup Required
The system requires adding a `holiday_approved` column to the `kiosk_users` table.

## Setup Instructions

### Step 1: Add the Database Column
You need to add the `holiday_approved` column to your Supabase database:

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Run this SQL command:
```sql
ALTER TABLE kiosk_users
ADD COLUMN holiday_approved BOOLEAN DEFAULT FALSE;
```

### Step 2: Verify Setup
1. Open `setup_holiday_approval.html` in your browser
2. Click "Check Database Status" to verify the column was added
3. Click "Load All Users" to see the approval status of all staff

### Step 3: Using the System

#### For Administrators:
1. Go to Admin Dashboard
2. Navigate to "Entitlement Management"
3. For each staff member card, you'll see either:
   - "Approve Holidays" button (if not yet approved)
   - "✓ Holidays Approved" (if already approved)
4. Click "Approve Holidays" to allow that staff member to view their holidays

#### For Staff Members:
- Before approval: They'll see a blurred holiday page with a message saying "Awaiting Approval"
- After approval: They can view and manage their holidays normally

## Files Modified
1. `my-holidays.html` - Added blur overlay and approval check
2. `entitlement-card-layout.js` - Added approve button and approval functionality
3. `setup_holiday_approval.html` - Created setup/management page (optional tool)

## Testing
You can test the system using:
- `test_holiday_approval.js` - Automated Playwright test
- `setup_holiday_approval.html` - Manual setup and testing page

## Important Notes
- The approval is stored per user in the `kiosk_users` table
- Once approved, staff can immediately see their holidays
- Admins can still modify holiday entitlements after approval
- The system uses the service role key for database updates to ensure proper permissions

## Troubleshooting
If the approve button doesn't work:
1. Check that the `holiday_approved` column exists in the database
2. Verify the service role key is correct
3. Check browser console for any error messages
4. Use `setup_holiday_approval.html` to manually approve users if needed