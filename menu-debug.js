// Simple inline script for debugging menu click issues
(() => {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[DEBUG] Menu click helper loaded');
    
    // Small helper to check if an element at a position is clickable
    window.checkClickAt = function(x, y) {
      const el = document.elementFromPoint(x, y);
      console.log('Element at', x, y, ':', el);
      return el;
    };
    
    // Add z-index to ensure sidebar always receives clicks
    const ensureClickable = () => {
      const sidebar = document.querySelector('.sidebar, #sidebar');
      if (sidebar) {
        sidebar.style.position = 'relative';
        sidebar.style.zIndex = '10';
      }
      
      // Make nav elements clickable
      document.querySelectorAll('.nav button, .nav-group-toggle').forEach(btn => {
        btn.style.position = 'relative';
        btn.style.zIndex = '5';
        btn.style.pointerEvents = 'auto';
      });
      
      // Make hidden overlays non-blocking
      document.querySelectorAll('.modal:not(.show), .auth:not(.show), .help-modal:not(.show)').forEach(modal => {
        modal.style.pointerEvents = 'none';
      });
    };
    
    // Run immediately and periodically
    ensureClickable();
    setInterval(ensureClickable, 2000);
    
    // Add event listeners to nav buttons to log click reception
    document.querySelectorAll('.nav button, .nav-group-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        console.log('Button clicked:', btn, e);
      });
    });
  });
})();
