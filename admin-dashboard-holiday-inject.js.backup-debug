// admin-dashboard-holiday-inject.js
// Script to inject the holiday fix into the admin dashboard

// First, check if the admin-dashboard-holiday-fix.js file is already loaded
let isFixScriptLoaded = false;
document.querySelectorAll('script').forEach(script => {
  if (script.src && script.src.includes('admin-dashboard-holiday-fix.js')) {
    isFixScriptLoaded = true;
  }
});

// If not loaded, add it to the document
if (!isFixScriptLoaded) {
  console.log('Injecting holiday fix script...');
  const script = document.createElement('script');
  script.src = 'admin-dashboard-holiday-fix.js';
  document.body.appendChild(script);
  
  // Create a small notification to show the script was loaded
  const notification = document.createElement('div');
  notification.style.position = 'fixed';
  notification.style.bottom = '20px';
  notification.style.right = '20px';
  notification.style.backgroundColor = 'rgba(0, 150, 0, 0.8)';
  notification.style.color = 'white';
  notification.style.padding = '10px 15px';
  notification.style.borderRadius = '5px';
  notification.style.zIndex = '9999';
  notification.style.fontSize = '14px';
  notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  notification.textContent = 'Holiday data fix applied! ✓';
  
  // Add notification to document
  document.body.appendChild(notification);
  
  // Remove notification after 5 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.5s ease-out';
    setTimeout(() => notification.remove(), 500);
  }, 5000);
  
  // Force refresh of holiday data when the script loads
  setTimeout(() => {
    if (window.refreshHolidayData) {
      window.refreshHolidayData();
    }
  }, 1500);
}

// Check if the Refresh Data button already exists in the header
const existingButton = document.querySelector('#refresh-holiday-data-btn');
if (!existingButton) {
  // Find the header section where we want to add our button
  const header = document.querySelector('.entitlement-management-header') || 
                 document.querySelector('.page-header') ||
                 document.querySelector('#entitlement-management > div:first-child');
  
  if (header) {
    // Check for existing Refresh Data button that might be part of the original UI
    const existingRefreshBtn = Array.from(header.querySelectorAll('button')).find(btn => 
      btn.textContent.toLowerCase().includes('refresh') || 
      btn.textContent.toLowerCase().includes('reload'));
    
    if (!existingRefreshBtn) {
      // Create our own button
      const refreshButton = document.createElement('button');
      refreshButton.id = 'manual-refresh-btn';
      refreshButton.className = 'btn';
      refreshButton.textContent = '↻ Refresh Data';
      refreshButton.style.marginLeft = 'auto';
      refreshButton.style.padding = '8px 16px';
      refreshButton.style.fontSize = '14px';
      refreshButton.style.display = 'flex';
      refreshButton.style.alignItems = 'center';
      refreshButton.style.gap = '6px';
      
      // Add click handler
      refreshButton.addEventListener('click', () => {
        if (window.refreshHolidayData) {
          window.refreshHolidayData();
          refreshButton.textContent = '⟳ Refreshing...';
          refreshButton.disabled = true;
          
          setTimeout(() => {
            refreshButton.textContent = '↻ Refresh Data';
            refreshButton.disabled = false;
          }, 2000);
        } else {
          // If our fix isn't loaded, reload the page
          window.location.reload();
        }
      });
      
      header.appendChild(refreshButton);
    }
  }
}

// Force data update
console.log('Checking for stale holiday data...');
const staffCards = document.querySelectorAll('.staff-card');
let hasZeroValues = false;

staffCards.forEach(card => {
  const usedSection = Array.from(card.querySelectorAll('div')).find(div => 
    div.textContent && div.textContent.toLowerCase().includes('used/taken'));
  
  if (usedSection && usedSection.previousElementSibling) {
    const usedValue = usedSection.previousElementSibling.textContent;
    if (usedValue === '0' || usedValue === '0:00' || usedValue === '0 hrs' || usedValue === '0 sessions') {
      hasZeroValues = true;
    }
  }
});

// If we find cards with zero values, trigger a refresh
if (hasZeroValues && window.refreshHolidayData) {
  console.log('Found cards with zero values - triggering refresh');
  window.refreshHolidayData();
}