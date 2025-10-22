# Training System Documentation

## Overview
The staff training system manages training certificates, tracks completion and expiry dates, and displays training status for staff members. It includes AI-powered certificate extraction and manual upload options.

---

## Database Structure

### Table: `training_records`

**Primary Table for Training Data**

| Column | Type | Description |
|--------|------|-------------|
| `id` | int | Primary key, auto-increment |
| `user_id` | uuid | References `auth.users.id` - Staff member |
| `site_id` | int | References `public.sites.id` |
| `training_type_id` | int | References `training_types.id` |
| `completion_date` | date | Date training was completed |
| `expiry_date` | date | Date training expires |
| `certificate_url` | text | Path to certificate file in Supabase storage |
| `notes` | text | Additional notes (e.g., "Provider: e-Learning for Healthcare") |
| `created_at` | timestamp | Record creation timestamp |
| `updated_at` | timestamp | Last update timestamp |
| `staff_id` | int | (Deprecated - use user_id) |

**Example Record:**
```json
{
  "id": 54,
  "user_id": "61b3f0ba-1ffc-4bfc-82f6-30148aa62b76",
  "site_id": 2,
  "training_type_id": 69,
  "completion_date": "2025-04-03",
  "expiry_date": "2028-04-03",
  "certificate_url": "2/training_certificates/cert_1759051740348_oq677bfbv.png",
  "notes": "Provider: e-Learning for Healthcare",
  "created_at": "2025-09-28T09:29:17.692301+00:00",
  "updated_at": "2025-09-28T09:29:17.692301+00:00"
}
```

---

### Table: `training_types`

**Defines Available Training Types**

| Column | Type | Description |
|--------|------|-------------|
| `id` | int | Primary key |
| `site_id` | int | Site this training type belongs to |
| `name` | text | Training name (e.g., "Fire Safety", "BLS") |
| `description` | text | Detailed description |
| `validity_months` | int | How many months until expiry |
| `is_clinical_required` | boolean | Required for clinical staff |
| `is_non_clinical_required` | boolean | Required for non-clinical staff |
| `active` | boolean | Whether this training is currently active |
| `created_at` | timestamp | Record creation timestamp |

---

### Storage Bucket: `training-certificates`

**Certificate File Storage**

- **Path Pattern**: `{site_id}/training_certificates/cert_{timestamp}_{random}.{extension}`
- **Allowed Types**: PDF, PNG, JPG, JPEG
- **Max Size**: 10MB
- **Access**: Authenticated users only (RLS policies)

**Example Paths:**
- `2/training_certificates/cert_1759051740348_oq677bfbv.png`
- `2/training_certificates/cert_1759043721087_vplvxwfdo.png`

---

## Current Implementation in `staff-training.html`

### Fetching Training Records

**Location**: Lines 542-548

```javascript
const tr = await supabase
  .from('training_records')
  .select('id,training_type_id,completion_date,expiry_date,certificate_url')
  .eq('site_id', siteId)
  .eq('user_id', user.id);

if (!tr.error && tr.data) myRecords = tr.data;
```

**Query Details:**
- Filters by `site_id` to get site-specific records
- Filters by `user_id` to get current user's records
- Selects essential fields for display

---

### Fetching Training Types

**Location**: Lines 524-533

```javascript
const tt = await supabase
  .from('training_types')
  .select('id,name,validity_months,is_clinical_required,is_non_clinical_required,active')
  .eq('site_id', siteId)
  .eq('active', true);

const allTypes = (!tt.error && tt.data) ? tt.data : [];
required = allTypes.filter(t => 
  isClinicalRole(roleDetail) 
    ? t.is_clinical_required 
    : t.is_non_clinical_required
);
```

**Logic:**
1. Fetch all active training types for the site
2. Filter based on user's role (clinical vs non-clinical)
3. Determine which trainings are required for the user

---

### Building Table Display

**Location**: Lines 571-643

The system matches training records with training types to build the table:

```javascript
const rows = required.map(t => {
  const record = myRecords.find(r => r.training_type_id === t.id);
  
  // Calculate status (ok/warn/danger)
  let status = 'danger';
  if (record && record.expiry_date) {
    const exp = new Date(record.expiry_date);
    const daysLeft = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
    if (daysLeft > 90) status = 'ok';
    else if (daysLeft > 0) status = 'warn';
  }
  
  // Generate status badge HTML
  const statusHtml = record 
    ? `<span class="badge ${status}">...</span>`
    : `<span class="badge info">Not Started</span>`;
  
  // Certificate view button
  const certificateBtn = record && record.certificate_url
    ? `<button class="btn-view-certificate" 
         onclick="window.open('${record.certificate_url}', '_blank');">
         View
       </button>`
    : `<span>No certificate</span>`;
  
  // Action button (Upload/Re-upload)
  const actionBtn = record
    ? `<button class="btn-upload-for-training">Re-upload</button>`
    : `<button class="btn-upload-for-training">Upload</button>`;
  
  return `<tr>
    <td>${t.name}</td>
    <td>${statusHtml}</td>
    <td>${certificateBtn}</td>
    <td>${expiryCountdown}</td>
    <td>${actionBtn}</td>
  </tr>`;
});
```

---

### Inserting New Training Records

**Location**: Lines 942-952

```javascript
const recordData = {
  user_id: currentUser.id,
  site_id: currentUser.siteId,
  training_type_id: trainingTypeId,
  completion_date: completionDate,
  expiry_date: expiryDate,
  certificate_url: publicURL,
  notes: document.getElementById('training-notes')?.value || null
};

const { error } = await supabase
  .from('training_records')
  .insert(recordData);
```

---

## Upload Methods

### 1. AI Batch Upload
- Drop multiple certificates
- AI extracts: Name, Training Type, Completion Date, Expiry Date
- Review and confirm all extractions
- Saves to `training_records` table

### 2. Manual Upload
- Select one certificate file
- Manually choose training type
- Manually enter completion and expiry dates
- Add optional notes
- Saves to `training_records` table

### 3. Per-Row Upload
- Click "Upload" or "Re-upload" button on specific training row
- Opens modal with training type pre-selected
- User uploads certificate
- Manually enter dates
- Saves/updates record for that specific training type

---

## Certificate URL Structure

### Full Certificate URL Resolution

When `certificate_url` is stored as a relative path (e.g., `2/training_certificates/cert_xxx.png`), it must be resolved to a full Supabase Storage URL for viewing:

```javascript
const fullURL = `${supabaseUrl}/storage/v1/object/public/training-certificates/${record.certificate_url}`;
```

**Example:**
- **Stored Path**: `2/training_certificates/cert_1759051740348_oq677bfbv.png`
- **Full URL**: `https://unveoqnlqnobufhublyw.supabase.co/storage/v1/object/public/training-certificates/2/training_certificates/cert_1759051740348_oq677bfbv.png`

**Current Implementation**: The view buttons in the table use `window.open(certificate_url)`, which may need to be updated to use full URLs if the stored paths are relative.

---

## Status Calculation Logic

Training records are classified into 4 statuses:

| Status | Condition | Badge Color | Description |
|--------|-----------|-------------|-------------|
| **ok** | > 90 days until expiry | Green | Training is current |
| **warn** | 1-90 days until expiry | Yellow | Expiring soon |
| **danger** | Expired (≤ 0 days) | Red | Training expired |
| **info** | No record exists | Blue | Not yet completed |

**Expiry Countdown Display:**
```javascript
if (daysLeft > 0) {
  expiryCountdown = `<span class="expiry-countdown ${statusClass}">
    ${daysLeft} days
  </span>`;
} else if (daysLeft === 0) {
  expiryCountdown = `<span class="expiry-countdown expired">
    Expires today
  </span>`;
} else {
  expiryCountdown = `<span class="expiry-countdown expired">
    Expired ${Math.abs(daysLeft)} days ago
  </span>`;
}
```

---

## Row-Level Security (RLS)

Training records have RLS policies to ensure:
- Users can only view their own training records (filtered by `user_id`)
- Admin users can view all records for their site (filtered by `site_id`)
- Records are site-isolated (no cross-site data access)

---

## AI Certificate Processing

The AI extraction system (`certificate-uploader-pdf-to-image.js`) processes certificates through:

1. **PDF → Image Conversion**: Converts PDF certificates to PNG images
2. **OCR/AI Extraction**: Sends to AI API to extract:
   - Person name
   - Training type/title
   - Completion date
   - Expiry date
3. **Name Matching**: Matches extracted name to staff database
4. **Confirmation Modal**: Shows 4-card layout for review:
   - Certificate Information
   - Training Details
   - Validity Period
   - Additional Information
5. **Save to Database**: Inserts record into `training_records` table

---

## Key Functions

### `isClinicalRole(role)`
Determines if a role is clinical (e.g., GP, Nurse) vs non-clinical (e.g., Admin, Receptionist)

### `updateTrainingProgressBar(required, myRecords)`
Calculates completion percentage and updates progress bar

### `attachRowClickHandlers()`
Attaches click handlers to:
- Table rows (opens training modal)
- Upload buttons (opens modal with pre-selected training)
- View certificate buttons (opens certificate in new tab)

### `openTrainingModal(preselectedType)`
Opens the training upload modal with optional pre-selected training type

---

## Supabase Credentials

**URL**: `https://unveoqnlqnobufhublyw.supabase.co`

**ANON Key**: 
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME
```

**Service Role Key**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc
```

---

## Database Queries (For Direct SQL Access)

### Get all training records for a user
```sql
SELECT 
  tr.id,
  tr.completion_date,
  tr.expiry_date,
  tr.certificate_url,
  tr.notes,
  tt.name as training_name,
  tt.validity_months
FROM training_records tr
LEFT JOIN training_types tt ON tr.training_type_id = tt.id
WHERE tr.user_id = 'USER_UUID_HERE'
  AND tr.site_id = 2
ORDER BY tr.expiry_date ASC;
```

### Get expired trainings for a site
```sql
SELECT 
  u.full_name,
  tt.name as training_name,
  tr.expiry_date,
  tr.certificate_url
FROM training_records tr
LEFT JOIN training_types tt ON tr.training_type_id = tt.id
LEFT JOIN master_users u ON tr.user_id = u.auth_user_id
WHERE tr.site_id = 2
  AND tr.expiry_date < CURRENT_DATE
ORDER BY tr.expiry_date DESC;
```

### Get training completion stats by type
```sql
SELECT 
  tt.name,
  COUNT(tr.id) as total_completions,
  COUNT(CASE WHEN tr.expiry_date >= CURRENT_DATE THEN 1 END) as current,
  COUNT(CASE WHEN tr.expiry_date < CURRENT_DATE THEN 1 END) as expired
FROM training_types tt
LEFT JOIN training_records tr ON tt.id = tr.training_type_id AND tr.site_id = 2
WHERE tt.site_id = 2 AND tt.active = true
GROUP BY tt.id, tt.name
ORDER BY tt.name;
```

---

## Future Enhancements

### Potential Improvements
1. **Bulk Expiry Notifications**: Email reminders for expiring trainings
2. **Reporting Dashboard**: Site-wide training compliance metrics
3. **Certificate Templates**: Standardized certificate generation
4. **Training History**: View all past versions of certificates
5. **Audit Log**: Track who uploaded/approved certificates
6. **Manager Approval**: Require manager approval for certain trainings
7. **Integration**: Link to external learning management systems

---

## Troubleshooting

### Issue: Certificate URL not loading
**Solution**: Ensure the stored path is converted to full Supabase Storage URL:
```javascript
const fullURL = `${supabaseUrl}/storage/v1/object/public/training-certificates/${certificate_url}`;
```

### Issue: Training not showing in table
**Check:**
1. Is the training type marked as `active = true`?
2. Is it marked as required for the user's role (clinical/non-clinical)?
3. Does the record have matching `site_id`?
4. Is the `user_id` correctly set as UUID?

### Issue: AI extraction failing
**Check:**
1. Certificate file is under 10MB
2. File is PDF, PNG, or JPG format
3. Certificate has clear, readable text
4. AI API endpoint is responding (check console logs)

---

## Related Files

- `staff-training.html` - Main training page UI and logic
- `certificate-uploader-pdf-to-image.js` - AI certificate processing
- `certificate-uploader.css` - Styling for upload components
- `training-modal.js` - Manual upload modal functionality
- `staff-common.js` - Shared utilities (topbar, session management)

---

**Last Updated**: October 21, 2025
**Version**: 2.0 (After workflow reorganization)
