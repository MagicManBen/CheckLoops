// Smart environment detection and configuration
const CONFIG = {
  // Detect if we're running locally or on GitHub Pages
  isLocal: window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost',
  
  // Supabase configuration (same for both environments)
  SUPABASE_URL: 'https://unveoqnlqnobufhublyw.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME',
  
  // Get the appropriate base URL
  get baseUrl() {
    if (this.isLocal) {
      return `${window.location.protocol}//${window.location.host}`;
    } else {
      return 'https://checkloops.co.uk';
    }
  },

  // Get the appropriate redirect URL for password setting
  get passwordRedirectUrl() {
    if (this.isLocal) {
      return `${window.location.protocol}//${window.location.host}/simple-set-password.html`;
    } else {
      return 'https://checkloops.co.uk/simple-set-password.html';
    }
  },
  
  // Get environment info for debugging
  get environment() {
    return this.isLocal ? 'local' : 'production';
  }
};

// Log current environment for debugging
console.log(`🌍 Environment: ${CONFIG.environment}`);
console.log(`🔗 Base URL: ${CONFIG.baseUrl}`);
console.log(`🔑 Password Redirect: ${CONFIG.passwordRedirectUrl}`);

// Removed: auto-injection of the on-screen debug overlay
// Cleanup any previously registered debug service worker if present
try {
  if ('serviceWorker' in navigator && navigator.serviceWorker.getRegistrations) {
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(reg => {
        try {
          const url = reg?.active?.scriptURL || reg?.installing?.scriptURL || reg?.waiting?.scriptURL || '';
          if (url && /\/debug-sw\.js(?:$|\?)/.test(url)) {
            reg.unregister();
          }
        } catch (_) { /* ignore */ }
      });
    }).catch(() => {});
  }
} catch(_) { /* no-op */ }