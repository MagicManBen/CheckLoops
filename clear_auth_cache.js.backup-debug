// Clear all authentication and app cache for fresh start
// Run this in browser console before logging in

(function clearAllCache() {
  console.log('🧹 Clearing all authentication cache...');
  
  try {
    // Clear localStorage
    const lsKeys = Object.keys(localStorage);
    lsKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
        console.log('Cleared localStorage key:', key);
      } catch(e) {}
    });
    
    // Clear sessionStorage
    const ssKeys = Object.keys(sessionStorage);
    ssKeys.forEach(key => {
      try {
        sessionStorage.removeItem(key);
        console.log('Cleared sessionStorage key:', key);
      } catch(e) {}
    });
    
    // Clear cookies
    document.cookie.split(';').forEach(cookie => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      console.log('Cleared cookie:', name);
    });
    
    console.log('✅ All cache cleared! You can now login fresh.');
    
  } catch (error) {
    console.error('❌ Cache clearing failed:', error);
  }
})();
