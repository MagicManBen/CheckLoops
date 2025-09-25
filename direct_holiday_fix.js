// Direct fix for holiday display issue
console.log("Direct Holiday Fix v1.0 loaded");

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function toNumber(value) {
  const num = parseFloat(value);
  return Number.isFinite(num) ? num : 0;
}

function aggregateHolidayUsage(requests) {
  const usageMap = {};

  (requests || []).forEach((holiday) => {
    const userKey = holiday?.user_id || holiday?.auth_user_id;
    if (!userKey) return;

    if (!usageMap[userKey]) {
      usageMap[userKey] = { hours: 0, sessions: 0, totalDays: 0, count: 0 };
    }

    const entry = usageMap[userKey];
    entry.count += 1;

    const totalDays = toNumber(holiday?.total_days);
    const totalHours = toNumber(holiday?.total_hours);
    const totalSessions = toNumber(holiday?.total_sessions);
    const hoursPerDay = toNumber(holiday?.hours_per_day);
    const sessionsPerDay = toNumber(holiday?.sessions_per_day);

    if (totalDays > 0) {
      entry.totalDays += totalDays;
    }

    if (totalHours > 0) {
      entry.hours += totalHours;
    }

    if (totalSessions > 0) {
      entry.sessions += totalSessions;
    }

    const hasManualHours = totalHours > 0;
    const hasManualSessions = totalSessions > 0;
    const hasTotalDays = totalDays > 0;

    if ((hoursPerDay > 0) && !hasManualHours && !hasTotalDays) {
      const start = holiday?.start_date ? new Date(holiday.start_date) : null;
      const end = holiday?.end_date ? new Date(holiday.end_date) : null;
      const dayCount = start && end ? Math.max(1, Math.round((end - start) / MS_PER_DAY) + 1) : 1;
      entry.hours += hoursPerDay * dayCount;
    }

    if ((sessionsPerDay > 0) && !hasManualSessions && !hasTotalDays) {
      const start = holiday?.start_date ? new Date(holiday.start_date) : null;
      const end = holiday?.end_date ? new Date(holiday.end_date) : null;
      const dayCount = start && end ? Math.max(1, Math.round((end - start) / MS_PER_DAY) + 1) : 1;
      entry.sessions += sessionsPerDay * dayCount;
    }
  });

  return usageMap;
}

// Wait for the document to be ready
document.addEventListener('DOMContentLoaded', function() {
  // Get reference to the original function
  const originalFunc = window.loadStaffEntitlementCards;
  
  if (typeof originalFunc !== 'function') {
    console.error("Cannot apply direct holiday fix: loadStaffEntitlementCards function not found");
    return;
  }
  
  // Replace with our enhanced version that adds a direct SQL join
  window.loadStaffEntitlementCards = async function() {
    console.log("Direct holiday fix: Enhanced loadStaffEntitlementCards called");
    
    // Define the container element
    const container = document.getElementById('entitlements-cards-container');
    if (!container) {
      console.error('entitlements-cards-container not found');
      return;
    }
    
    // Show loading indicator
    container.innerHTML = `
      <div class="loading-indicator">
        <div class="spinner"></div>
        <p>Loading staff data with holiday calculations...</p>
      </div>
    `;
    
    try {
      // 1. Load users from master_users
      const { data: profiles, error: profileError } = await window.supabase
        .from('master_users')
        .select('*')
        .order('full_name');
      
      if (profileError) {
        console.error('Error loading user profiles:', profileError);
        container.innerHTML = `<div class="error-message">Error loading staff profiles: ${profileError.message}</div>`;
        return;
      }
      
      if (!profiles || profiles.length === 0) {
        console.log('No profiles found');
        container.innerHTML = '<div class="empty-state">No staff profiles found.</div>';
        return;
      }
      
      // 2. Calculate holiday usage from 4_holiday_requests table
      const { data: holidayRequests, error: holidayError } = await window.supabase
        .from('4_holiday_requests')
        .select('user_id, auth_user_id, start_date, end_date, status, total_days, total_hours, total_sessions, hours_per_day, sessions_per_day')
        .eq('status', 'approved');
        
      if (holidayError) {
        console.error('Error loading holiday requests:', holidayError);
        // Continue with profiles, but log the error
      }
      
      // 3. Calculate usage per user
      const holidayUsage = aggregateHolidayUsage(holidayRequests);
      
      if (holidayRequests && holidayRequests.length > 0) {
        console.log(`Processing ${holidayRequests.length} holiday requests`);
        console.log('Holiday usage calculated:', holidayUsage);
      } else {
        console.log('No approved holiday requests found');
      }
      
      // 4. Build the staff cards with the correct holiday usage
      const roles = new Set();
      const teams = new Set();
      
      profiles.forEach(profile => {
        const role = profile.access_type || profile.role_detail || 'Staff';
        roles.add(role);
        if (profile.team_name) teams.add(profile.team_name);
      });
      
      // Create the filter elements
      const filterContainer = document.getElementById('entitlements-filter-container');
      if (filterContainer) {
        filterContainer.innerHTML = `
          <div class="filter-controls">
            <div class="filter-group">
              <label for="role-filter">Filter by Role:</label>
              <select id="role-filter" class="filter-select">
                <option value="all">All Roles</option>
                ${Array.from(roles).map(role => `<option value="${role}">${role}</option>`).join('')}
              </select>
            </div>
            <div class="filter-group">
              <label for="team-filter">Filter by Team:</label>
              <select id="team-filter" class="filter-select">
                <option value="all">All Teams</option>
                ${Array.from(teams).map(team => `<option value="${team}">${team}</option>`).join('')}
              </select>
            </div>
            <div class="filter-group">
              <input type="text" id="staff-search" placeholder="Search by name..." class="filter-input">
            </div>
          </div>
        `;
      }
      
      // Build the cards HTML
      const cardsHTML = `
        <div class="staff-cards-grid" id="staff-cards-grid">
          ${profiles.map(profile => {
            // Setup data for card generation
            const isApproved = profile.holiday_approved || false;
            const isGP = !!profile.is_gp;
            const usage = holidayUsage[profile.auth_user_id] || holidayUsage[profile.id] || { hours: 0, sessions: 0, totalDays: 0 };
            const bookedHours = usage.hours > 0 ? usage.hours : usage.totalDays;
            const bookedSessions = usage.sessions > 0 ? usage.sessions : usage.totalDays;
            const bookedRaw = isGP ? bookedSessions : bookedHours;
            const unit = isGP ? 'sessions' : 'hrs';
            
            // Get weekly totals
            let weeklyTotal = 0;
            if (isGP) {
              weeklyTotal = parseFloat(profile.weekly_sessions || profile.total_sessions || 0);
            } else {
              weeklyTotal = parseFloat(profile.weekly_hours || profile.total_hours || 0);
            }
            
            // If no weekly total, calculate from daily values
            if (weeklyTotal === 0) {
              const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
              days.forEach(day => {
                const fieldName = isGP ? `${day}_sessions` : `${day}_hours`;
                weeklyTotal += parseFloat(profile[fieldName] || 0);
              });
            }
            
            // Get entitlement values
            const multiplier = profile.holiday_multiplier || 6;
            const calculated = isGP ? profile.calculated_sessions : profile.calculated_hours;
            const override = profile.manual_override ? (isGP ? profile.override_sessions : profile.override_hours) : null;
            const final = override !== null ? override : (calculated || 0);
            
            // Use calculated holiday usage
            const booked = bookedRaw || 0;
            const remaining = final - booked;
            
            // Format hours as HH:MM for display
            const formatHours = (val) => {
              if (!val || val === '0:00') return '0:00';
              if (typeof val === 'string' && val.includes(':')) return val;
              const hours = Math.floor(val);
              const minutes = Math.round((val - hours) * 60);
              return `${hours}:${String(minutes).padStart(2, '0')}`;
            };
            
            // Get display role
            const displayRole = profile.access_type || profile.role_detail || 'Staff';
            
            return `
              <div class="staff-card" 
                   data-staff-id="${profile.id}" 
                   data-user-id="${profile.auth_user_id}" 
                   data-is-gp="${isGP}"
                   data-role="${displayRole}"
                   data-team="${profile.team_name || ''}"
                   data-name="${profile.full_name || ''}">
                <div class="staff-card-header">
                  <h3 class="staff-name">${profile.full_name || 'Unknown'}</h3>
                  <span class="staff-type ${isGP ? 'gp' : displayRole.toLowerCase()}">${isGP ? 'GP' : displayRole}</span>
                </div>
                <div class="staff-details">
                  <div class="staff-role">${displayRole}</div>
                  <div class="staff-team">${profile.team_name || 'No team'}</div>
                </div>
                <div class="entitlement-details">
                  <div class="entitlement-row">
                    <span class="entitlement-label">Weekly:</span>
                    <span class="entitlement-value">${isGP ? weeklyTotal : formatHours(weeklyTotal)} ${unit}</span>
                  </div>
                  <div class="entitlement-row">
                    <span class="entitlement-label">Multiplier:</span>
                    <span class="entitlement-value">×${multiplier}</span>
                  </div>
                  <div class="entitlement-row">
                    <span class="entitlement-label">Entitlement:</span>
                    <span class="entitlement-value final">${isGP ? final : formatHours(final)} ${unit}</span>
                  </div>
                  <div class="entitlement-row">
                    <span class="entitlement-label">Booked:</span>
                    <span class="entitlement-value">${isGP ? booked : formatHours(booked)} ${unit}</span>
                  </div>
                  <div class="entitlement-row">
                    <span class="entitlement-label">Remaining:</span>
                    <span class="entitlement-value remaining">${isGP ? remaining : formatHours(remaining)} ${unit}</span>
                  </div>
                </div>
                <div class="staff-card-footer">
                  <button class="edit-staff-btn" onclick="showStaffDetailModal('${profile.id}', '${profile.auth_user_id}', ${isGP})">
                    Edit Details
                  </button>
                  ${isApproved ? `
                    <span style="color: var(--success); margin-left: 8px; font-size: 13px;">✓ Holidays Approved</span>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
      
      // Set the HTML and setup filters
      container.innerHTML = cardsHTML;
      setupFilterListeners();
      
    } catch (error) {
      console.error('Error in direct holiday fix:', error);
      container.innerHTML = `<div class="error-message">Error loading data: ${error.message}</div>`;
    }
  };
  
  console.log("Direct holiday fix applied: Replaced loadStaffEntitlementCards with enhanced version");
});

// Copy of the setupFilterListeners function from the original script
function setupFilterListeners() {
  const roleFilter = document.getElementById('role-filter');
  const teamFilter = document.getElementById('team-filter');
  const staffSearch = document.getElementById('staff-search');

  const filterCards = () => {
    const role = roleFilter?.value || 'all';
    const team = teamFilter?.value || 'all';
    const search = staffSearch?.value?.toLowerCase() || '';

    const cards = document.querySelectorAll('.staff-card');
    cards.forEach(card => {
      const cardRole = card.getAttribute('data-role');
      const cardTeam = card.getAttribute('data-team');
      const cardName = card.getAttribute('data-name')?.toLowerCase();

      const roleMatch = role === 'all' || cardRole === role;
      const teamMatch = team === 'all' || cardTeam === team;
      const nameMatch = !search || cardName?.includes(search);

      if (roleMatch && teamMatch && nameMatch) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  };

  roleFilter?.addEventListener('change', filterCards);
  teamFilter?.addEventListener('change', filterCards);
  staffSearch?.addEventListener('input', filterCards);
}

// Trigger a refresh when page is loaded
setTimeout(() => {
  if (typeof loadStaffEntitlementCards === 'function' && 
      document.querySelector('#entitlement-management.view.active')) {
    console.log('Direct holiday fix: Refreshing holiday cards');
    loadStaffEntitlementCards().then(() => {
      // Verify fix for Ben Howard specifically
      verifyBenHowardHolidays();
    });
  }
}, 1000);

// Function to verify Ben Howard's holidays are properly displayed
async function verifyBenHowardHolidays() {
  try {
    console.log('Verifying Ben Howard holiday fix...');
    
    // First, get Ben Howard's user_id from master_users
    const { data: benData, error: benError } = await window.supabase
      .from('master_users')
      .select('auth_user_id, is_gp, full_name')
      .ilike('full_name', '%ben howard%')
      .limit(1);
      
    if (benError || !benData || benData.length === 0) {
      console.error('Could not find Ben Howard in master_users:', benError);
      return;
    }
    
  const benUserId = benData[0].auth_user_id;
  const benIsGp = !!benData[0].is_gp;
  console.log(`Found Ben Howard with user_id: ${benUserId}, isGP: ${benIsGp}`);
    
    // Get Ben's holiday requests
    const { data: benHolidays, error: holidayError } = await window.supabase
      .from('4_holiday_requests')
      .select('user_id, auth_user_id, status, total_days, total_hours, total_sessions, hours_per_day, sessions_per_day, start_date, end_date')
      .eq('user_id', benUserId)
      .eq('status', 'approved');
      
    if (holidayError) {
      console.error('Error fetching Ben Howard holiday requests:', holidayError);
      return;
    }
    
    const usageMap = aggregateHolidayUsage(benHolidays);
    const usageEntry = usageMap[benUserId] || { hours: 0, sessions: 0, totalDays: 0 };
    const totalHours = usageEntry.hours > 0 ? usageEntry.hours : usageEntry.totalDays;
    const totalSessions = usageEntry.sessions > 0 ? usageEntry.sessions : usageEntry.totalDays;
    
    console.log(`Ben Howard has ${benHolidays.length} approved holiday requests`);
    console.log('Aggregated usage entry:', usageEntry);
    console.log(`Total calculated holiday hours: ${totalHours}, sessions: ${totalSessions}`);
    
    // Now check if the card shows the correct value
    const benCard = document.querySelector(`.staff-card[data-user-id="${benUserId}"]`);
    if (benCard) {
  const isGP = benCard.getAttribute('data-is-gp') === 'true' || benIsGp;
  const expectedValue = isGP ? totalSessions : totalHours;
      const bookedElement = benCard.querySelector('.entitlement-row:nth-child(4) .entitlement-value');
      
      if (bookedElement) {
        const displayedValue = bookedElement.textContent;
        console.log(`Ben Howard's card shows booked value: ${displayedValue}`);
        
        // Extract just the numeric part for comparison
        const numericDisplayed = parseFloat(displayedValue.split(' ')[0]);
        
        if (Math.abs(numericDisplayed - expectedValue) < 0.01) {
          console.log('SUCCESS: Ben Howard holiday fix verified! Card shows correct booked value.');
        } else {
          console.error(`VERIFICATION FAILED: Card shows ${numericDisplayed}, should be ${expectedValue}`);
        }
      } else {
        console.error('Could not find booked value element in Ben Howard card');
      }
    } else {
      console.error(`Could not find Ben Howard card with user_id ${benUserId}`);
    }
  } catch (error) {
    console.error('Error verifying Ben Howard holidays:', error);
  }
}