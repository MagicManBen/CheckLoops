# Settings Page Replacement Instructions

Replace the entire Settings Page section (from `<!-- Settings Page -->` to `</section>`) with the code below.

This new version includes:
1. Collapsible accordion sections
2. Partner Staff selection
3. Updated navigation (Settings instead of Rules & Alerts)

## Complete Settings Page HTML:

```html
      <!-- Settings Page -->
      <section id="page-rules-alerts" class="page-view" style="display:none;">
        <div style="background:white;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);margin-top:14px;">
          <h2 style="font-size:24px;font-weight:600;color:#1d1d1f;margin-bottom:8px;">
            <i class="bi bi-gear" style="margin-right:8px;"></i>Dashboard Settings
          </h2>
          <p style="color:#64748b;margin-bottom:32px;">Configure thresholds, partner availability, and other dashboard settings.</p>
          
          <div id="rules-loading" style="text-align:center;padding:40px;">
            <div class="spinner" style="width:40px;height:40px;margin:0 auto;"></div>
            <p style="margin-top:16px;color:#64748b;">Loading settings...</p>
          </div>
          
          <div id="rules-content" style="display:none;">
            <!-- Accordion Sections -->
            <div class="accordion" id="settingsAccordion">
              
              <!-- Section 1: Appointment Thresholds -->
              <div class="accordion-item" style="border:1px solid #e5e7eb;border-radius:12px;margin-bottom:16px;overflow:hidden;">
                <h2 class="accordion-header">
                  <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#thresholdSection" aria-expanded="true" style="background:#f9fafb;font-weight:600;padding:20px;">
                    <i class="bi bi-speedometer2" style="margin-right:12px;font-size:20px;color:#3b82f6;"></i>
                    Appointment Thresholds
                  </button>
                </h2>
                <div id="thresholdSection" class="accordion-collapse collapse show" data-bs-parent="#settingsAccordion">
                  <div class="accordion-body" style="padding:24px;">
                    
                    <!-- OTD Thresholds -->
                    <div style="border-radius:8px;padding:20px;margin-bottom:20px;background:white;border:1px solid #e5e7eb;">
                      <h4 style="font-size:16px;font-weight:600;color:#1d1d1f;margin-bottom:12px;">
                        <span style="background:#ffcc00;color:#1d1d1f;padding:4px 12px;border-radius:6px;margin-right:8px;font-size:13px;">OTD</span>
                        On The Day Thresholds
                      </h4>
                      <p style="color:#64748b;font-size:14px;margin-bottom:16px;">Set minimum appointment counts for each day.</p>
                      
                      <div class="row g-3">
                        <div class="col-md-4">
                          <label class="form-label" style="font-weight:500;font-size:14px;">Monday</label>
                          <input type="number" id="otd-monday" class="form-control" min="0" value="25">
                        </div>
                        <div class="col-md-4">
                          <label class="form-label" style="font-weight:500;font-size:14px;">Tuesday</label>
                          <input type="number" id="otd-tuesday" class="form-control" min="0" value="20">
                        </div>
                        <div class="col-md-4">
                          <label class="form-label" style="font-weight:500;font-size:14px;">Wednesday</label>
                          <input type="number" id="otd-wednesday" class="form-control" min="0" value="20">
                        </div>
                        <div class="col-md-4">
                          <label class="form-label" style="font-weight:500;font-size:14px;">Thursday</label>
                          <input type="number" id="otd-thursday" class="form-control" min="0" value="20">
                        </div>
                        <div class="col-md-4">
                          <label class="form-label" style="font-weight:500;font-size:14px;">Friday</label>
                          <input type="number" id="otd-friday" class="form-control" min="0" value="20">
                        </div>
                      </div>
                    </div>
                    
                    <!-- Not BKD Thresholds -->
                    <div style="border-radius:8px;padding:20px;margin-bottom:20px;background:white;border:1px solid #e5e7eb;">
                      <h4 style="font-size:16px;font-weight:600;color:#1d1d1f;margin-bottom:12px;">
                        <span style="background:#ffcc00;color:#1d1d1f;padding:4px 12px;border-radius:6px;margin-right:8px;font-size:13px;">Not BKD</span>
                        Not Booked Thresholds
                      </h4>
                      <p style="color:#64748b;font-size:14px;margin-bottom:16px;">Set minimum available appointment counts for each day.</p>
                      
                      <div class="row g-3">
                        <div class="col-md-4">
                          <label class="form-label" style="font-weight:500;font-size:14px;">Monday</label>
                          <input type="number" id="notbkd-monday" class="form-control" min="0" value="25">
                        </div>
                        <div class="col-md-4">
                          <label class="form-label" style="font-weight:500;font-size:14px;">Tuesday</label>
                          <input type="number" id="notbkd-tuesday" class="form-control" min="0" value="20">
                        </div>
                        <div class="col-md-4">
                          <label class="form-label" style="font-weight:500;font-size:14px;">Wednesday</label>
                          <input type="number" id="notbkd-wednesday" class="form-control" min="0" value="20">
                        </div>
                        <div class="col-md-4">
                          <label class="form-label" style="font-weight:500;font-size:14px;">Thursday</label>
                          <input type="number" id="notbkd-thursday" class="form-control" min="0" value="20">
                        </div>
                        <div class="col-md-4">
                          <label class="form-label" style="font-weight:500;font-size:14px;">Friday</label>
                          <input type="number" id="notbkd-friday" class="form-control" min="0" value="20">
                        </div>
                      </div>
                    </div>
                    
                    <!-- Gradient Settings -->
                    <div style="border-radius:8px;padding:20px;background:white;border:1px solid #e5e7eb;">
                      <h4 style="font-size:16px;font-weight:600;color:#1d1d1f;margin-bottom:12px;">
                        <i class="bi bi-palette" style="margin-right:8px;"></i>Color Gradient Settings
                      </h4>
                      <p style="color:#64748b;font-size:14px;margin-bottom:16px;">Configure how colors transition based on percentage of threshold met.</p>
                      
                      <div class="row g-3">
                        <div class="col-md-6">
                          <div style="background:#fef2f2;border-radius:8px;padding:16px;border:1px solid #fecaca;">
                            <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                              <div style="width:24px;height:24px;background:#ff3b30;border-radius:4px;"></div>
                              <span style="font-weight:500;">Red (Critical)</span>
                            </div>
                            <label class="form-label" style="font-size:13px;">Show red when below:</label>
                            <div class="input-group input-group-sm">
                              <input type="number" id="gradient-red" class="form-control" min="0" max="100" value="80">
                              <span class="input-group-text">% of threshold</span>
                            </div>
                          </div>
                        </div>
                        <div class="col-md-6">
                          <div style="background:#f0fdf4;border-radius:8px;padding:16px;border:1px solid #bbf7d0;">
                            <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                              <div style="width:24px;height:24px;background:#34c759;border-radius:4px;"></div>
                              <span style="font-weight:500;">Green (Good)</span>
                            </div>
                            <label class="form-label" style="font-size:13px;">Show green when above:</label>
                            <div class="input-group input-group-sm">
                              <input type="number" id="gradient-green" class="form-control" min="0" max="200" value="100">
                              <span class="input-group-text">% of threshold</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p style="color:#94a3b8;font-size:12px;margin-top:12px;font-style:italic;">
                        <i class="bi bi-info-circle"></i> Yellow will be shown between the red and green percentages.
                      </p>
                    </div>
                    
                  </div>
                </div>
              </div>
              
              <!-- Section 2: Partner Staff -->
              <div class="accordion-item" style="border:1px solid #e5e7eb;border-radius:12px;margin-bottom:16px;overflow:hidden;">
                <h2 class="accordion-header">
                  <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#partnerSection" aria-expanded="false" style="background:#f9fafb;font-weight:600;padding:20px;">
                    <i class="bi bi-people" style="margin-right:12px;font-size:20px;color:#10b981;"></i>
                    Partner Staff
                  </button>
                </h2>
                <div id="partnerSection" class="accordion-collapse collapse" data-bs-parent="#settingsAccordion">
                  <div class="accordion-body" style="padding:24px;">
                    <p style="color:#64748b;font-size:14px;margin-bottom:20px;">Select which staff members are considered partners. The dashboard will show a green ✓ if at least one partner is working that day.</p>
                    
                    <div id="partner-staff-loading" style="text-align:center;padding:20px;">
                      <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                      <span style="margin-left:10px;color:#64748b;">Loading staff list...</span>
                    </div>
                    
                    <div id="partner-staff-list" style="display:none;max-height:400px;overflow-y:auto;">
                      <!-- Staff checkboxes will be populated here -->
                    </div>
                    
                    <div id="partner-staff-empty" style="display:none;text-align:center;padding:40px;color:#94a3b8;">
                      <i class="bi bi-inbox" style="font-size:3rem;"></i>
                      <p style="margin-top:16px;">No staff members found in appointment data.</p>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
            
            <!-- Save Button -->
            <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:24px;">
              <button id="rules-cancel" class="btn btn-outline-secondary">
                <i class="bi bi-x-circle"></i> Cancel
              </button>
              <button id="rules-save" class="btn btn-primary" style="min-width:120px;">
                <i class="bi bi-check-circle"></i> Save All Settings
              </button>
            </div>
            
            <div id="rules-success" style="display:none;margin-top:16px;padding:12px;background:#d1fae5;color:#065f46;border-radius:8px;text-align:center;">
              <i class="bi bi-check-circle"></i> Settings saved successfully! Refresh the Dashboard to see changes.
            </div>
          </div>
        </div>
      </section>
```

## SQL to run in Supabase:

```sql
-- Add partner configuration to emis_rules table
INSERT INTO public.emis_rules (site_id, rule_type, rule_config, created_by_email, is_active)
VALUES 
  (2, 'partner_staff', '{"partners": []}'::jsonb, 'system@checkloops.com', true)
ON CONFLICT (site_id, rule_type) DO NOTHING;
```

Due to file size limitations, I've created this instruction file. The complete implementation requires:
1. HTML replacement (above)
2. JavaScript updates for partner loading/saving
3. Dashboard partner checking logic

Would you like me to continue with the JavaScript implementation in separate files?
