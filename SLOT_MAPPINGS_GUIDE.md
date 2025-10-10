# Slot Type Mappings Setup Guide

## Overview
This feature allows admin users to map hardcoded appointment categories (like "Book on the day", "Within 1 week") to actual EMIS slot types from their system. The mappings are saved per site and used throughout the application.

## Architecture

### Components
1. **Database Table**: `slot_type_mappings` - Stores the mappings
2. **Edge Function**: `save-slot-mappings` - Handles saving with proper authentication
3. **UI**: Step 4 in `emis_checker.html` wizard - User selection interface

### Security
- ✅ No API keys stored in client-side code
- ✅ Uses Supabase Edge Function with auth token
- ✅ Row Level Security (RLS) policies enforce site-level access
- ✅ Only admin/owner users can save mappings
- ✅ Mappings are scoped to user's site_id

## Installation Steps

### 1. Create the Database Table

Run this SQL in Supabase Dashboard > SQL Editor:

```bash
# Copy the SQL file contents
cat sql/create_slot_type_mappings.sql

# Or run directly in Supabase SQL Editor
```

The SQL creates:
- `slot_type_mappings` table with proper constraints
- RLS policies for site-scoped access
- Indexes for performance
- Triggers for auto-updating timestamps

### 2. Deploy the Edge Function

```bash
# Make sure you're in the project directory
cd /Users/benhoward/Desktop/CheckLoop/checkloops

# Deploy using the script
./deploy-save-mappings.sh

# Or manually:
supabase functions deploy save-slot-mappings
```

### 3. Verify Deployment

Test the Edge Function:
```bash
curl -X POST https://unveoqnlqnobufhublyw.supabase.co/functions/v1/save-slot-mappings \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mappings": [
      {
        "category_key": "on_the_day",
        "category_label": "Book on the day",
        "emis_slot_type": "Urgent appointment"
      }
    ]
  }'
```

## Usage

### For Users

1. **Navigate to Setup**
   - Open `emis_checker.html`
   - Log in as admin/owner
   - Complete Steps 1-3 (upload data)

2. **Configure Mappings (Step 4)**
   - View the list of appointment categories
   - Select matching EMIS slot type from dropdown for each category
   - Check the confirmation checkbox
   - Click "Next" to save

3. **Confirmation (Step 5)**
   - Review saved mappings
   - See success message
   - Mappings are now active for your site

### For Developers

**Reading Mappings:**
```javascript
// Get mappings for current site
const { data: mappings } = await supabase
  .from('slot_type_mappings')
  .select('*')
  .eq('site_id', siteId)
  .eq('is_active', true);
```

**Updating Mappings:**
The Edge Function handles upserts automatically:
```javascript
// Call from client
const { data, error } = await supabase.functions.invoke('save-slot-mappings', {
  body: {
    mappings: [
      { category_key: 'on_the_day', category_label: 'Book on the day', emis_slot_type: 'Urgent' },
      // ... more mappings
    ]
  }
});
```

## Database Schema

```sql
Table: slot_type_mappings
├── id (UUID, PK)
├── site_id (UUID, FK -> master_users.site_id)
├── category_key (TEXT) - e.g., 'on_the_day'
├── category_label (TEXT) - e.g., 'Book on the day'
├── emis_slot_type (TEXT) - e.g., 'Urgent appointment'
├── configured_by_user_id (UUID, FK -> master_users.auth_user_id)
├── configured_by_email (TEXT)
├── created_at (TIMESTAMPTZ)
├── updated_at (TIMESTAMPTZ)
└── is_active (BOOLEAN)

Constraints:
- UNIQUE(site_id, category_key) - One mapping per category per site

Indexes:
- site_id
- category_key
- configured_by_user_id
- is_active
```

## Edge Function API

### Endpoint
```
POST /functions/v1/save-slot-mappings
```

### Authentication
Requires valid Supabase auth token in Authorization header:
```
Authorization: Bearer <user_token>
```

### Request Body
```json
{
  "mappings": [
    {
      "category_key": "on_the_day",
      "category_label": "Book on the day",
      "emis_slot_type": "Urgent appointment"
    },
    {
      "category_key": "within_1_week",
      "category_label": "Within 1 week",
      "emis_slot_type": "Routine appointment"
    }
  ]
}
```

### Response (Success)
```json
{
  "success": true,
  "message": "Successfully saved 2 slot type mappings",
  "saved_count": 2,
  "site_id": "uuid-of-site",
  "mappings": [
    {
      "id": "uuid",
      "site_id": "uuid",
      "category_key": "on_the_day",
      "category_label": "Book on the day",
      "emis_slot_type": "Urgent appointment",
      "configured_by_user_id": "uuid",
      "configured_by_email": "user@example.com",
      "created_at": "2025-10-10T20:00:00Z",
      "updated_at": "2025-10-10T20:00:00Z",
      "is_active": true
    }
  ]
}
```

### Response (Error)
```json
{
  "error": "Error message",
  "details": "Additional details"
}
```

### Error Codes
- `401` - Unauthorized (missing/invalid auth token)
- `403` - Forbidden (user not admin/owner)
- `400` - Bad request (invalid mappings data)
- `404` - User profile not found
- `500` - Internal server error

## Categories

The system supports these standard categories:

| Key | Label | Description |
|-----|-------|-------------|
| `on_the_day` | Book on the day | Same-day/urgent appointments |
| `within_1_week` | Within 1 week | Appointments within 7 days |
| `within_2_weeks` | Within 2 weeks | Appointments 8-14 days ahead |
| `duty` | Duty slot | Duty doctor slots |
| `nhs_111` | 111 slots | NHS 111 slots |
| `break` | Breaks | Staff break slots |
| `admin` | Admin slots | Administrative time slots |

## Debugging

### Check if table exists
```sql
SELECT * FROM slot_type_mappings LIMIT 5;
```

### Check user's site_id
```sql
SELECT auth_user_id, site_id, email, access_type 
FROM master_users 
WHERE email = 'your@email.com';
```

### View all mappings for a site
```sql
SELECT * FROM slot_type_mappings 
WHERE site_id = 'your-site-uuid' 
AND is_active = true
ORDER BY category_key;
```

### Check Edge Function logs
```bash
supabase functions logs save-slot-mappings
```

### Browser Console
Open DevTools and check for:
- `💾 Saving slot type mappings...`
- `📊 Saving N mappings: [...]`
- `✅ Mappings saved successfully: {...}`

## Troubleshooting

### "Failed to save mappings"
- Check user is logged in as admin/owner
- Verify user has a valid site_id in master_users
- Check browser console for detailed error

### "No mappings to save"
- User must check the confirmation checkbox for each mapping
- At least one slot type must be selected (not "— Select —")

### "Session expired"
- User needs to log in again
- Check auth token is valid: `supabase.auth.getSession()`

### RLS Errors
- Verify RLS policies are created (run SQL again)
- Check user's access_type is 'admin' or 'owner'
- Verify site_id matches between user profile and request

## Files

```
checkloops/
├── sql/
│   └── create_slot_type_mappings.sql   # Database schema
├── supabase/
│   └── functions/
│       └── save-slot-mappings/
│           └── index.ts                # Edge Function
├── emis_checker.html                   # UI with save logic
├── deploy-save-mappings.sh             # Deployment script
└── SLOT_MAPPINGS_GUIDE.md             # This file
```

## Future Enhancements

- [ ] Bulk import/export mappings
- [ ] History/audit log of mapping changes
- [ ] Mapping suggestions based on AI classification
- [ ] Multi-site copying of mappings
- [ ] Validation rules for slot types
- [ ] Mapping conflicts detection
