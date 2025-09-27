# Debug Panel Guide for Staff Holiday Save Issues

## What's New

I've added comprehensive debugging features to help diagnose why saves are failing:

### 1. Debug Button (🐛) on Each Row
- Click the bug icon next to any Save button to see detailed info about that row
- Shows current values of all form fields
- Displays Supabase connection status

### 2. Test Connection Button
- Located at the top with other bulk actions
- Tests:
  - Supabase client initialization
  - Authentication session
  - Database read permissions
  - Database write permissions
- Provides detailed error messages if any step fails

### 3. Enhanced Save Debug Panel
- Automatically opens when a save fails
- Shows EVERY detail of the save operation:
  - Initial values from UI
  - Calculated entitlements
  - Data sent to Supabase
  - Exact error messages and codes
  - RLS (Row Level Security) violations
  - Authentication issues

### 4. Copy Button
- Click "📋 Copy All Debug Info" to copy the entire debug log
- Send this to developers for troubleshooting

## How to Use

1. **When a save fails:**
   - The debug panel will automatically open
   - Review the error details
   - Copy the debug info and share it

2. **To test the connection:**
   - Click "🔌 Test Connection" button
   - Review the test results in the debug panel
   - Look for any failed steps

3. **To debug a specific row:**
   - Click the 🐛 button next to that row's Save button
   - Check if all values are correct

## Common Issues & Solutions

### "Failed to save changes"
- **RLS Error (code 42501)**: User doesn't have permission to update this record
  - Solution: Check Row Level Security policies in Supabase

- **Auth Error (PGRST301)**: Session expired or invalid
  - Solution: Refresh the page and log in again

- **No Session**: Not logged in
  - Solution: Refresh and log in

- **Network Error**: Can't reach Supabase
  - Solution: Check internet connection

## Debug Info Structure

The debug panel shows:
```json
{
  "timestamp": "2025-09-27T...",
  "supabaseExists": true/false,
  "lastOperation": {
    "rowId": "123",
    "authUserId": "uuid...",
    "steps": [
      // Every step of the operation
    ]
  },
  "sessionInfo": {
    "hasSession": true/false,
    "user": "email@example.com"
  }
}
```

## Need Help?

1. Click "Test Connection" first
2. Try saving a row
3. Copy the debug info when it fails
4. Share the debug info for assistance

The debug panel captures EVERY tiny detail to help identify exactly what's going wrong!