// admin-dashboard-holiday-fix.js
// Fix for holiday display in admin dashboard
console.log("Admin Dashboard Holiday Fix loaded");

// Wait for the document to be ready and Supabase to be initialized
document.addEventListener('DOMContentLoaded', function() {
  // Make sure Supabase is available
  if (!window.supabase) {
    console.error("Holiday Fix: Supabase not initialized");
    return;
  }

  // Add a new function to reload holiday data directly from master_users
  window.refreshHolidayData = async function() {
    try {
      console.log("Holiday Fix: Refreshing holiday data from master_users");
      
      const container = document.getElementById('entitlements-cards-container');
      if (!container) {
        console.error("Holiday Fix: Could not find entitlements-cards-container");
        return;
      }
      
      // Show loading indicator
      container.innerHTML = `
        <div class="loading-indicator">
          <div class="spinner"></div>
          <p>Refreshing holiday data...</p>
        </div>
      `;
      
      // Get the current site_id from context
      const siteId = window.ctx?.site_id;
      if (!siteId) {
        console.error("Holiday Fix: No site_id in context");
        container.innerHTML = '<div style="padding:20px; text-align:center; color:var(--muted);">Please select a site first</div>';
        return;
      }
      
      // Fetch the latest data from master_users table
      const { data: users, error } = await window.supabase
        .from('master_users')
        .select('*')
        .eq('site_id', siteId);
      
      if (error) {
        console.error("Holiday Fix: Error fetching user data", error);
        container.innerHTML = `<div style="padding:20px; text-align:center; color:var(--danger);">Error loading staff data: ${error.message}</div>`;
        return;
      }
      
      if (!users || users.length === 0) {
        container.innerHTML = '<div style="padding:20px; text-align:center; color:var(--muted);">No staff members found for this site.</div>';
        return;
      }
      
      console.log(`Holiday Fix: Found ${users.length} staff members with holiday data`);
      
      // Create cards for each user - similar to the original code but using direct data from master_users
      const cardsHtml = users.map(user => {
        // Use values directly from master_users to ensure we have the latest data
        const totalEntitlement = user.total_holiday_entitlement || user.holiday_entitlement || 25;
        // Use both fields but prioritize the latest data (should be the same after our SQL fix)
        const holidayTaken = user.holiday_taken || user.approved_holidays_used || 0;
        const holidayRemaining = user.holiday_remaining || (totalEntitlement - holidayTaken);
        
        // Convert hours to proper format for display
        const formatHours = (val) => {
          if (!val || val === 0) return '0:00';
          if (typeof val === 'string' && val.includes(':')) return val;
          if (typeof val !== 'number') return val;
          
          const hours = Math.floor(val);
          const minutes = Math.round((val - hours) * 60);
          return `${hours}:${String(minutes).padStart(2, '0')}`;
        };
        
        // Format the time display based on whether the user is a GP or not
        const isGp = !!user.is_gp;
        const displayTaken = isGp ? holidayTaken : formatHours(holidayTaken);
        const displayRemaining = isGp ? holidayRemaining : formatHours(holidayRemaining);
        const displayTotal = isGp ? totalEntitlement : formatHours(totalEntitlement);
        const unit = isGp ? 'sessions' : 'hrs';
        
        return `
          <div class="staff-card" style="background: var(--glass); border: 1px solid var(--border-color); border-radius: 12px; padding: 20px; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
              <div style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), var(--accent-2)); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 18px;">
                ${user.full_name ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : '??'}
              </div>
              <div style="flex: 1;">
                <h3 style="margin: 0; color: var(--white); font-size: 16px;">${user.full_name || user.email || 'Unknown'}</h3>
                <p style="margin: 4px 0 0; color: var(--muted); font-size: 14px;">${user.email}</p>
              </div>
              ${user.holiday_approved ? '<span style="background: var(--success); color: white; padding: 4px 8px; border-radius: 6px; font-size: 12px;">Approved</span>' : ''}
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; padding: 12px; background: rgba(0,0,0,0.2); border-radius: 8px; margin-bottom: 16px;">
              <div style="text-align: center;">
                <div style="font-size: 20px; font-weight: 700; color: var(--accent);">${displayTotal} ${unit}</div>
                <div style="font-size: 11px; color: var(--muted); margin-top: 2px;">Total Entitlement</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 20px; font-weight: 700; color: var(--danger);">${displayTaken} ${unit}</div>
                <div style="font-size: 11px; color: var(--muted); margin-top: 2px;">Used/Taken</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 20px; font-weight: 700; color: var(--success);">${displayRemaining} ${unit}</div>
                <div style="font-size: 11px; color: var(--muted); margin-top: 2px;">Remaining</div>
              </div>
            </div>

            <div style="display: flex; gap: 12px; margin-bottom: 12px;">
              <div style="flex: 1;">
                <label style="color: var(--muted); font-size: 12px;">Holiday Year</label>
                <div style="margin-top: 4px; font-size: 14px; color: var(--white);">${user.holiday_year || new Date().getFullYear()}</div>
              </div>
              <div style="flex: 1;">
                <label style="color: var(--muted); font-size: 12px;">Site</label>
                <div style="margin-top: 4px; font-size: 14px; color: var(--white);">Site ${user.site_id}</div>
              </div>
            </div>

            <div style="margin-top: 16px; display: flex; gap: 8px;">
              <button class="btn secondary" style="flex: 1; padding: 8px; font-size: 13px;" onclick="editStaffHoliday('${user.auth_user_id || user.id}')">
                Edit Settings
              </button>
              <button class="btn" style="flex: 1; padding: 8px; font-size: 13px;" onclick="viewStaffRequests('${user.auth_user_id || user.id}')">
                View Requests
              </button>
            </div>
          </div>
        `;
      }).join('');
      
      // Update the container with the new cards
      container.innerHTML = cardsHtml;
      console.log(`Holiday Fix: Refreshed ${users.length} staff holiday cards with latest data`);
      
    } catch (error) {
      console.error('Holiday Fix: Error refreshing holiday data:', error);
      const container = document.getElementById('entitlements-cards-container');
      if (container) {
        container.innerHTML = `<div style="padding:20px; text-align:center; color:var(--danger);">Error refreshing holiday data: ${error.message}</div>`;
      }
    }
  };
  
  // Override the original loadStaffEntitlementCards function to call our refreshed version
  const originalLoadStaffEntitlementCards = window.loadStaffEntitlementCards;
  if (typeof originalLoadStaffEntitlementCards === 'function') {
    console.log("Holiday Fix: Overriding loadStaffEntitlementCards function");
    
    window.loadStaffEntitlementCards = async function() {
      // Call our refresh function directly
      await window.refreshHolidayData();
    };
  } else {
    console.error("Holiday Fix: Could not find loadStaffEntitlementCards function");
  }
  
  // Add refresh button to the holidays view
  function addRefreshButton() {
    const holidaysView = document.getElementById('entitlement-management');
    if (!holidaysView) return;
    
    // Check if button already exists
    if (holidaysView.querySelector('#refresh-holiday-data-btn')) return;
    
    // Find the header or create a suitable container
    let header = holidaysView.querySelector('.page-header') || holidaysView.querySelector('.view-header');
    if (!header) {
      // Create a header if it doesn't exist
      header = document.createElement('div');
      header.className = 'page-header';
      holidaysView.insertBefore(header, holidaysView.firstChild);
    }
    
    // Add the refresh button
    const refreshButton = document.createElement('button');
    refreshButton.id = 'refresh-holiday-data-btn';
    refreshButton.className = 'btn';
    refreshButton.textContent = 'Refresh Holiday Data';
    refreshButton.style.marginLeft = 'auto';
    refreshButton.style.padding = '8px 16px';
    refreshButton.style.fontSize = '14px';
    
    refreshButton.addEventListener('click', window.refreshHolidayData);
    
    // Add to header
    header.appendChild(refreshButton);
    
    console.log("Holiday Fix: Added refresh button to holidays view");
  }
  
  // Call addRefreshButton when the holidays view is activated
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        const holidaysView = document.getElementById('entitlement-management');
        if (holidaysView && holidaysView.classList.contains('active')) {
          addRefreshButton();
          
          // Refresh data when the view becomes active
          window.refreshHolidayData();
        }
      }
    });
  });
  
  // Start observing the holidays view
  const holidaysView = document.getElementById('entitlement-management');
  if (holidaysView) {
    observer.observe(holidaysView, { attributes: true });
    
    // Add button if view is already active
    if (holidaysView.classList.contains('active')) {
      addRefreshButton();
      window.refreshHolidayData();
    }
  } else {
    console.error("Holiday Fix: Could not find entitlement-management view");
  }
  
  console.log("Holiday Fix: Initialization complete");
});