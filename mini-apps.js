// Mini App Interactive Elements
document.addEventListener('DOMContentLoaded', function() {
  // Initialize all interactive elements
  initComplianceApp();
  initTrainingApp();
  initHolidayApp();
  
  // Initialize modals
  document.querySelectorAll('.mini-modal-close').forEach(btn => {
    btn.addEventListener('click', function() {
      closeAllModals();
    });
  });
  
  // Close modals when clicking outside content
  document.querySelectorAll('.mini-modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        closeAllModals();
      }
    });
  });
});

function closeAllModals() {
  document.querySelectorAll('.mini-modal').forEach(modal => {
    modal.classList.remove('active');
  });
}

// Compliance Mini App
function initComplianceApp() {
  // Chart animation
  setTimeout(() => {
    const completeSegment = document.querySelector('.chart-segment.complete');
    const dueSegment = document.querySelector('.chart-segment.due');
    const overdueSegment = document.querySelector('.chart-segment.overdue');
    
    if (completeSegment) completeSegment.style.strokeDasharray = '47.1 100';
    if (dueSegment) dueSegment.style.strokeDasharray = '28.3 100'; 
    if (overdueSegment) overdueSegment.style.strokeDasharray = '15.7 100';
    
    // Animate progress bars
    document.querySelectorAll('.mini-progress-bar').forEach((bar, index) => {
      const values = [75, 45, 90];
      setTimeout(() => {
        bar.style.width = values[index] + '%';
      }, 300 * (index + 1));
    });
  }, 500);
  
  // View Tasks button
  const viewTasksBtn = document.getElementById('view-compliance-tasks');
  if (viewTasksBtn) {
    viewTasksBtn.addEventListener('click', function() {
      const modal = document.getElementById('compliance-tasks-modal');
      modal.classList.add('active');
      
      // Simulate loading
      const modalBody = modal.querySelector('.mini-modal-body');
      modalBody.innerHTML = `
        <div class="mini-loading">
          <div class="mini-spinner"></div>
          <p>Loading tasks...</p>
        </div>
      `;
      
      // Simulate API response
      setTimeout(() => {
        modalBody.innerHTML = `
          <div class="mini-tasks-list">
            <div class="mini-task-item">
              <div class="mini-task-checkbox"></div>
              <div class="mini-task-details">
                <div class="mini-task-title">Update Infection Control Policy</div>
                <div class="mini-task-meta">Due in 3 days</div>
              </div>
              <div class="mini-task-priority high">High</div>
            </div>
            <div class="mini-task-item">
              <div class="mini-task-checkbox"></div>
              <div class="mini-task-details">
                <div class="mini-task-title">Review Emergency Procedures</div>
                <div class="mini-task-meta">Due in 7 days</div>
              </div>
              <div class="mini-task-priority medium">Medium</div>
            </div>
            <div class="mini-task-item">
              <div class="mini-task-checkbox checked"></div>
              <div class="mini-task-details">
                <div class="mini-task-title">Complete Staff Training Records</div>
                <div class="mini-task-meta">Completed yesterday</div>
              </div>
              <div class="mini-task-priority completed">Completed</div>
            </div>
            <div class="mini-task-item">
              <div class="mini-task-checkbox"></div>
              <div class="mini-task-details">
                <div class="mini-task-title">Update GDPR Documentation</div>
                <div class="mini-task-meta">Due in 14 days</div>
              </div>
              <div class="mini-task-priority medium">Medium</div>
            </div>
            <div class="mini-task-item">
              <div class="mini-task-checkbox"></div>
              <div class="mini-task-details">
                <div class="mini-task-title">CQC Inspection Preparation</div>
                <div class="mini-task-meta">Due in 5 days</div>
              </div>
              <div class="mini-task-priority high">High</div>
            </div>
          </div>
          <div class="mini-tasks-actions">
            <div class="mini-app-button primary">Complete Selected</div>
            <div class="mini-app-button secondary">Add New Task</div>
          </div>
        `;
        
        // Add click events to checkboxes
        document.querySelectorAll('.mini-task-checkbox').forEach(checkbox => {
          checkbox.addEventListener('click', function() {
            this.classList.toggle('checked');
            const priorityEl = this.closest('.mini-task-item').querySelector('.mini-task-priority');
            if (this.classList.contains('checked')) {
              priorityEl.className = 'mini-task-priority completed';
              priorityEl.textContent = 'Completed';
            } else {
              const originalPriority = priorityEl.textContent === 'High' ? 'high' : 'medium';
              priorityEl.className = 'mini-task-priority ' + originalPriority;
              priorityEl.textContent = originalPriority.charAt(0).toUpperCase() + originalPriority.slice(1);
            }
          });
        });
      }, 1500);
    });
  }
  
  // Generate Report button
  const generateReportBtn = document.getElementById('generate-compliance-report');
  if (generateReportBtn) {
    generateReportBtn.addEventListener('click', function() {
      const modal = document.getElementById('compliance-report-modal');
      modal.classList.add('active');
      
      // Simulate loading
      const modalBody = modal.querySelector('.mini-modal-body');
      modalBody.innerHTML = `
        <div class="mini-loading">
          <div class="mini-spinner"></div>
          <p>Generating report...</p>
        </div>
      `;
      
      // Simulate API response
      setTimeout(() => {
        modalBody.innerHTML = `
          <div class="mini-report-complete">
            <div class="mini-success-icon">✓</div>
            <h5>Compliance Report Generated</h5>
            <p>Your compliance report has been successfully generated and is ready to download.</p>
            <div class="mini-report-preview">
              <div class="mini-report-icon">📄</div>
              <div class="mini-report-info">
                <div class="mini-report-name">June_2023_Compliance_Report.pdf</div>
                <div class="mini-report-size">1.2 MB</div>
              </div>
            </div>
            <div class="mini-app-button primary">Download Report</div>
          </div>
        `;
      }, 2000);
    });
  }
}

// Training Mini App
function initTrainingApp() {
  // Training course click handlers
  document.querySelectorAll('.mini-course-item').forEach(item => {
    item.addEventListener('click', function() {
      const modal = document.getElementById('training-course-modal');
      modal.classList.add('active');
      
      // Simulate loading
      const modalBody = modal.querySelector('.mini-modal-body');
      modalBody.innerHTML = `
        <div class="mini-loading">
          <div class="mini-spinner"></div>
          <p>Loading course details...</p>
        </div>
      `;
      
      // Simulate API response
      setTimeout(() => {
        modalBody.innerHTML = `
          <div class="mini-course-details">
            <div class="mini-course-detail-icon">🔒</div>
            <div class="mini-course-detail-info">
              <div class="mini-course-meta">
                <span class="mini-course-type">Mandatory</span>
                <span class="mini-course-duration">45 minutes</span>
              </div>
              <h3 class="mini-course-name">Information Governance Training</h3>
              <div class="mini-course-progress-label">Progress: 75% Complete</div>
              <div class="mini-progress-container">
                <div class="mini-progress-bar" style="width: 75%"></div>
              </div>
              <div class="mini-course-expires">Expires: 21 Dec 2023</div>
            </div>
          </div>
          
          <div class="mini-course-content">
            <h5>Course Modules</h5>
            <div class="mini-course-modules">
              <div class="mini-course-module completed">
                <div class="mini-module-checkbox checked"></div>
                <div class="mini-module-info">
                  <div class="mini-module-name">1. Introduction to Information Governance</div>
                  <div class="mini-module-status">Completed</div>
                </div>
              </div>
              <div class="mini-course-module completed">
                <div class="mini-module-checkbox checked"></div>
                <div class="mini-module-info">
                  <div class="mini-module-name">2. Data Protection Principles</div>
                  <div class="mini-module-status">Completed</div>
                </div>
              </div>
              <div class="mini-course-module completed">
                <div class="mini-module-checkbox checked"></div>
                <div class="mini-module-info">
                  <div class="mini-module-name">3. Patient Confidentiality</div>
                  <div class="mini-module-status">Completed</div>
                </div>
              </div>
              <div class="mini-course-module active">
                <div class="mini-module-checkbox"></div>
                <div class="mini-module-info">
                  <div class="mini-module-name">4. Information Security</div>
                  <div class="mini-module-status">In Progress</div>
                </div>
              </div>
              <div class="mini-course-module">
                <div class="mini-module-checkbox"></div>
                <div class="mini-module-info">
                  <div class="mini-module-name">5. Final Assessment</div>
                  <div class="mini-module-status">Not Started</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="mini-modal-actions">
            <div class="mini-app-button primary">Continue Course</div>
            <div class="mini-app-button secondary">View Certificate</div>
          </div>
        `;
        
        // Add click events to modules
        document.querySelectorAll('.mini-course-module').forEach(module => {
          module.addEventListener('click', function() {
            // Only allow clicking uncompleted modules
            if (!this.classList.contains('completed')) {
              document.querySelectorAll('.mini-course-module').forEach(m => {
                m.classList.remove('active');
              });
              this.classList.add('active');
            }
          });
        });
      }, 1000);
    });
  });
  
  // Filter tab handlers
  document.querySelectorAll('.mini-filter-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.mini-filter-tab').forEach(t => {
        t.classList.remove('active');
      });
      this.classList.add('active');
    });
  });
}

// Holiday Mini App
function initHolidayApp() {
  // Calendar day click handlers
  document.querySelectorAll('.mini-day:not(.prev-month):not(.next-month)').forEach(day => {
    day.addEventListener('click', function() {
      if (!this.classList.contains('holiday') && !this.classList.contains('holiday-pending')) {
        const modal = document.getElementById('holiday-request-modal');
        modal.classList.add('active');
      }
    });
  });
  
  // Holiday request button
  const requestHolidayBtn = document.getElementById('request-holiday-btn');
  if (requestHolidayBtn) {
    requestHolidayBtn.addEventListener('click', function() {
      const modal = document.getElementById('holiday-request-modal');
      modal.classList.add('active');
    });
  }
  
  // Holiday approvals button
  const approveHolidayBtn = document.getElementById('approve-holiday-btn');
  if (approveHolidayBtn) {
    approveHolidayBtn.addEventListener('click', function() {
      const modal = document.getElementById('holiday-approval-modal');
      modal.classList.add('active');
      
      // Simulate loading
      const modalBody = modal.querySelector('.mini-modal-body');
      modalBody.innerHTML = `
        <div class="mini-loading">
          <div class="mini-spinner"></div>
          <p>Loading approval requests...</p>
        </div>
      `;
      
      // Simulate API response
      setTimeout(() => {
        modalBody.innerHTML = `
          <div class="mini-approval-list">
            <div class="mini-approval-item">
              <div class="mini-approval-info">
                <div class="mini-approval-name">Dr. Sarah Johnson</div>
                <div class="mini-approval-dates">15 Jul - 22 Jul 2023 (5 days)</div>
                <div class="mini-approval-type">Annual Leave</div>
              </div>
              <div class="mini-approval-actions">
                <button class="mini-btn-approve">Approve</button>
                <button class="mini-btn-deny">Deny</button>
              </div>
            </div>
            <div class="mini-approval-item">
              <div class="mini-approval-info">
                <div class="mini-approval-name">Nurse Mike Wilson</div>
                <div class="mini-approval-dates">3 Aug - 4 Aug 2023 (2 days)</div>
                <div class="mini-approval-type">Training Leave</div>
              </div>
              <div class="mini-approval-actions">
                <button class="mini-btn-approve">Approve</button>
                <button class="mini-btn-deny">Deny</button>
              </div>
            </div>
            <div class="mini-approval-item">
              <div class="mini-approval-info">
                <div class="mini-approval-name">Receptionist Emma Davis</div>
                <div class="mini-approval-dates">28 Jul 2023 (1 day)</div>
                <div class="mini-approval-type">Sick Leave</div>
              </div>
              <div class="mini-approval-actions">
                <button class="mini-btn-approve">Approve</button>
                <button class="mini-btn-deny">Deny</button>
              </div>
            </div>
          </div>
        `;
        
        // Add approval handlers
        document.querySelectorAll('.mini-btn-approve').forEach(btn => {
          btn.addEventListener('click', function() {
            const item = this.closest('.mini-approval-item');
            item.style.background = '#f0fdf4'; // Light green background
            item.querySelector('.mini-approval-actions').innerHTML = '<span style="color: var(--success); font-weight: 600;">Approved</span>';
          });
        });
        
        document.querySelectorAll('.mini-btn-deny').forEach(btn => {
          btn.addEventListener('click', function() {
            const item = this.closest('.mini-approval-item');
            item.style.background = '#fef2f2'; // Light red background
            item.querySelector('.mini-approval-actions').innerHTML = '<span style="color: var(--danger); font-weight: 600;">Denied</span>';
          });
        });
      }, 1500);
    });
  }
  
  // Submit holiday request form
  const submitHolidayForm = document.getElementById('submit-holiday-form');
  if (submitHolidayForm) {
    submitHolidayForm.addEventListener('click', function() {
      // Simulate form processing
      this.textContent = 'Processing...';
      this.disabled = true;
      
      // Simulate API response
      setTimeout(() => {
        const modal = document.getElementById('holiday-request-modal');
        const modalBody = modal.querySelector('.mini-modal-body');
        
        modalBody.innerHTML = `
          <div class="mini-report-complete">
            <div class="mini-success-icon">✓</div>
            <h5>Leave Request Submitted</h5>
            <p>Your request has been submitted and is pending approval.</p>
            <p style="margin-top: 1rem;">A notification will be sent to your manager, and you'll receive an email once your request has been processed.</p>
          </div>
        `;
        
        // Update calendar to show the pending holiday
        setTimeout(() => {
          // For demo purposes, we'll add a class to a random day
          const availableDays = document.querySelectorAll('.mini-day:not(.prev-month):not(.next-month):not(.holiday):not(.holiday-pending)');
          if (availableDays.length > 0) {
            const randomDay = availableDays[Math.floor(Math.random() * availableDays.length)];
            randomDay.classList.add('holiday-pending');
          }
          
          closeAllModals();
        }, 2500);
      }, 1500);
    });
  }
}