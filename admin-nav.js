// Simple solution for preserving admin navigation
// Use event delegation to handle dynamically created navigation elements (buttons and links)
function initAdminNavigation() {
  // Use event delegation on the document to handle dynamically created admin elements
  document.addEventListener('click', (e) => {
    const element = e.target.closest('button.admin-only, a.admin-only');
    
    // Only handle admin elements
    if (!element) return;
    
    // Check if this is an admin navigation element
    let isAdminNav = false;
    let adminUrl = null;
    
    if (element.tagName === 'BUTTON' && element.dataset.href) {
      // Button with data-href (new pattern)
      adminUrl = element.dataset.href;
      isAdminNav = adminUrl.includes('admin-check.html');
    } else if (element.tagName === 'A' && element.getAttribute('href')) {
      // Anchor with href (legacy pattern)
      adminUrl = element.getAttribute('href');
      isAdminNav = adminUrl.includes('admin-check.html');
    }
    
    if (!isAdminNav) return;
    
    // Don't interfere if event was already prevented
    if (e.defaultPrevented) return;
    
    // Prevent multiple rapid clicks
    if (element.dataset.clicking === 'true') {
      e.preventDefault();
      return;
    }
    
    // Get the current session token
    try {
      const supabaseToken = localStorage.getItem('sb-' + CONFIG.SUPABASE_URL.split('//')[1].split('.')[0] + '-auth-token');
      if (!supabaseToken) return; // No token found, let normal navigation happen
      
      // Log that we're performing admin navigation
      console.log('⏩ Admin navigation detected - preserving auth state');
      
      // For buttons, handle navigation manually
      if (element.tagName === 'BUTTON' && adminUrl) {
        e.preventDefault();
        window.location.href = adminUrl;
      }
      
      // Since the session is stored in localStorage, we don't need to do anything special
      // The admin page will automatically pick up the session from localStorage
    } catch (error) {
      console.warn('Error checking auth state for admin navigation:', error);
    }
  }, { passive: false });
}

// Initialize when DOM is ready or immediately if already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdminNavigation);
} else {
  initAdminNavigation();
}
