/**
 * Partner Staff Implementation for EMIS Dashboard
 * 
 * This file contains all JavaScript functions needed for partner staff management.
 * Add these functions to your emis_reporting.html file within the existing <script> section.
 */

// ========================================
// 1. LOAD STAFF LIST (for Settings Page)
// ========================================

/**
 * Load all unique staff members from appointments
 * Called when Partner Staff accordion section is opened
 */
async function loadPartnerStaffList() {
  try {
    document.getElementById('partner-staff-loading').style.display = 'block';
    document.getElementById('partner-staff-list').style.display = 'none';
    document.getElementById('partner-staff-empty').style.display = 'none';

    // Query distinct staff from appointments (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: appointments, error } = await supabase
      .from('emis_data')
      .select('staff')
      .eq('site_id', currentSiteId)
      .gte('appointment_datetime', ninetyDaysAgo.toISOString())
      .not('staff', 'is', null);

    if (error) throw error;

    // Get unique staff names
    const uniqueStaff = [...new Set(appointments.map(a => a.staff))].sort();

    if (uniqueStaff.length === 0) {
      document.getElementById('partner-staff-loading').style.display = 'none';
      document.getElementById('partner-staff-empty').style.display = 'block';
      return;
    }

    // Get currently selected partners from thresholdRules
    const currentPartners = window.thresholdRules?.partners || [];

    // Build checkbox list
    const listContainer = document.getElementById('partner-staff-list');
    listContainer.innerHTML = uniqueStaff.map(staff => `
      <div class="form-check" style="padding:12px;border-radius:8px;margin-bottom:8px;background:#f8fafc;border:1px solid #e2e8f0;">
        <input class="form-check-input partner-checkbox" type="checkbox" value="${staff}" id="partner-${staff.replace(/\s+/g, '-')}"
          ${currentPartners.includes(staff) ? 'checked' : ''}>
        <label class="form-check-label" for="partner-${staff.replace(/\s+/g, '-')}" style="font-weight:500;cursor:pointer;">
          ${staff}
        </label>
      </div>
    `).join('');

    document.getElementById('partner-staff-loading').style.display = 'none';
    document.getElementById('partner-staff-list').style.display = 'block';

  } catch (error) {
    console.error('Error loading staff list:', error);
    document.getElementById('partner-staff-loading').innerHTML = `
      <div style="color:#ef4444;"><i class="bi bi-exclamation-triangle"></i> Failed to load staff list</div>
    `;
  }
}

// ========================================
// 2. SAVE PARTNER CONFIGURATION
// ========================================

/**
 * Save partner selections to database
 * Update the existing rules-save click handler to include this
 */
async function savePartnerConfiguration() {
  // Get selected partners
  const checkboxes = document.querySelectorAll('.partner-checkbox:checked');
  const selectedPartners = Array.from(checkboxes).map(cb => cb.value);

  const partnerConfig = {
    partners: selectedPartners
  };

  const { error } = await supabase
    .from('emis_rules')
    .upsert({
      site_id: currentSiteId,
      rule_type: 'partner_staff',
      rule_config: partnerConfig,
      created_by_email: currentUserEmail,
      is_active: true,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'site_id,rule_type'
    });

  if (error) throw error;

  // Update global thresholdRules
  window.thresholdRules.partners = selectedPartners;
  
  return true;
}

// ========================================
// 3. LOAD PARTNER CONFIGURATION ON PAGE LOAD
// ========================================

/**
 * Update the existing loadThresholds() function to include partner data
 * Add this inside the function after loading OTD and Not BKD rules
 */
async function loadPartnerConfigIntoGlobal() {
  const { data: partnerRule, error } = await supabase
    .from('emis_rules')
    .select('rule_config')
    .eq('site_id', currentSiteId)
    .eq('rule_type', 'partner_staff')
    .eq('is_active', true)
    .single();

  if (!error && partnerRule) {
    window.thresholdRules.partners = partnerRule.rule_config.partners || [];
  } else {
    window.thresholdRules.partners = [];
  }
}

// ========================================
// 4. CHECK PARTNER PRESENCE IN DASHBOARD
// ========================================

/**
 * Check if any partner is working on a specific date
 * Add this to your loadAppointmentsForDate() function
 */
async function checkPartnerPresence(date) {
  // If no partners configured, return false
  if (!window.thresholdRules?.partners || window.thresholdRules.partners.length === 0) {
    return false;
  }

  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from('emis_data')
    .select('staff')
    .eq('site_id', currentSiteId)
    .gte('appointment_datetime', startDate.toISOString())
    .lte('appointment_datetime', endDate.toISOString())
    .in('staff', window.thresholdRules.partners);

  if (error) {
    console.error('Error checking partner presence:', error);
    return false;
  }

  return data && data.length > 0;
}

// ========================================
// 5. UPDATE loadAppointmentsForDate FUNCTION
// ========================================

/**
 * REPLACE your existing loadAppointmentsForDate function with this updated version
 * that includes partner checking
 */
async function loadAppointmentsForDate(date) {
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from('emis_data')
    .select('appointment_type, duty, staff')
    .eq('site_id', currentSiteId)
    .gte('appointment_datetime', startDate.toISOString())
    .lte('appointment_datetime', endDate.toISOString());

  if (error) {
    console.error('Error loading appointments:', error);
    return { otd: 0, notBkd: 0, hasDuty: false, hasPartner: false };
  }

  let otd = 0;
  let notBkd = 0;
  let hasDuty = false;
  let hasPartner = false;

  // Check partner presence
  const partners = window.thresholdRules?.partners || [];
  
  data.forEach(apt => {
    if (apt.appointment_type === 'OTD') otd++;
    if (apt.appointment_type === 'Not BKD') notBkd++;
    if (apt.duty === true || apt.duty === 'true') hasDuty = true;
    
    // Check if this staff member is a partner
    if (partners.includes(apt.staff)) {
      hasPartner = true;
    }
  });

  return { otd, notBkd, hasDuty, hasPartner };
}

// ========================================
// 6. UPDATE createDayCard FUNCTION
// ========================================

/**
 * Update the Partner In section in createDayCard to use real data
 * FIND this line in your createDayCard function:
 *   <span class="badge bg-success">✓</span>
 * REPLACE the entire Partner In row with:
 */
function getPartnerInHTML(metrics) {
  const hasPartner = metrics.hasPartner;
  const badgeClass = hasPartner ? 'bg-success' : 'bg-danger';
  const icon = hasPartner ? '✓' : '✗';
  const text = hasPartner ? 'Yes' : 'No';
  
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;border-radius:6px;background:#f8fafc;">
      <span style="font-size:12px;color:#64748b;">Partner In:</span>
      <span class="badge ${badgeClass}">${icon}</span>
    </div>
  `;
}

// ========================================
// 7. EVENT HANDLERS
// ========================================

/**
 * Add event listener for when Partner Staff section is expanded
 * Add this in your DOMContentLoaded or initialization section
 */
document.getElementById('partnerSection')?.addEventListener('shown.bs.collapse', function() {
  loadPartnerStaffList();
});

/**
 * Update your existing rules-save button handler to include partner saving
 * FIND your current handler and ADD the savePartnerConfiguration() call:
 */
document.getElementById('rules-save').addEventListener('click', async () => {
  try {
    document.getElementById('rules-save').disabled = true;
    document.getElementById('rules-save').innerHTML = '<span class="spinner-border spinner-border-sm"></span> Saving...';

    // ... existing threshold saving code ...

    // ADD THIS: Save partner configuration
    await savePartnerConfiguration();

    document.getElementById('rules-success').style.display = 'block';
    setTimeout(() => {
      document.getElementById('rules-success').style.display = 'none';
    }, 5000);

  } catch (error) {
    console.error('Error saving settings:', error);
    alert('Failed to save settings: ' + error.message);
  } finally {
    document.getElementById('rules-save').disabled = false;
    document.getElementById('rules-save').innerHTML = '<i class="bi bi-check-circle"></i> Save All Settings';
  }
});

// ========================================
// 8. UPDATE INITIALIZATION
// ========================================

/**
 * Update your loadThresholds() function to include partner loading
 * ADD this at the end of your existing loadThresholds() function:
 */
// Inside loadThresholds(), after loading OTD and Not BKD rules:
await loadPartnerConfigIntoGlobal();

/**
 * SUMMARY OF INTEGRATION STEPS:
 * 
 * 1. Replace Settings page HTML using SETTINGS_PAGE_UPDATE.md
 * 2. Add all functions from this file to <script> section
 * 3. Update loadAppointmentsForDate() to return hasPartner
 * 4. Update createDayCard() Partner In section to use getPartnerInHTML(metrics)
 * 5. Update loadThresholds() to call loadPartnerConfigIntoGlobal()
 * 6. Update rules-save handler to call savePartnerConfiguration()
 * 7. Add event listener for partnerSection accordion expand
 * 8. Run the SQL from SETTINGS_PAGE_UPDATE.md in Supabase
 * 9. Test: Settings page loads staff, saves selections, Dashboard shows partner status
 */
