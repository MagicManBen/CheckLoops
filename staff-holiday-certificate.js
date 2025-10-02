// Preserve the original loadStaffHolidayTable function and extend it
const originalLoadStaffHolidayTable = window.loadStaffHolidayTable;

// Modified loadStaffHolidayTable function that includes certificate information
window.loadStaffHolidayTable = async function() {
  // If we have our new functions, use them, otherwise fallback to original
  try {
    // Check if the new certificate-enabled function exists
    const { data: funcCheck, error: funcError } = await supabase.rpc('get_holidays_by_staff_with_certificates', { p_year: new Date().getFullYear() });
    
    // If the function exists, use our enhanced implementation
    if (!funcError) {
      return await loadStaffHolidayTableWithCertificates();
    }
  } catch (e) {
    console.warn('Certificate functions not available, using original implementation');
    console.error(e);
  }
  
  // Use the original implementation if our new function isn't available
  if (originalLoadStaffHolidayTable) {
    return await originalLoadStaffHolidayTable();
  }
};

// The new implementation that uses certificate data
async function loadStaffHolidayTableWithCertificates() {
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
}

// Function to view certificate from Supabase storage
window.viewCertificate = async function(certificateUrl) {
  if (!certificateUrl) {
    alert('No certificate available for this staff member.');
    return;
  }
  
  try {
    // Check if there's actually a certificate bucket in Supabase
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error checking storage buckets:', bucketsError);
      alert('Failed to check certificate storage: ' + bucketsError.message);
      return;
    }
    
    // Check if the training_certificates bucket exists
    const trainingBucket = buckets.find(b => b.name === 'training_certificates');
    
    if (!trainingBucket) {
      console.warn('Training certificates bucket not found');
      alert('Certificate system is not fully configured yet. Please contact the administrator.');
      return;
    }
    
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