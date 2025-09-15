  async function loadHolidayEntitlements() {
    if (!window.supabase) return;

    const container = document.getElementById('entitlements-list');
    if (!container) {
      console.error('entitlements-list container not found');
      return;
    }

    try {
      console.log('Loading holiday entitlements...');

      // First, get all staff profiles
      const { data: profiles, error: profileError } = await window.supabase
        .from('1_staff_holiday_profiles')
        .select('*')
        .order('full_name');

      if (profileError) {
        console.error('Error loading profiles:', profileError);
        container.innerHTML = `<div style="padding:20px; text-align:center; color:var(--danger);">Error loading staff profiles: ${profileError.message}</div>`;
        return;
      }

      if (!profiles || profiles.length === 0) {
        container.innerHTML = '<div style="padding:20px; text-align:center; color:var(--muted);">No staff holiday profiles found.</div>';
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

      console.log('Loaded profiles:', profiles.length);
      console.log('Loaded entitlements:', entitlements?.length || 0);
      console.log('Loaded patterns:', workingPatterns?.length || 0);

      // Build comprehensive table
      container.innerHTML = `
        <div style="overflow-x: auto;">
          <table class="data-table" style="width: 100%; min-width: 1200px;">
            <thead>
              <tr style="background: var(--glass);">
                <th style="position: sticky; left: 0; background: var(--glass); z-index: 10;">Staff Member</th>
                <th>Type</th>
                <th>Mon</th>
                <th>Tue</th>
                <th>Wed</th>
                <th>Thu</th>
                <th>Fri</th>
                <th>Weekly Total</th>
                <th>Multiplier</th>
                <th>Annual Calculated</th>
                <th>Manual Override</th>
                <th>Final Entitlement</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${profiles.map(profile => {
                const ent = entitlementMap[profile.id];
                const pattern = patternMap[profile.user_id];
                const isGP = profile.is_gp;
                const unit = isGP ? 'sessions' : 'hrs';

                // Get working pattern days
                const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

                // Calculate weekly totals
                let weeklyTotal = 0;
                if (pattern) {
                  if (isGP) {
                    days.forEach(day => {
                      weeklyTotal += parseFloat(pattern[`${day}_sessions`] || 0);
                    });
                  } else {
                    days.forEach(day => {
                      const hours = pattern[`${day}_hours`] || '0:00';
                      const [h, m] = hours.split(':');
                      weeklyTotal += parseFloat(h) + parseFloat(m || 0) / 60;
                    });
                  }
                }

                // Get entitlement values
                const multiplier = ent?.multiplier || 10;
                const calculated = isGP ? ent?.calculated_sessions : ent?.calculated_hours;
                const override = ent?.override;
                const final = override || calculated || 0;

                // Format hours as HH:MM for display
                const formatHours = (val) => {
                  if (!val || val === '0:00') return '0:00';
                  if (typeof val === 'string' && val.includes(':')) return val;
                  const hours = Math.floor(val);
                  const minutes = Math.round((val - hours) * 60);
                  return `${hours}:${String(minutes).padStart(2, '0')}`;
                };

                return `
                  <tr data-staff-id="${profile.id}" data-user-id="${profile.user_id}" data-is-gp="${isGP}">
                    <td style="position: sticky; left: 0; background: white; font-weight: 600; z-index: 5;">
                      ${profile.full_name || 'Unknown'}
                      <br><small style="color: var(--muted);">${profile.role || 'N/A'}</small>
                    </td>
                    <td>
                      <span class="badge ${isGP ? 'badge-primary' : 'badge-secondary'}" style="padding: 4px 8px; border-radius: 4px; background: ${isGP ? 'var(--primary)' : 'var(--secondary)'}; color: white; font-size: 11px;">
                        ${isGP ? 'GP' : 'Staff'}
                      </span>
                    </td>
                    ${days.map(day => {
                      const dayValue = pattern ? (isGP ? pattern[`${day}_sessions`] || 0 : pattern[`${day}_hours`] || '0:00') : (isGP ? 0 : '0:00');
                      return `
                        <td>
                          <input type="${isGP ? 'number' : 'text'}"
                                 class="day-input"
                                 data-day="${day}"
                                 data-staff-id="${profile.id}"
                                 data-user-id="${profile.user_id}"
                                 value="${isGP ? dayValue : formatHours(dayValue)}"
                                 placeholder="${isGP ? '0' : '0:00'}"
                                 pattern="${isGP ? '[0-9]*' : '[0-9]+:[0-5][0-9]'}"
                                 style="width: 60px; padding: 4px 6px; border: 1px solid var(--border-color); border-radius: 4px; text-align: center;">
                        </td>
                      `;
                    }).join('')}
                    <td style="font-weight: 600;">
                      <span id="weekly-total-${profile.id}">
                        ${isGP ? weeklyTotal : formatHours(weeklyTotal)} ${unit}
                      </span>
                    </td>
                    <td>
                      <input type="number"
                             class="multiplier-input"
                             data-staff-id="${profile.id}"
                             value="${multiplier}"
                             min="1" max="52"
                             style="width: 60px; padding: 4px 6px; border: 1px solid var(--border-color); border-radius: 4px; text-align: center;">
                    </td>
                    <td>
                      <span id="calculated-${profile.id}">
                        ${isGP ? (calculated || 0) : formatHours(calculated || 0)} ${unit}
                      </span>
                    </td>
                    <td>
                      <input type="${isGP ? 'number' : 'text'}"
                             class="override-input"
                             data-staff-id="${profile.id}"
                             value="${override ? (isGP ? override : formatHours(override)) : ''}"
                             placeholder="${isGP ? '0' : '0:00'}"
                             pattern="${isGP ? '[0-9]*' : '[0-9]+:[0-5][0-9]'}"
                             style="width: 80px; padding: 4px 6px; border: 1px solid var(--border-color); border-radius: 4px; text-align: center;">
                    </td>
                    <td style="font-weight: 700; color: var(--primary);">
                      <span id="final-${profile.id}">
                        ${isGP ? final : formatHours(final)} ${unit}
                      </span>
                    </td>
                    <td>
                      <button class="btn btn-sm btn-primary save-btn"
                              data-staff-id="${profile.id}"
                              data-user-id="${profile.user_id}"
                              style="padding: 4px 12px; font-size: 12px;">
                        Save
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        <div style="margin-top: 20px; padding: 15px; background: var(--glass); border-radius: 8px;">
          <p style="color: var(--muted); font-size: 14px; margin: 0;">
            <strong>Instructions:</strong> Edit working hours directly in the table. For staff (non-GP), use HH:MM format (e.g., 7:30).
            Manual overrides will take precedence over calculated values. Click Save to update individual records.
          </p>
        </div>
      `;

      // Attach event listeners to save buttons
      container.querySelectorAll('.save-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          await saveStaffEntitlement(e.target);
        });
      });

      // Attach change listeners to inputs for live calculation updates
      container.querySelectorAll('.day-input, .multiplier-input').forEach(input => {
        input.addEventListener('change', (e) => {
          updateCalculations(e.target);
        });
      });

    } catch (error) {
      console.error('Error in loadHolidayEntitlements:', error);
      container.innerHTML = `<div style="padding:20px; text-align:center; color:var(--danger);">Error loading data: ${error.message}</div>`;
    }
  }

  // Save staff entitlement function
  async function saveStaffEntitlement(button) {
    const staffId = button.dataset.staffId;
    const userId = button.dataset.userId;
    const row = button.closest('tr');
    const isGP = row.dataset.isGp === 'true';

    console.log('Saving entitlement for staff:', staffId, 'user:', userId, 'isGP:', isGP);

    try {
      // Gather all the day values
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const workingPattern = { user_id: userId };
      let totalHours = 0;
      let totalSessions = 0;

      days.forEach(day => {
        const input = row.querySelector(`.day-input[data-day="${day}"]`);
        if (input) {
          if (isGP) {
            const value = parseFloat(input.value) || 0;
            workingPattern[`${day}_sessions`] = value;
            totalSessions += value;
            workingPattern[`${day}_hours`] = '0:00';
          } else {
            const value = input.value || '0:00';
            workingPattern[`${day}_hours`] = value;
            const [h, m] = value.split(':');
            totalHours += parseFloat(h) + parseFloat(m || 0) / 60;
            workingPattern[`${day}_sessions`] = 0;
          }
        } else {
          // Weekend days
          workingPattern[`${day}_hours`] = '0:00';
          workingPattern[`${day}_sessions`] = 0;
        }
      });

      workingPattern.total_hours = totalHours;
      workingPattern.total_sessions = totalSessions;

      // Update or insert working pattern
      const { data: existingPattern } = await window.supabase
        .from('3_staff_working_patterns')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existingPattern) {
        const { error: patternError } = await window.supabase
          .from('3_staff_working_patterns')
          .update(workingPattern)
          .eq('user_id', userId);

        if (patternError) {
          console.error('Error updating working pattern:', patternError);
          alert('Error updating working pattern: ' + patternError.message);
          return;
        }
      } else {
        const { error: patternError } = await window.supabase
          .from('3_staff_working_patterns')
          .insert(workingPattern);

        if (patternError) {
          console.error('Error inserting working pattern:', patternError);
          alert('Error inserting working pattern: ' + patternError.message);
          return;
        }
      }

      // Update entitlement
      const multiplierInput = row.querySelector('.multiplier-input');
      const overrideInput = row.querySelector('.override-input');
      const multiplier = parseFloat(multiplierInput.value) || 10;

      let override = null;
      if (overrideInput.value) {
        if (isGP) {
          override = parseFloat(overrideInput.value);
        } else {
          const [h, m] = overrideInput.value.split(':');
          override = parseFloat(h) + parseFloat(m || 0) / 60;
        }
      }

      const weeklyValue = isGP ? totalSessions : totalHours;
      const entitlementData = {
        staff_id: parseInt(staffId),
        year: new Date().getFullYear(),
        weekly_hours: isGP ? 0 : totalHours,
        weekly_sessions: isGP ? totalSessions : 0,
        multiplier: multiplier,
        override: override
      };

      // Check if entitlement exists
      const { data: existingEnt } = await window.supabase
        .from('2_staff_entitlements')
        .select('id')
        .eq('staff_id', staffId)
        .eq('year', new Date().getFullYear())
        .single();

      if (existingEnt) {
        const { error: entError } = await window.supabase
          .from('2_staff_entitlements')
          .update(entitlementData)
          .eq('id', existingEnt.id);

        if (entError) {
          console.error('Error updating entitlement:', entError);
          alert('Error updating entitlement: ' + entError.message);
          return;
        }
      } else {
        const { error: entError } = await window.supabase
          .from('2_staff_entitlements')
          .insert(entitlementData);

        if (entError) {
          console.error('Error inserting entitlement:', entError);
          alert('Error inserting entitlement: ' + entError.message);
          return;
        }
      }

      // Show success feedback
      button.textContent = 'Saved!';
      button.style.background = 'var(--success)';
      setTimeout(() => {
        button.textContent = 'Save';
        button.style.background = '';
      }, 2000);

      console.log('Successfully saved entitlement and working pattern');

    } catch (error) {
      console.error('Error saving:', error);
      alert('Error saving data: ' + error.message);
    }
  }

  // Update calculations when inputs change
  function updateCalculations(input) {
    const row = input.closest('tr');
    const staffId = row.dataset.staffId;
    const isGP = row.dataset.isGp === 'true';

    // Calculate weekly total
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    let weeklyTotal = 0;

    days.forEach(day => {
      const dayInput = row.querySelector(`.day-input[data-day="${day}"]`);
      if (dayInput) {
        if (isGP) {
          weeklyTotal += parseFloat(dayInput.value) || 0;
        } else {
          const [h, m] = dayInput.value.split(':');
          weeklyTotal += parseFloat(h) + parseFloat(m || 0) / 60;
        }
      }
    });

    // Update weekly total display
    const weeklySpan = document.getElementById(`weekly-total-${staffId}`);
    if (weeklySpan) {
      if (isGP) {
        weeklySpan.textContent = `${weeklyTotal} sessions`;
      } else {
        const hours = Math.floor(weeklyTotal);
        const minutes = Math.round((weeklyTotal - hours) * 60);
        weeklySpan.textContent = `${hours}:${String(minutes).padStart(2, '0')} hrs`;
      }
    }

    // Update calculated annual
    const multiplierInput = row.querySelector('.multiplier-input');
    const multiplier = parseFloat(multiplierInput.value) || 10;
    const calculated = weeklyTotal * multiplier;

    const calculatedSpan = document.getElementById(`calculated-${staffId}`);
    if (calculatedSpan) {
      if (isGP) {
        calculatedSpan.textContent = `${calculated} sessions`;
      } else {
        const hours = Math.floor(calculated);
        const minutes = Math.round((calculated - hours) * 60);
        calculatedSpan.textContent = `${hours}:${String(minutes).padStart(2, '0')} hrs`;
      }
    }

    // Update final entitlement
    const overrideInput = row.querySelector('.override-input');
    let final = calculated;
    if (overrideInput.value) {
      if (isGP) {
        final = parseFloat(overrideInput.value);
      } else {
        const [h, m] = overrideInput.value.split(':');
        final = parseFloat(h) + parseFloat(m || 0) / 60;
      }
    }

    const finalSpan = document.getElementById(`final-${staffId}`);
    if (finalSpan) {
      if (isGP) {
        finalSpan.textContent = `${final} sessions`;
      } else {
        const hours = Math.floor(final);
        const minutes = Math.round((final - hours) * 60);
        finalSpan.textContent = `${hours}:${String(minutes).padStart(2, '0')} hrs`;
      }
    }
  }