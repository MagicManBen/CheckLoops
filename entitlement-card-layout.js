// Staff Entitlement Card UI Implementation

// Load and display staff cards with entitlement data
async function loadStaffEntitlementCards() {
  console.log('=== Loading Staff Entitlement Cards (v2.1) ===');
  console.log('Current context:', window.ctx);
  
  if (!window.supabase) return;

  const container = document.getElementById('entitlements-cards-container');
  if (!container) {
    console.error('entitlements-cards-container not found');
    return;
  }
  
  // Also load holiday entitlements for the list view if available
  if (typeof window.loadHolidayEntitlements === 'function') {
    window.loadHolidayEntitlements();
  }
  
  const filterContainer = document.getElementById('entitlements-filter-container');
  if (filterContainer) {
    filterContainer.innerHTML = `
      <div class="filter-controls">
        <div class="filter-group">
          <label for="role-filter">Filter by Role:</label>
          <select id="role-filter" class="filter-select">
            <option value="all">All Roles</option>
          </select>
        </div>
        <div class="filter-group">
          <label for="team-filter">Filter by Team:</label>
          <select id="team-filter" class="filter-select">
            <option value="all">All Teams</option>
          </select>
        </div>
        <div class="filter-group">
          <input type="text" id="staff-search" placeholder="Search by name..." class="filter-input">
        </div>
      </div>
    `;
  }

  // Loading state
  container.innerHTML = `
    <div class="loading-indicator">
      <div class="spinner"></div>
      <p>Loading staff data...</p>
    </div>
  `;

  try {
    console.log('Loading staff entitlement cards...');

    // Load staff from master_users table (the single source of truth)
    // Add site filtering based on current user context if available
    let query = window.supabase
      .from('master_users')
      .select('*');
      // Not filtering by active status since all users currently have active=false
    
    // Apply site filtering if context is available
    if (window.ctx && window.ctx.site_id) {
      console.log('Filtering by site_id:', window.ctx.site_id);
      query = query.eq('site_id', window.ctx.site_id);
    } else {
      console.log('No site context found, loading all users');
    }
    
    let { data: profiles, error: profileError } = await query.order('full_name');

    if (profileError) {
      console.error('Error loading master_users:', profileError);
      container.innerHTML = `<div class="error-message">Error loading staff profiles: ${profileError.message}</div>`;
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.log('No master_users profiles found, trying holidays table as fallback');
      
      // Try to get data from holidays table as a fallback
      const { data: holidayProfiles, error: holidayError } = await window.supabase
        .from('holidays')
        .select('*');
      
      if (holidayError || !holidayProfiles || holidayProfiles.length === 0) {
        console.log('No profiles found in holidays table either');
        container.innerHTML = '<div class="empty-state">No staff holiday profiles found.</div>';
        return;
      }
      
      console.log(`Found ${holidayProfiles.length} profiles in holidays table instead`);
      profiles = holidayProfiles;
    }

    console.log('=== DEBUGGING: Loaded profiles ===');
    console.log('Number of profiles:', profiles.length);
    profiles.forEach((profile, index) => {
      console.log(`Profile ${index + 1}:`, {
        id: profile.id,
        name: profile.full_name,
        email: profile.email,
        site_id: profile.site_id,
        active: profile.active,
        access_type: profile.access_type,
        auth_user_id: profile.auth_user_id,
        holiday_approved: profile.holiday_approved
      });
    });
    console.log('=== END DEBUGGING ===');

    // Get all entitlements and working patterns from master_users - single source of truth
    const currentYear = new Date().getFullYear();
    
    console.log('=== MASTER USERS DATA LOADING ===');
    console.log('All profile data now comes from master_users table only');

    // No need to query separate entitlement or working pattern tables
    // All data is now in master_users table after migration
    const entitlements = null;
    const workingPatterns = null;
    const entitlementMap = {};
    const patternMap = {};
    const approvalMap = {};

    // Create approval map from master_users (holiday_approved column)
    if (profiles) {
      profiles.forEach(profile => {
        approvalMap[profile.auth_user_id] = profile.holiday_approved || false;
      });
    }
    
    // Make sure we're showing the most recent data
    console.log('Master users profiles loaded:', profiles.length);
    console.log('All holiday data now consolidated in master_users table');

    console.log('Loaded profiles:', profiles.length);

    // Populate role and team filters from master_users data
    const roles = new Set();
    const teams = new Set();
    profiles.forEach(profile => {
      // Use access_type (admin/staff) from master_users, fallback to role_detail
      const role = profile.access_type || profile.role_detail || 'Staff';
      roles.add(role);
      if (profile.team_name) teams.add(profile.team_name);
    });

    const roleFilter = document.getElementById('role-filter');
    const teamFilter = document.getElementById('team-filter');

    if (roleFilter) {
      roles.forEach(role => {
        const option = document.createElement('option');
        option.value = role;
        option.textContent = role;
        roleFilter.appendChild(option);
      });
    }

    if (teamFilter) {
      teams.forEach(team => {
        const option = document.createElement('option');
        option.value = team;
        option.textContent = team;
        teamFilter.appendChild(option);
      });
    }

    // Build the cards grid
    const cardsHTML = `
      <div class="staff-cards-grid" id="staff-cards-grid">
        ${profiles.map(profile => {
          // All data now comes directly from master_users table
          const isApproved = profile.holiday_approved || false;
          const isGP = profile.is_gp;
          const unit = isGP ? 'sessions' : 'hrs';

          // Get weekly totals directly from master_users
          let weeklyTotal = 0;
          
          if (isGP) {
            weeklyTotal = parseFloat(profile.weekly_sessions || profile.total_sessions || 0);
          } else {
            weeklyTotal = parseFloat(profile.weekly_hours || profile.total_hours || 0);
          }
          
          // If no weekly total, calculate from daily values in master_users
          if (weeklyTotal === 0) {
            const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            days.forEach(day => {
              const fieldName = isGP ? `${day}_sessions` : `${day}_hours`;
              weeklyTotal += parseFloat(profile[fieldName] || 0);
            });
          }

          // Get entitlement values directly from master_users
          const multiplier = profile.holiday_multiplier || 6;
          const calculated = isGP ? profile.calculated_sessions : profile.calculated_hours;
          const override = profile.manual_override ? (isGP ? profile.override_sessions : profile.override_hours) : null;
          const final = override !== null ? override : (calculated || 0);
          
          // Get usage and remaining from master_users
          const booked = isGP ? profile.holidays_used_sessions || 0 : profile.holidays_used_hours || 0;
          const remaining = final - booked;

          // Format hours as HH:MM for display
          const formatHours = (val) => {
            if (!val || val === '0:00') return '0:00';
            if (typeof val === 'string' && val.includes(':')) return val;
            const hours = Math.floor(val);
            const minutes = Math.round((val - hours) * 60);
            return `${hours}:${String(minutes).padStart(2, '0')}`;
          };

          // Get display role from master_users
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

    container.innerHTML = cardsHTML;

    // Set up filter event listeners
    setupFilterListeners();

  } catch (error) {
    console.error('Error in loadStaffEntitlementCards:', error);
    container.innerHTML = `<div class="error-message">Error loading data: ${error.message}</div>`;
  }
}

// Setup filter event listeners
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

// Show staff detail modal with working pattern and entitlement override
async function showStaffDetailModal(staffId, userId, isGP) {
  // Create modal if it doesn't exist
  let modal = document.getElementById('staff-detail-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'staff-detail-modal';
    modal.className = 'modal';
    document.body.appendChild(modal);
  }

  // Set loading state
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Staff Details</h2>
        <button class="close-modal" onclick="closeStaffDetailModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="loading-indicator">
          <div class="spinner"></div>
          <p>Loading staff details...</p>
        </div>
      </div>
    </div>
  `;

  modal.classList.add('show');

  try {
    // Get profile from master_users instead of holiday profiles
    const { data: profile } = await supabase
      .from('master_users')
      .select('*')
      .eq('id', staffId)
      .single();

    // All data is now in master_users - no need for separate queries
    const entitlement = profile; // Use profile data directly
    const workingPattern = profile; // Use profile data directly

    if (!profile) {
      throw new Error('Staff profile not found');
    }

    // Get approval status from master_users
    const isApproved = profile.holiday_approved || false;

    // Get necessary values from master_users
    const name = profile.full_name || 'Unknown';
    const role = profile.access_type || profile.role_detail || 'Staff';
    const team = profile.team_name || 'No team';
    const isGPStaff = profile.is_gp;
    const unit = isGPStaff ? 'sessions' : 'hours';
    
    const multiplier = entitlement?.multiplier || 10;
    const override = entitlement?.override;
    const calculated = isGPStaff ? entitlement?.calculated_sessions : entitlement?.calculated_hours;
    const final = override !== null ? override : (calculated || 0);

    // Format hours as HH:MM for display with precise handling of decimal values
    const formatHours = (val) => {
      if (!val || val === '0:00') return '0:00';
      if (typeof val === 'string' && val.includes(':')) return val;
      
      // Ensure proper rounding for values like 37.5 hours (should be 37:30)
      const hours = Math.floor(val);
      // Use precise rounding to handle floating point issues
      const minutes = Math.round((val - hours) * 60 * 1000) / 1000;
      
      // Round to nearest minute
      return `${hours}:${String(Math.round(minutes)).padStart(2, '0')}`;
    };

    // For parsing HH:MM inputs back to decimal
    const parseHours = (timeStr) => {
      if (!timeStr || typeof timeStr !== 'string') return 0;
      const [h, m] = timeStr.split(':').map(Number);
      if (isNaN(h) || isNaN(m)) return 0;
      return h + (m / 60);
    };

    // Set up days for working pattern
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    // Create working pattern inputs
    const workingPatternHTML = days.map((day, index) => {
      const fieldName = isGPStaff ? `${day}_sessions` : `${day}_hours`;
      const value = workingPattern ? workingPattern[fieldName] || 0 : 0;
      
      return `
        <div class="working-day-row">
          <label for="${day}-input">${dayLabels[index]}:</label>
          <div class="input-group">
            <input 
              type="${isGPStaff ? 'number' : 'text'}" 
              id="${day}-input" 
              name="${fieldName}" 
              value="${isGPStaff ? value : formatHours(value)}" 
              ${isGPStaff ? 'min="0" max="2" step="1"' : 'pattern="\\d+:[0-5]\\d"'}
              class="working-day-input" 
              onchange="updateWeeklyTotalInModal()"
              oninput="updateWeeklyTotalInModal()"
            >
            <span class="unit-label">${isGPStaff ? 'sessions' : 'hrs'}</span>
          </div>
        </div>
      `;
    }).join('');
    
    // Calculate the initial weekly total
    let weeklyTotal = 0;
    
    // First check if we have weekly values in the entitlements table
    if (entitlement) {
      if (isGPStaff && entitlement.weekly_sessions !== null && entitlement.weekly_sessions !== undefined) {
        weeklyTotal = parseFloat(entitlement.weekly_sessions || 0);
      } else if (!isGPStaff && entitlement.weekly_hours !== null && entitlement.weekly_hours !== undefined) {
        weeklyTotal = parseFloat(entitlement.weekly_hours || 0);
      }
    }
    
    // If no value in entitlements or it's zero, calculate from working patterns
    if (weeklyTotal === 0 && workingPattern) {
      // First try to use total values if available
      if (isGPStaff && workingPattern.total_sessions) {
        weeklyTotal = parseFloat(workingPattern.total_sessions);
      } else if (!isGPStaff && workingPattern.total_hours) {
        weeklyTotal = parseFloat(workingPattern.total_hours);
      } else {
        // Otherwise calculate from days
        days.forEach(day => {
          const fieldName = isGPStaff ? `${day}_sessions` : `${day}_hours`;
          weeklyTotal += parseFloat(workingPattern[fieldName] || 0);
        });
      }
    }

    // Now build the full modal content
    const modalContent = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>${name}</h2>
          <button class="close-modal" onclick="closeStaffDetailModal()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="staff-info-section">
            <div class="staff-info-row">
              <span class="info-label">Role:</span>
              <span class="info-value">${role}</span>
            </div>
            <div class="staff-info-row">
              <span class="info-label">Team:</span>
              <span class="info-value">${team}</span>
            </div>
            <div class="staff-info-row">
              <span class="info-label">Type:</span>
              <span class="info-value staff-type-badge ${isGPStaff ? 'gp' : 'staff'}">${isGPStaff ? 'GP' : 'Staff'}</span>
            </div>
          </div>
          
          <div class="working-pattern-section">
            <h3>Working Pattern</h3>
            <div class="working-pattern-grid">
              ${workingPatternHTML}
            </div>
            <div class="weekly-total-row">
              <span class="weekly-total-label">Weekly Total:</span>
              <span id="modal-weekly-total" class="weekly-total-value">${isGPStaff ? weeklyTotal : formatHours(weeklyTotal)} ${isGPStaff ? 'sessions' : 'hrs'}</span>
            </div>
            <button id="save-pattern-btn" class="save-btn" onclick="saveWorkingPatternFromModal('${userId}', ${isGPStaff})">
              Save Working Pattern
            </button>
          </div>
          
          <div class="entitlement-section">
            <h3>Holiday Entitlement</h3>
            <div class="entitlement-form">
              <div class="entitlement-row">
                <label for="multiplier-input">Multiplier:</label>
                <input type="number" id="multiplier-input" value="${multiplier}" min="1" max="52" step="0.5" class="entitlement-input">
              </div>
              <div class="entitlement-calculated-row">
                <span class="calculated-label">Calculated Entitlement:</span>
                <span id="calculated-entitlement" class="calculated-value">
                  ${isGPStaff ? calculated || 0 : formatHours(calculated || 0)} ${unit}
                </span>
              </div>
              <div class="override-section">
                <div class="override-row">
                  <label for="override-checkbox" class="override-label">
                    <input type="checkbox" id="override-checkbox" ${override !== null ? 'checked' : ''}>
                    Use manual override
                  </label>
                </div>
                <div class="override-input-row ${override !== null ? '' : 'hidden'}" id="override-input-row">
                  <label for="override-input">Override Value:</label>
                  <div class="input-group">
                    <input 
                      type="${isGPStaff ? 'number' : 'text'}" 
                      id="override-input" 
                      value="${override !== null ? (isGPStaff ? override : formatHours(override)) : ''}" 
                      placeholder="${isGPStaff ? '0' : '0:00'}" 
                      ${override === null ? 'disabled' : ''}
                      class="entitlement-input"
                    >
                    <span class="unit-label">${unit}</span>
                  </div>
                </div>
              </div>
              <button id="save-entitlement-btn" class="save-btn" onclick="saveEntitlementFromModal('${staffId}', ${isGPStaff})">
                Save Entitlement
              </button>
            </div>
          </div>
          
          <div class="holiday-approval-section">
            <h3>Holiday Access</h3>
            <div class="approval-status">
              ${isApproved ? `
                <div class="approval-status-row approved">
                  <span class="approval-icon">✓</span>
                  <span class="approval-text">Holiday access approved</span>
                  <span class="approval-date">Staff member can view and manage their holidays</span>
                </div>
              ` : `
                <div class="approval-status-row pending">
                  <span class="approval-icon">⏳</span>
                  <span class="approval-text">Awaiting approval</span>
                  <span class="approval-note">Staff member cannot access holidays until approved</span>
                </div>
                <button class="approve-holiday-btn" onclick="approveHolidaysFromModal('${userId}', '${name}')">
                  Approve Holiday Access
                </button>
              `}
            </div>
          </div>
        </div>
      </div>
    `;

    modal.innerHTML = modalContent;

    // Set up event listeners
    document.getElementById('override-checkbox').addEventListener('change', function() {
      const overrideRow = document.getElementById('override-input-row');
      const overrideInput = document.getElementById('override-input');
      
      if (this.checked) {
        overrideRow.classList.remove('hidden');
        overrideInput.disabled = false;
      } else {
        overrideRow.classList.add('hidden');
        overrideInput.disabled = true;
        
        // Update calculated value display when override is unchecked
        updateWeeklyTotalInModal();
      }
    });
    
    // Add stronger listener for multiplier input to update calculated value in real-time
    const multiplierInput = document.getElementById('multiplier-input');
    if (multiplierInput) {
      // Remove any existing listeners to avoid duplicates
      const newMultiplierInput = multiplierInput.cloneNode(true);
      multiplierInput.parentNode.replaceChild(newMultiplierInput, multiplierInput);
      
      // Add the input and change events to ensure updates happen immediately
      newMultiplierInput.addEventListener('input', function() {
        if (!document.getElementById('override-checkbox').checked) {
          updateWeeklyTotalInModal();
        }
      });
      
      newMultiplierInput.addEventListener('change', function() {
        if (!document.getElementById('override-checkbox').checked) {
          updateWeeklyTotalInModal();
        }
      });
    }

  } catch (error) {
    console.error('Error loading staff details:', error);
    modal.querySelector('.modal-body').innerHTML = `
      <div class="error-message">
        Error loading staff details: ${error.message}
      </div>
    `;
  }
}

// Close the staff detail modal
function closeStaffDetailModal() {
  const modal = document.getElementById('staff-detail-modal');
  if (modal) {
    modal.classList.remove('show');
  }
}

// Update weekly total when working pattern is changed in modal
function updateWeeklyTotalInModal() {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const modal = document.getElementById('staff-detail-modal');
  
  if (!modal) return;
  
  // Find if this is a GP or staff from the badge
  const badge = modal.querySelector('.staff-type-badge');
  const isGP = badge && badge.classList.contains('gp');
  let total = 0;
  
  days.forEach(day => {
    const input = document.getElementById(`${day}-input`);
    if (!input) return;
    
    if (isGP) {
      // For GPs, just get the numeric value
      total += parseFloat(input.value) || 0;
    } else {
      // For staff, handle hours in HH:MM format
      if (/^\d+:[0-5]\d$/.test(input.value)) {
        const [h, m] = input.value.split(':').map(Number);
        total += h + (m / 60);
      } else if (!isNaN(input.value)) {
        total += parseFloat(input.value) || 0;
      }
    }
  });
  
  const totalEl = document.getElementById('modal-weekly-total');
  if (totalEl) {
    if (isGP) {
      totalEl.textContent = `${total} sessions`;
    } else {
      // Format as HH:MM with precise rounding for 37.5 hours to show as 37:30
      const hours = Math.floor(total);
      // Use Math.round with a multiplier for precision with floating point
      const minutes = Math.round((total - hours) * 60 * 1000) / 1000;
      totalEl.textContent = `${hours}:${String(Math.round(minutes)).padStart(2, '0')} hrs`;
    }
  }
  
  // Also update the calculated entitlement preview
  const multiplierInput = document.getElementById('multiplier-input');
  const calculatedEl = document.getElementById('calculated-entitlement');
  const overrideCheckbox = document.getElementById('override-checkbox');
  
  // Always update the calculation when this function is called
  if (calculatedEl && multiplierInput) {
    // Don't update if override is checked
    if (overrideCheckbox && overrideCheckbox.checked) {
      return;
    }
    
    const multiplier = parseFloat(multiplierInput.value) || 10;
    const calculated = total * multiplier;
    const unit = isGP ? 'sessions' : 'hrs';
    
    // Format hours as HH:MM for display if needed
    if (isGP) {
      calculatedEl.textContent = `${calculated.toFixed(1)} ${unit}`;
    } else {
      const hours = Math.floor(calculated);
      // Use precise rounding to handle 0.5 hours correctly (30 minutes)
      const minutes = Math.round((calculated - hours) * 60 * 1000) / 1000;
      calculatedEl.textContent = `${hours}:${String(Math.round(minutes)).padStart(2, '0')} ${unit}`;
    }
    
    // Highlight with animation to make the change more visible
    calculatedEl.style.transition = 'color 0.3s';
    calculatedEl.style.color = 'var(--warning)';
    setTimeout(() => {
      calculatedEl.style.color = 'var(--accent)';
    }, 500);
  }
}

// Save working pattern from modal
async function saveWorkingPatternFromModal(userId, isGP) {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const payload = { auth_user_id: userId, updated_at: new Date().toISOString() };
  
  let total = 0;
  let staffId = null;
  
  try {
    // Get the save button and change it to a loading state
    const saveBtn = document.getElementById('save-pattern-btn');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;
    saveBtn.style.opacity = '0.7';
    
    // Add a loading indicator to the entitlement section
    const entitlementSection = document.querySelector('.entitlement-section');
    if (entitlementSection) {
      const calculatedEl = document.getElementById('calculated-entitlement');
      if (calculatedEl) {
        calculatedEl.innerHTML = `
          <span class="loading-spinner" style="display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.2); border-left-color: var(--accent); border-radius: 50%; animation: spin 1s linear infinite; margin-right: 8px;"></span>
          Updating...
        `;
      }
    }
    
    days.forEach(day => {
      const input = document.getElementById(`${day}-input`);
      if (!input) return;
      
      const fieldName = isGP ? `${day}_sessions` : `${day}_hours`;
      let value;
      
      if (isGP) {
        // For GPs, ensure the values are integers between 0-2
        value = Math.round(Math.min(Math.max(parseFloat(input.value) || 0, 0), 2));
      } else {
        // For staff, handle hours in HH:MM format
        if (/^\d+:[0-5]\d$/.test(input.value)) {
          const [h, m] = input.value.split(':').map(Number);
          value = h + (m / 60);
        } else if (!isNaN(input.value)) {
          value = parseFloat(input.value) || 0;
        } else {
          value = 0;
        }
      }
      
      payload[fieldName] = value;
      total += value;
    });
    
    // Add total to payload
    if (isGP) {
      payload.total_sessions = total;
      payload.total_hours = 0; // GPs don't track hours
    } else {
      payload.total_hours = total;
      payload.total_sessions = 0; // Staff don't track sessions
    }
    
    console.log('Saving working pattern to master_users:', payload);
    
    // Save to master_users instead of separate table
    const { error } = await supabase
      .from('master_users')
      .update(payload)
      .eq('auth_user_id', userId);
    
    if (error) {
      throw error;
    }
    
    // Update entitlement values in master_users as well
    const currentYear = new Date().getFullYear();
    
    // Get current user data from master_users
    const { data: currentUser } = await supabase
      .from('master_users')
      .select('*')
      .eq('auth_user_id', userId)
      .single();
      
    if (currentUser) {
      // Update or create entitlement record with new weekly values
      const entitlementPayload = {
        holiday_year: currentYear,
        updated_at: new Date().toISOString()
      };
      
      // Add the correct weekly value
      if (isGP) {
        entitlementPayload.weekly_sessions = total;
      } else {
        entitlementPayload.weekly_hours = total;
      }
      
      // Keep existing multiplier and override if present
      entitlementPayload.holiday_multiplier = currentUser.holiday_multiplier || 6;
      
      // Only copy override value if manual_override is true
      if (currentUser.manual_override === true) {
        entitlementPayload.manual_override = true;
        if (isGP && currentUser.override_sessions !== null) {
          entitlementPayload.override_sessions = currentUser.override_sessions;
        } else if (!isGP && currentUser.override_hours !== null) {
          entitlementPayload.override_hours = currentUser.override_hours;
        }
      }
      
      // Calculate the new entitlement if there's no override
      const multiplier = entitlementPayload.holiday_multiplier || 6;
      
      console.log('Calculating entitlement with:', { total, multiplier });
      
      if (isGP) {
        entitlementPayload.calculated_sessions = total * multiplier;
        console.log('New calculated sessions:', entitlementPayload.calculated_sessions);
      } else {
        entitlementPayload.calculated_hours = total * multiplier;
        console.log('New calculated hours:', entitlementPayload.calculated_hours);
      }
      
      console.log('Updating master_users with entitlement payload:', entitlementPayload);
      
      // Update the master_users record
      const { error: entError } = await supabase
        .from('master_users')
        .update(entitlementPayload)
        .eq('auth_user_id', userId);
      
      if (entError) {
        console.error('Error updating master_users entitlement:', entError);
      }
    }
    
    // Wait a bit to ensure the database update is complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Refresh the data in the modal
    if (currentUser) {
      // Get the updated entitlement record from master_users
      const { data: updatedEntitlement } = await supabase
        .from('master_users')
        .select('*')
        .eq('auth_user_id', userId)
        .single();
        
      // Update the calculated entitlement display in the modal
      const calculatedEl = document.getElementById('calculated-entitlement');
      if (calculatedEl && updatedEntitlement) {
        const unit = isGP ? 'sessions' : 'hrs';
        const calculated = isGP ? updatedEntitlement.calculated_sessions : updatedEntitlement.calculated_hours;
        
        // Format hours as HH:MM for display
        const formatHours = (val) => {
          if (!val || val === '0:00') return '0:00';
          if (typeof val === 'string' && val.includes(':')) return val;
          const hours = Math.floor(val);
          const minutes = Math.round((val - hours) * 60);
          return `${hours}:${String(minutes).padStart(2, '0')}`;
        };
        
        calculatedEl.innerHTML = `${isGP ? calculated || 0 : formatHours(calculated || 0)} ${unit}`;
        calculatedEl.style.color = 'var(--accent)';
        
        // Flash animation to highlight the update
        calculatedEl.style.transition = 'color 0.5s';
        calculatedEl.style.color = 'var(--success)';
        setTimeout(() => {
          calculatedEl.style.color = 'var(--accent)';
        }, 1000);
      }
    }
    
    // Show success message on the save button
    saveBtn.disabled = false;
    saveBtn.style.opacity = '1';
    saveBtn.textContent = '✓ Saved!';
    saveBtn.style.background = 'var(--success)';
    
    setTimeout(() => {
      saveBtn.textContent = originalText;
      saveBtn.style.background = '';
    }, 2000);
    
    // Reload cards in the background to show updated data
    setTimeout(() => {
      loadStaffEntitlementCards();
    }, 500);
    
  } catch (error) {
    console.error('Error saving working pattern:', error);
    alert('Error saving working pattern: ' + error.message);
  }
}

// Save entitlement from modal
async function saveEntitlementFromModal(staffId, isGP) {
  try {
    // Get the save button and change it to a loading state
    const saveBtn = document.getElementById('save-entitlement-btn');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;
    saveBtn.style.opacity = '0.7';
    
    // Add a loading indicator to the calculated value
    const calculatedEl = document.getElementById('calculated-entitlement');
    if (calculatedEl) {
      calculatedEl.innerHTML = `
        <span class="loading-spinner" style="display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.2); border-left-color: var(--accent); border-radius: 50%; animation: spin 1s linear infinite; margin-right: 8px;"></span>
        Updating...
      `;
    }
    
    const multiplierInput = document.getElementById('multiplier-input');
    const overrideCheckbox = document.getElementById('override-checkbox');
    const overrideInput = document.getElementById('override-input');
    
    const multiplier = parseFloat(multiplierInput.value) || 10;
    let override = null;
    
    if (overrideCheckbox.checked && overrideInput.value) {
      if (isGP) {
        override = parseFloat(overrideInput.value) || null;
      } else {
        // Parse HH:MM format
        if (/^\d+:[0-5]\d$/.test(overrideInput.value)) {
          const [h, m] = overrideInput.value.split(':').map(Number);
          override = h + (m / 60);
        } else if (!isNaN(overrideInput.value)) {
          override = parseFloat(overrideInput.value) || null;
        }
      }
    }
    
    // Get weekly values from master_users
    const { data: currentUser } = await supabase
      .from('master_users')
      .select('weekly_hours, weekly_sessions, auth_user_id')
      .eq('id', staffId)
      .single();
      
    const entitlementData = {
      holiday_multiplier: multiplier,
      manual_override: override !== null ? true : false,
      updated_at: new Date().toISOString()
    };
    
    // Set the appropriate override field based on type
    if (override !== null) {
      if (isGP) {
        entitlementData.override_sessions = override;
      } else {
        entitlementData.override_hours = override;
      }
    }
    
    // Keep existing weekly values and calculate new entitlement
    if (currentUser) {
      // Calculate total from daily values
      let weeklyTotal = 0;
      
      // First try to get the total from weekly values
      if (isGP && currentUser.weekly_sessions !== null && currentUser.weekly_sessions !== undefined) {
        weeklyTotal = parseFloat(currentUser.weekly_sessions || 0);
      } else if (!isGP && currentUser.weekly_hours !== null && currentUser.weekly_hours !== undefined) {
        weeklyTotal = parseFloat(currentUser.weekly_hours || 0);
      }
      
      // If we don't have a weekly total, calculate it from daily values
      if (weeklyTotal === 0) {
        days.forEach(day => {
          const fieldName = isGP ? `${day}_sessions` : `${day}_hours`;
          weeklyTotal += parseFloat(currentUser[fieldName] || 0);
        });
      }
      
      console.log('Weekly total for calculation:', weeklyTotal);
      
      // Store the weekly value
      if (isGP) {
        entitlementData.weekly_sessions = weeklyTotal;
      } else {
        entitlementData.weekly_hours = weeklyTotal;
      }
      
      // Calculate new value if no override
      if (override === null) {
        if (isGP) {
          entitlementData.calculated_sessions = weeklyTotal * multiplier;
          console.log('Calculated sessions:', entitlementData.calculated_sessions);
        } else {
          entitlementData.calculated_hours = weeklyTotal * multiplier;
          console.log('Calculated hours:', entitlementData.calculated_hours);
        }
      } else {
        // Store the override value in the appropriate field
        if (isGP) {
          entitlementData.override_sessions = override;
        } else {
          entitlementData.override_hours = override;
        }
      }
    }
    
    console.log('Saving entitlement to master_users:', entitlementData);
    
    // Save to master_users
    const { error } = await supabase
      .from('master_users')
      .update(entitlementData)
      .eq('id', staffId);
    
    if (error) {
      throw error;
    }
    
    // Wait a bit to ensure the database update is complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Refresh the data in the modal
    const { data: updatedEntitlement } = await supabase
      .from('master_users')
      .select('*')
      .eq('id', staffId)
      .single();
      
    // Update the calculated entitlement display in the modal
    if (calculatedEl && updatedEntitlement) {
      const unit = isGP ? 'sessions' : 'hrs';
      const final = override !== null ? override : (isGP ? updatedEntitlement.calculated_sessions : updatedEntitlement.calculated_hours);
      
      // Format hours as HH:MM for display
      const formatHours = (val) => {
        if (!val || val === '0:00') return '0:00';
        if (typeof val === 'string' && val.includes(':')) return val;
        const hours = Math.floor(val);
        const minutes = Math.round((val - hours) * 60);
        return `${hours}:${String(minutes).padStart(2, '0')}`;
      };
      
      calculatedEl.innerHTML = `${isGP ? final || 0 : formatHours(final || 0)} ${unit}`;
      calculatedEl.style.color = 'var(--accent)';
      
      // Flash animation to highlight the update
      calculatedEl.style.transition = 'color 0.5s';
      calculatedEl.style.color = 'var(--success)';
      setTimeout(() => {
        calculatedEl.style.color = 'var(--accent)';
      }, 1000);
    }
    
    // Show success message on the save button
    saveBtn.disabled = false;
    saveBtn.style.opacity = '1';
    saveBtn.textContent = '✓ Saved!';
    saveBtn.style.background = 'var(--success)';
    
    setTimeout(() => {
      saveBtn.textContent = originalText;
      saveBtn.style.background = '';
    }, 2000);
    
    // Reload cards to show updated data
    setTimeout(() => {
      loadStaffEntitlementCards();
    }, 500);
    
  } catch (error) {
    console.error('Error saving entitlement:', error);
    alert('Error saving entitlement: ' + error.message);
  }
}

// Approve holidays for a staff member from within the modal
async function approveHolidaysFromModal(userId, staffName) {
  if (!window.supabase) {
    alert('Unable to connect to database');
    return;
  }

  // Validate userId - ensure it's not null, undefined, or the string 'null'
  if (!userId || userId === 'null' || userId === 'undefined') {
    console.error('Invalid user ID provided:', userId);
    alert('Error: Invalid user ID. Cannot approve holidays.');
    return;
  }

  if (!confirm(`Are you sure you want to approve holidays for ${staffName}? This will allow them to view and manage their holiday entitlements.`)) {
    return;
  }

  try {
    // Get the approve button and update its state
    const approveBtn = document.querySelector('.approve-holiday-btn');
    const originalText = approveBtn ? approveBtn.textContent : '';
    
    if (approveBtn) {
      approveBtn.textContent = 'Approving...';
      approveBtn.disabled = true;
      approveBtn.style.opacity = '0.7';
    }

    // First check if the user exists in master_users and if holiday_approved column exists
    try {
      const { data: testData, error: testError } = await window.supabase
        .from('master_users')
        .select('holiday_approved')
        .eq('auth_user_id', userId)
        .maybeSingle();

      if (testError && testError.message.includes('column')) {
        console.log('Holiday approval column not found:', testError);
        alert('The holiday approval feature is not yet enabled in the database. Please contact your system administrator to add the "holiday_approved" column to the master_users table.');
        
        if (approveBtn) {
          approveBtn.textContent = originalText;
          approveBtn.disabled = false;
          approveBtn.style.opacity = '1';
        }
        return;
      }
    } catch (checkError) {
      console.error('Error checking holiday_approved column:', checkError);
    }

    // Update the approval status in master_users using the standard client
    console.log('Updating holiday_approved for user:', userId);
    const { data, error } = await window.supabase
      .from('master_users')
      .update({ holiday_approved: true })
      .eq('auth_user_id', userId);

    if (error) {
      console.error('Error approving holidays:', error);
      alert('Error approving holidays: ' + error.message);
      
      if (approveBtn) {
        approveBtn.textContent = originalText;
        approveBtn.disabled = false;
        approveBtn.style.opacity = '1';
      }
      return;
    }

    // Success message
    alert(`Holidays approved for ${staffName}!`);

    // Update the modal UI to show approved status
    const approvalSection = document.querySelector('.holiday-approval-section .approval-status');
    if (approvalSection) {
      approvalSection.innerHTML = `
        <div class="approval-status-row approved">
          <span class="approval-icon">✓</span>
          <span class="approval-text">Holiday access approved</span>
          <span class="approval-date">Staff member can view and manage their holidays</span>
        </div>
      `;
    }

    // Refresh the card display in the background
    setTimeout(() => {
      loadStaffEntitlementCards();
    }, 500);

  } catch (error) {
    console.error('Error in approveHolidaysFromModal:', error);
    alert('An error occurred while approving holidays.');
    
    // Reset button state if there was an error
    if (approveBtn) {
      approveBtn.textContent = originalText;
      approveBtn.disabled = false;
      approveBtn.style.opacity = '1';
    }
  }
}

// Approve holidays for a staff member
async function approveHolidays(userId, staffName) {
  if (!window.supabase) {
    alert('Unable to connect to database');
    return;
  }

  if (!confirm(`Are you sure you want to approve holidays for ${staffName}? This will allow them to view and manage their holiday entitlements.`)) {
    return;
  }

  try {
    // First check if the user exists in master_users and if holiday_approved column exists
    try {
      const { data: testData, error: testError } = await window.supabase
        .from('master_users')
        .select('holiday_approved')
        .eq('auth_user_id', userId)
        .maybeSingle();

      if (testError && testError.message.includes('column')) {
        console.log('Holiday approval column not found:', testError);
        alert('The holiday approval feature is not yet enabled in the database. Please contact your system administrator to add the "holiday_approved" column to the master_users table.');
        return;
      }
    } catch (checkError) {
      console.error('Error checking holiday_approved column:', checkError);
    }

    // Update the approval status in master_users using the standard client
    console.log('Updating holiday_approved for user:', userId);
    const { data, error } = await window.supabase
      .from('master_users')
      .update({ holiday_approved: true })
      .eq('auth_user_id', userId);

    if (error) {
      console.error('Error approving holidays:', error);
      alert('Error approving holidays: ' + error.message);
      return;
    }

    // Success message
    alert(`Holidays approved for ${staffName}!`);

    // Refresh the card display
    loadStaffEntitlementCards();

  } catch (error) {
    console.error('Error in approveHolidays:', error);
    alert('An error occurred while approving holidays.');
  }
}

// Export to load on page init
window.loadStaffEntitlementCards = loadStaffEntitlementCards;
window.showStaffDetailModal = showStaffDetailModal;
window.approveHolidays = approveHolidays;
window.approveHolidaysFromModal = approveHolidaysFromModal;
window.closeStaffDetailModal = closeStaffDetailModal;
window.updateWeeklyTotalInModal = updateWeeklyTotalInModal;
window.saveWorkingPatternFromModal = saveWorkingPatternFromModal;
window.saveEntitlementFromModal = saveEntitlementFromModal;

// Auto-load if we're already on the holidays section
document.addEventListener('DOMContentLoaded', () => {
  const activeSection = document.querySelector('.view.active');
  if (activeSection && (activeSection.id === 'holidays' || activeSection.id === 'entitlement-management')) {
    console.log('Holiday section detected, initializing cards...');
    setTimeout(() => loadStaffEntitlementCards(), 500);
  } else {
    console.log('Holiday section not active yet, waiting for navigation...');
  }

  // Also listen for section changes to initialize when user navigates to holidays
  window.addEventListener('sectionChanged', (event) => {
    const sectionId = event.detail?.sectionId;
    if (sectionId === 'entitlement-management') {
      console.log('Navigated to holiday section, initializing cards...');
      setTimeout(() => loadStaffEntitlementCards(), 500);
    }
  });
});
