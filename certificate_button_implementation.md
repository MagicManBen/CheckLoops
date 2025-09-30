# Certificate Button Implementation for Staff Holiday Table

This document provides instructions on how to add a certificate viewing button to the staff holiday table in the admin dashboard.

## Overview

The implementation adds a "Cert" button for each staff member who has a certificate in the training records. When clicked, this button opens the certificate in a new browser tab.

## Implementation Steps

1. Create the SQL function in your database
2. Add the certificate viewing functionality to the admin dashboard
3. Update the loadStaffHolidayTable function to include certificate data

## Step 1: Create SQL Function

Run the following SQL function in your database to create a function that retrieves staff holiday data along with certificate information:

```sql
-- Create or replace the function to get staff holiday data with certificates
CREATE OR REPLACE FUNCTION public.get_holidays_by_staff_with_certificates(p_year integer)
RETURNS TABLE(
  staff_id uuid, 
  staff_name text, 
  entitlement_id integer, 
  entitlement_hours numeric, 
  booked_hours numeric, 
  pending_hours numeric,
  certificate_url text
) 
LANGUAGE sql
AS $$
  WITH staff_list AS (
    SELECT 
      mu.id,
      mu.full_name,
      e.id as entitlement_id,
      e.calculated_hours as entitlement_hours
    FROM 
      master_users mu
    LEFT JOIN 
      2_staff_entitlements e ON mu.id = e.staff_id AND e.year = p_year
    WHERE 
      mu.is_active = true
  ),
  booked_holidays AS (
    SELECT 
      h.staff_id,
      COALESCE(SUM(h.hours), 0) as booked_hours
    FROM 
      2_staff_holidays h
    WHERE 
      h.status = 'approved' 
      AND h.year = p_year
    GROUP BY 
      h.staff_id
  ),
  pending_holidays AS (
    SELECT 
      h.staff_id,
      COALESCE(SUM(h.hours), 0) as pending_hours
    FROM 
      2_staff_holidays h
    WHERE 
      h.status = 'pending' 
      AND h.year = p_year
    GROUP BY 
      h.staff_id
  ),
  latest_certificates AS (
    SELECT DISTINCT ON (tr.user_id)
      tr.user_id,
      tr.certificate_url
    FROM
      training_records tr
    WHERE
      tr.certificate_url IS NOT NULL
    ORDER BY
      tr.user_id, tr.completion_date DESC
  )
  SELECT 
    s.id as staff_id,
    s.full_name as staff_name,
    s.entitlement_id,
    s.entitlement_hours,
    COALESCE(b.booked_hours, 0) as booked_hours,
    COALESCE(p.pending_hours, 0) as pending_hours,
    lc.certificate_url
  FROM 
    staff_list s
  LEFT JOIN 
    booked_holidays b ON s.id = b.staff_id
  LEFT JOIN 
    pending_holidays p ON s.id = p.staff_id
  LEFT JOIN
    latest_certificates lc ON s.id = lc.user_id
  ORDER BY 
    s.full_name;
$$;
```

This function joins the staff data with training records to retrieve certificate URLs.

## Step 2: Add Certificate Viewing Function

Add the following function to the admin-dashboard.html file:

```javascript
// Function to view certificate from Supabase storage
window.viewCertificate = async function(certificateUrl) {
  if (!certificateUrl) {
    alert('No certificate available for this staff member.');
    return;
  }
  
  try {
    // Create a signed URL that will be valid for 5 minutes
    const { data, error } = await supabase.storage
      .from('training_certificates')
      .createSignedUrl(certificateUrl, 300); // 5 minutes
    
    if (error) {
      console.error('Error creating signed URL:', error);
      alert('Failed to retrieve certificate: ' + error.message);
      return;
    }
    
    if (data && data.signedUrl) {
      // Open the signed URL in a new tab/window
      window.open(data.signedUrl, '_blank');
    } else {
      alert('Unable to retrieve certificate. Please try again.');
    }
  } catch (err) {
    console.error('Error viewing certificate:', err);
    alert('Failed to view certificate: ' + err.message);
  }
};
```

This function creates a signed URL for the certificate and opens it in a new browser tab.

## Step 3: Update loadStaffHolidayTable Function

Modify the `loadStaffHolidayTable` function to:
1. Use the new SQL function to get certificate data
2. Add certificate buttons for staff members who have certificates

Replace the existing `loadStaffHolidayTable` function with the following:

```javascript
window.loadStaffHolidayTable = async function() {
  // Check if table exists
  const tableBody = document.getElementById('staff-holiday-tbody');
  if (!tableBody) return; // Table doesn't exist or isn't loaded yet

  try {
    // Show loading state
    tableBody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;color:#666;">Loading holidays...</td></tr>';

    // Get current year
    const now = new Date();
    const year = now.getFullYear();

    // Get all staff with their holiday records, entitlements for the current year, and latest certificate
    const { data: staffData, error: staffError } = await supabase.rpc('get_holidays_by_staff_with_certificates', { p_year: year });
    
    // Fallback to original function if the new one doesn't exist yet
    if (staffError && staffError.message.includes('function') && staffError.message.includes('does not exist')) {
      console.warn('Using fallback function - certificate feature will be unavailable until database function is created');
      const { data: fallbackData, error: fallbackError } = await supabase.rpc('get_holidays_by_staff', { p_year: year });
      
      if (fallbackError) {
        throw fallbackError;
      }
      
      // Add empty certificate_url to each staff member
      staffData = fallbackData.map(staff => ({...staff, certificate_url: null}));
    }

    if (staffError && !staffData) {
      throw staffError;
    }

    // No staff found
    if (!staffData || !staffData.length) {
      document.getElementById('staff-holiday-tbody').innerHTML = `
        <tr><td colspan="9" style="text-align:center;padding:20px;color:#666;">No staff holidays found.</td></tr>
      `;
      return;
    }

    const tbody = document.getElementById('staff-holiday-tbody');
    tbody.innerHTML = '';

    // Process each staff member
    staffData.forEach(staff => {
      // Extract staff details
      const staffId = staff.staff_id;
      const staffName = staff.staff_name || 'Unknown';
      const entitlementId = staff.entitlement_id;
      const entitlementHours = staff.entitlement_hours || 0;
      const bookedHours = staff.booked_hours || 0;
      const pendingHours = staff.pending_hours || 0;
      const remainingHours = parseFloat((entitlementHours - bookedHours - pendingHours).toFixed(2));

      // Calculate percentages for progress bar
      const totalAllowed = entitlementHours > 0 ? entitlementHours : 1; // Avoid divide by zero
      const bookedPercentage = Math.min(100, Math.round((bookedHours / totalAllowed) * 100));
      const pendingPercentage = Math.min(100 - bookedPercentage, Math.round((pendingHours / totalAllowed) * 100));

      // Determine status colors
      let statusColor = '#22c55e'; // Green for good status
      let statusText = 'Good';

      if (remainingHours < 0) {
        statusColor = '#ef4444'; // Red for over-allocated
        statusText = 'Over-allocated';
      } else if (remainingHours < (entitlementHours * 0.1)) { // Less than 10% remaining
        statusColor = '#f97316'; // Orange for low
        statusText = 'Low';
      } else if (remainingHours < (entitlementHours * 0.25)) { // Less than 25% remaining
        statusColor = '#fbbf24'; // Yellow for warning
        statusText = 'Warning';
      }

      // Add certificate icon if the staff member has a certificate
      let certificateButtonHtml = '';
      if (staff.certificate_url) {
        certificateButtonHtml = `
          <button class="btn btn-sm view-certificate" data-certificate-url="${staff.certificate_url}" onclick="viewCertificate('${staff.certificate_url}')" title="View certificate">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            Cert
          </button>
        `;
      }

      // Create table row
      const tr = document.createElement('tr');
      tr.className = 'holiday-row';
      tr.dataset.staffId = staffId;
      tr.dataset.entitlementId = entitlementId;

      // Populate row cells
      tr.innerHTML = `
        <td>
          ${staffName}
          <div style="font-size:0.8em; color:#666; margin-top:3px;">
            ID: ${staffId}
          </div>
        </td>
        <td style="position: relative;">
          <div class="entitlement-bar-wrapper">
            <div class="entitlement-progress-bar">
              <div class="bar-segment booked" style="width: ${bookedPercentage}%;" title="Booked: ${bookedHours} hours"></div>
              <div class="bar-segment pending" style="width: ${pendingPercentage}%;" title="Pending: ${pendingHours} hours"></div>
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.8em; margin-top: 3px;">
            <span title="Total entitlement">Total: ${entitlementHours} hrs</span>
            <span title="Remaining hours" style="color:${statusColor}; font-weight:600;">${remainingHours} hrs left</span>
          </div>
        </td>
        <td>
          <span class="status-pill" style="background-color: ${statusColor}20; color: ${statusColor}; border: 1px solid ${statusColor}40;">
            ${statusText}
          </span>
        </td>
        <td style="text-align: right">
          <button class="btn btn-sm view-history" data-staff-id="${staffId}" data-staff-name="${staffName}" onclick="showHolidayHistory('${staffId}', '${staffName}')" title="View holiday history">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            History
          </button>
          <button class="btn btn-sm book-holiday" data-staff-id="${staffId}" data-staff-name="${staffName}" data-entitlement-id="${entitlementId}" onclick="bookHoliday('${staffId}', '${staffName}', '${entitlementId}')" title="Book holiday">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 14h-7m-7 0H3"></path>
              <path d="M3 10h.01M21 10h.01M12 10h.01M3 14h.01M12 14h.01M12 6h.01"></path>
              <path d="M21 6h-7m-7 0H3"></path>
              <path d="M21 18h-7m-7 0H3"></path>
              <path d="M3 18h.01M12 18h.01"></path>
            </svg>
            Book
          </button>
          <button class="btn btn-sm adjust-entitlement" data-entitlement-id="${entitlementId}" data-staff-id="${staffId}" data-staff-name="${staffName}" onclick="adjustEntitlement('${entitlementId}', '${staffId}', '${staffName}')" title="Adjust entitlement">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20V10"></path>
              <path d="M18 14l-6-6-6 6"></path>
            </svg>
            Adjust
          </button>
          ${certificateButtonHtml}
        </td>
      `;

      // Append row to table body
      tbody.appendChild(tr);
    });

  } catch (error) {
    console.error('Error loading staff holidays:', error);
    document.getElementById('staff-holiday-tbody').innerHTML = `
      <tr><td colspan="9" style="text-align:center;padding:20px;color:#666;">Error loading holidays: ${error.message}</td></tr>
    `;
  }
};
```

## Implementing the Changes

There are two ways to implement these changes:

### Option 1: Full Replacement
Replace the entire `loadStaffHolidayTable` function in admin-dashboard.html with the new version.

### Option 2: Incremental Changes
1. Add the `viewCertificate` function at an appropriate place in admin-dashboard.html
2. Add the certificate button HTML generation to the existing `loadStaffHolidayTable` function
3. Modify the query to call the new SQL function

## CSS Styles

The certificate button uses existing CSS classes and should match the styling of other buttons in the row.

## Testing

1. Create the SQL function in your database
2. Implement the JavaScript changes
3. Load the admin dashboard
4. Verify that staff members with certificates have a "Cert" button
5. Click the button to ensure it opens the certificate in a new tab