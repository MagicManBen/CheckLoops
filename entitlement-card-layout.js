// Staff Entitlement Card UI Implementation

// Load and display staff cards with entitlement data
async function loadStaffEntitlementCards() {
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

    // First, get all staff profiles
    const { data: profiles, error: profileError } = await window.supabase
      .from('1_staff_holiday_profiles')
      .select('*')
      .order('full_name');

    if (profileError) {
      console.error('Error loading profiles:', profileError);
      container.innerHTML = `<div class="error-message">Error loading staff profiles: ${profileError.message}</div>`;
      return;
    }

    if (!profiles || profiles.length === 0) {
      container.innerHTML = '<div class="empty-state">No staff holiday profiles found.</div>';
      return;
    }

    // Get all entitlements for current year
    const currentYear = new Date().getFullYear();
    const { data: entitlements, error: entError } = await window.supabase
      .from('2_staff_entitlements')
      .select('*')
      .eq('year', currentYear);

    if (entError) {
      console.error('Error loading entitlements:', entError);
    }

    // Get all working patterns
    const { data: workingPatterns, error: patternError } = await window.supabase
      .from('3_staff_working_patterns')
      .select('*');

    if (patternError) {
      console.error('Error loading working patterns:', patternError);
    }

    // Create maps for easier lookup
    const entitlementMap = {};
    const patternMap = {};

    if (entitlements) {
      entitlements.forEach(ent => {
        entitlementMap[ent.staff_id] = ent;
      });
    }

    if (workingPatterns) {
      workingPatterns.forEach(pattern => {
        patternMap[pattern.user_id] = pattern;
      });
    }
    
    // Make sure we're showing the most recent data
    console.log('Entitlement data:', entitlements);
    console.log('Working patterns data:', workingPatterns);

    console.log('Loaded profiles:', profiles.length);
    console.log('Loaded entitlements:', entitlements?.length || 0);
    console.log('Loaded patterns:', workingPatterns?.length || 0);

    // Populate role and team filters
    const roles = new Set();
    const teams = new Set();
    profiles.forEach(profile => {
      if (profile.role) roles.add(profile.role);
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
          const ent = entitlementMap[profile.id] || {};
          const pattern = patternMap[profile.user_id] || {};
          const isGP = profile.is_gp;
          const unit = isGP ? 'sessions' : 'hrs';

          // Get weekly totals - first try from the entitlements table
          let weeklyTotal = 0;
          
          // First check if we have weekly values in the entitlements table
          if (ent) {
            if (isGP && ent.weekly_sessions !== null && ent.weekly_sessions !== undefined) {
              weeklyTotal = parseFloat(ent.weekly_sessions || 0);
            } else if (!isGP && ent.weekly_hours !== null && ent.weekly_hours !== undefined) {
              weeklyTotal = parseFloat(ent.weekly_hours || 0);
            }
          }
          
          // If no value in entitlements, calculate from working patterns
          if (weeklyTotal === 0 && pattern) {
            const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            days.forEach(day => {
              const fieldName = isGP ? `${day}_sessions` : `${day}_hours`;
              weeklyTotal += parseFloat(pattern[fieldName] || 0);
            });
            
            // Use total_hours or total_sessions if available
            if (isGP && pattern.total_sessions !== null && pattern.total_sessions !== undefined) {
              weeklyTotal = parseFloat(pattern.total_sessions);
            } else if (!isGP && pattern.total_hours !== null && pattern.total_hours !== undefined) {
              weeklyTotal = parseFloat(pattern.total_hours);
            }
          }

          // Get entitlement values
          const multiplier = ent?.multiplier || 10;
          const calculated = isGP ? ent?.calculated_sessions : ent?.calculated_hours;
          const override = ent?.override;
          const final = override !== null ? override : (calculated || 0);
          
          // For staff, get booked and remaining values
          const booked = isGP ? profile.total_booked_sessions || 0 : profile.total_booked_hours || 0;
          const remaining = isGP ? profile.remaining_sessions || 0 : profile.remaining_hours || 0;

          // Format hours as HH:MM for display
          const formatHours = (val) => {
            if (!val || val === '0:00') return '0:00';
            if (typeof val === 'string' && val.includes(':')) return val;
            const hours = Math.floor(val);
            const minutes = Math.round((val - hours) * 60);
            return `${hours}:${String(minutes).padStart(2, '0')}`;
          };

          return `
            <div class="staff-card" 
                 data-staff-id="${profile.id}" 
                 data-user-id="${profile.user_id}" 
                 data-is-gp="${isGP}"
                 data-role="${profile.role || ''}"
                 data-team="${profile.team_name || ''}"
                 data-name="${profile.full_name || ''}">
              <div class="staff-card-header">
                <h3 class="staff-name">${profile.full_name || 'Unknown'}</h3>
                <span class="staff-type ${isGP ? 'gp' : 'staff'}">${isGP ? 'GP' : 'Staff'}</span>
              </div>
              <div class="staff-details">
                <div class="staff-role">${profile.role || 'No role'}</div>
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
                <button class="edit-staff-btn" onclick="showStaffDetailModal('${profile.id}', '${profile.user_id}', ${isGP})">
                  Edit Details
                </button>
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
    // Get profile, entitlement, and working pattern
    const { data: profile } = await supabase
      .from('1_staff_holiday_profiles')
      .select('*')
      .eq('id', staffId)
      .single();

    const { data: entitlement } = await supabase
      .from('2_staff_entitlements')
      .select('*')
      .eq('staff_id', staffId)
      .eq('year', new Date().getFullYear())
      .maybeSingle();

    const { data: workingPattern } = await supabase
      .from('3_staff_working_patterns')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!profile) {
      throw new Error('Staff profile not found');
    }

    // Get necessary values
    const name = profile.full_name || 'Unknown';
    const role = profile.role || 'No role';
    const team = profile.team_name || 'No team';
    const isGPStaff = profile.is_gp;
    const unit = isGPStaff ? 'sessions' : 'hours';
    
    const multiplier = entitlement?.multiplier || 10;
    const override = entitlement?.override;
    const calculated = isGPStaff ? entitlement?.calculated_sessions : entitlement?.calculated_hours;
    const final = override !== null ? override : (calculated || 0);

    // Format hours as HH:MM for display
    const formatHours = (val) => {
      if (!val || val === '0:00') return '0:00';
      if (typeof val === 'string' && val.includes(':')) return val;
      const hours = Math.floor(val);
      const minutes = Math.round((val - hours) * 60);
      return `${hours}:${String(minutes).padStart(2, '0')}`;
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
    
    // Add listener for multiplier input to update calculated value in real-time
    document.getElementById('multiplier-input').addEventListener('input', function() {
      if (!document.getElementById('override-checkbox').checked) {
        updateWeeklyTotalInModal();
      }
    });

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
      // Format as HH:MM
      const hours = Math.floor(total);
      const minutes = Math.round((total - hours) * 60);
      totalEl.textContent = `${hours}:${String(minutes).padStart(2, '0')} hrs`;
    }
  }
  
  // Also update the calculated entitlement preview
  const multiplierInput = document.getElementById('multiplier-input');
  const calculatedEl = document.getElementById('calculated-entitlement');
  const overrideCheckbox = document.getElementById('override-checkbox');
  
  if (calculatedEl && multiplierInput && !overrideCheckbox.checked) {
    const multiplier = parseFloat(multiplierInput.value) || 10;
    const calculated = total * multiplier;
    const unit = isGP ? 'sessions' : 'hrs';
    
    // Format hours as HH:MM for display if needed
    if (isGP) {
      calculatedEl.textContent = `${calculated} ${unit}`;
    } else {
      const hours = Math.floor(calculated);
      const minutes = Math.round((calculated - hours) * 60);
      calculatedEl.textContent = `${hours}:${String(minutes).padStart(2, '0')} ${unit}`;
    }
    
    // Highlight with animation
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
  const payload = { user_id: userId, updated_at: new Date().toISOString() };
  
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
    
    console.log('Saving working pattern from modal:', payload);
    
    // Save to database
    const { error } = await supabase
      .from('3_staff_working_patterns')
      .upsert(payload, { onConflict: 'user_id' });
    
    if (error) {
      throw error;
    }
    
    // Now update the staff entitlement weekly values
    const { data: staffProfile } = await supabase
      .from('1_staff_holiday_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();
      
    if (staffProfile) {
      staffId = staffProfile.id;
      const currentYear = new Date().getFullYear();
      
      // Get the current entitlement record
      const { data: entitlement } = await supabase
        .from('2_staff_entitlements')
        .select('*')
        .eq('staff_id', staffId)
        .eq('year', currentYear)
        .maybeSingle();
      
      // Update or create entitlement record with new weekly values
      const entitlementPayload = {
        staff_id: staffId,
        year: currentYear,
        updated_at: new Date().toISOString()
      };
      
      // Add the correct weekly value
      if (isGP) {
        entitlementPayload.weekly_sessions = total;
      } else {
        entitlementPayload.weekly_hours = total;
      }
      
      // Keep existing multiplier and override if present
      if (entitlement) {
        entitlementPayload.multiplier = entitlement.multiplier || 10;
        if (entitlement.override !== null) {
          entitlementPayload.override = entitlement.override;
        }
      }
      
      // Calculate the new entitlement if there's no override
      const multiplier = entitlementPayload.multiplier || 10;
      if (isGP) {
        entitlementPayload.calculated_sessions = total * multiplier;
      } else {
        entitlementPayload.calculated_hours = total * multiplier;
      }
      
      console.log('Updating entitlement with payload:', entitlementPayload);
      
      // Update the entitlement record
      const { error: entError } = await supabase
        .from('2_staff_entitlements')
        .upsert(entitlementPayload, { onConflict: 'staff_id,year' });
      
      if (entError) {
        console.error('Error updating entitlement record:', entError);
      }
    }
    
    // Wait a bit to ensure the database update is complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Refresh the data in the modal
    if (staffId) {
      // Get the updated entitlement record
      const currentYear = new Date().getFullYear();
      const { data: updatedEntitlement } = await supabase
        .from('2_staff_entitlements')
        .select('*')
        .eq('staff_id', staffId)
        .eq('year', currentYear)
        .maybeSingle();
        
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
    
    // Get weekly values from database
    const { data: currentEntitlement } = await supabase
      .from('2_staff_entitlements')
      .select('weekly_hours, weekly_sessions')
      .eq('staff_id', staffId)
      .eq('year', new Date().getFullYear())
      .maybeSingle();
      
    const entitlementData = {
      staff_id: parseInt(staffId),
      year: new Date().getFullYear(),
      multiplier: multiplier,
      override: override,
      updated_at: new Date().toISOString()
    };
    
    // Keep existing weekly values
    if (currentEntitlement) {
      if (isGP && currentEntitlement.weekly_sessions !== null) {
        entitlementData.weekly_sessions = currentEntitlement.weekly_sessions;
        // Calculate new value if no override
        if (override === null) {
          entitlementData.calculated_sessions = currentEntitlement.weekly_sessions * multiplier;
        }
      } else if (!isGP && currentEntitlement.weekly_hours !== null) {
        entitlementData.weekly_hours = currentEntitlement.weekly_hours;
        // Calculate new value if no override
        if (override === null) {
          entitlementData.calculated_hours = currentEntitlement.weekly_hours * multiplier;
        }
      }
    }
    
    console.log('Saving entitlement from modal:', entitlementData);
    
    // Save to database
    const { error } = await supabase
      .from('2_staff_entitlements')
      .upsert(entitlementData, { onConflict: 'staff_id,year' });
    
    if (error) {
      throw error;
    }
    
    // Wait a bit to ensure the database update is complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Refresh the data in the modal
    const { data: updatedEntitlement } = await supabase
      .from('2_staff_entitlements')
      .select('*')
      .eq('staff_id', staffId)
      .eq('year', new Date().getFullYear())
      .maybeSingle();
      
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

// Export to load on page init
window.loadStaffEntitlementCards = loadStaffEntitlementCards;
window.showStaffDetailModal = showStaffDetailModal;
window.closeStaffDetailModal = closeStaffDetailModal;
window.updateWeeklyTotalInModal = updateWeeklyTotalInModal;
window.saveWorkingPatternFromModal = saveWorkingPatternFromModal;
window.saveEntitlementFromModal = saveEntitlementFromModal;