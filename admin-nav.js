// Simple solution for preserving admin navigation
// Use event delegation to handle dynamically created navigation elements (buttons and links)
function initAdminNavigation() {
  // Use event delegation on the document to handle dynamically created admin elements
  document.addEventListener('click', async (e) => {
    const element = e.target.closest('button.admin-only, a.admin-only, button[data-href*="index.html"]');
    
    // Only handle admin navigation elements
    if (!element) return;
    
    // Check if this is an admin navigation element
    let isAdminNav = false;
    let adminUrl = null;
    
    if (element.tagName === 'BUTTON' && element.dataset.href) {
      // Button with data-href (new pattern)
      adminUrl = element.dataset.href;
      isAdminNav = adminUrl.includes('index.html');
    } else if (element.tagName === 'A' && element.getAttribute('href')) {
      // Anchor with href (legacy pattern)
      adminUrl = element.getAttribute('href');
      isAdminNav = adminUrl.includes('index.html');
    }
    
    if (!isAdminNav) return;
    
    // Don't interfere if event was already prevented
    if (e.defaultPrevented) return;
    
    // Prevent multiple rapid clicks
    if (element.dataset.clicking === 'true') {
      e.preventDefault();
      return;
    }
    
    // Ensure session is available and properly stored
    try {
      const storageKey = 'sb-' + CONFIG.SUPABASE_URL.split('//')[1].split('.')[0] + '-auth-token';
      const supabaseToken = localStorage.getItem(storageKey);
      
      if (!supabaseToken) {
        console.warn('No auth token found for admin navigation');
        return; // No token found, let normal navigation happen
      }
      
      // Parse the token to check if it's valid
      try {
        const tokenData = JSON.parse(supabaseToken);
        if (!tokenData || !tokenData.access_token) {
          console.warn('Invalid auth token structure');
          return;
        }
        
        // Log that we're performing admin navigation with valid session
        console.log('⏩ Admin navigation detected - session preserved in localStorage');
        console.log('Session storage key:', storageKey);
        
        // For buttons, handle navigation manually  
        if (element.tagName === 'BUTTON' && adminUrl) {
          e.preventDefault();
          element.dataset.clicking = 'true';
          
          // Small delay to ensure any pending state is saved
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // Navigate to admin page
          window.location.href = adminUrl;
        }
      } catch (parseError) {
        console.warn('Error parsing auth token:', parseError);
      }
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
