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

// Auto-inject debug overlay across pages that include config.js
try {
  (function(){
    // Avoid duplicate insertion and respect CSP if script-src 'self'
    if (window.__DEBUG_OVERLAY__ || document.getElementById('debug-overlay-script')) return;
    const s = document.createElement('script');
    s.id = 'debug-overlay-script';
    s.src = (typeof CONFIG !== 'undefined' && CONFIG.baseUrl) ? `${CONFIG.baseUrl}/debug-overlay.js` : './debug-overlay.js';
    s.async = true;
    s.onerror = function(){
      // fallback to relative path if absolute failed
      if (!/^(\.|\/)debug-overlay\.js$/.test(s.src)) {
        const f = document.createElement('script');
        f.id = 'debug-overlay-script';
        f.src = './debug-overlay.js';
        document.head.appendChild(f);
      }
    };
    document.head.appendChild(s);
  })();
} catch(_) { /* no-op */ }