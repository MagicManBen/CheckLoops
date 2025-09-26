// Run this file to inject the holiday data fix into the admin dashboard
// This should be executed in your browser console while on the admin dashboard page

// Function to load our script into the page
function loadScript(url, callback) {
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = url;
  
  script.onload = function() {
    if (callback) callback();
  };
  
  document.head.appendChild(script);
}

// Check if we're on the admin dashboard
if (window.location.href.includes('admin-dashboard.html') || 
    document.title.includes('Admin') || 
    document.title.includes('Dashboard')) {
  
  console.log('Admin dashboard detected, loading holiday fix...');
  
  // First load the main fix script
  loadScript('admin-dashboard-holiday-fix.js', function() {
    console.log('Holiday fix script loaded');
    
    // Then load the inject script to handle the UI integration
    loadScript('admin-dashboard-holiday-inject.js', function() {
      console.log('Holiday fix injection complete');
    });
  });
} else {
  console.error('This script should only be run on the admin dashboard page');
}

// =============================================
// Instructions:
// 1. Copy this entire file
// 2. Open the admin dashboard in your browser
// 3. Open the browser console (F12 or right-click > Inspect > Console)
// 4. Paste this code and press Enter
// 5. The fix will be applied and the dashboard will refresh with correct holiday data
// =============================================