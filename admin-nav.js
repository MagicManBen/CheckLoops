// Simple solution for preserving admin navigation
document.addEventListener('DOMContentLoaded', () => {
  // Get all admin links
  const adminLinks = document.querySelectorAll('.admin-only');
  
  // Add a click handler to each admin link
  adminLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      // Don't apply to non-anchor elements or elements without href
      if (link.tagName !== 'A' || !link.getAttribute('href')) return;
      
      // Don't apply to links that don't point to admin-check.html
      if (!link.getAttribute('href').includes('admin-check.html')) return;
      
      // Don't interfere with other click handlers
      if (e.defaultPrevented) return;
      
      // Get the link's href
      const adminUrl = link.getAttribute('href');
      
      // Get the current session token
      const supabaseToken = localStorage.getItem('sb-' + CONFIG.SUPABASE_URL.split('//')[1].split('.')[0] + '-auth-token');
      if (!supabaseToken) return; // No token found, let normal navigation happen
      
      // Log that we're performing admin navigation
      console.log('⏩ Admin navigation detected - preserving auth state');
      
      // Since the session is stored in localStorage, we don't need to do anything special
      // The admin page will automatically pick up the session from localStorage
    });
  });
});
