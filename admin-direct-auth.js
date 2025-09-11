// Simple admin authentication check
import { initAdminSupabase, checkAdminAccess } from './admin-auth.js';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('🔐 Running admin authentication check...');
    
    // Look for localStorage flags that might have been set by admin-login.html
    const adminLoggedIn = localStorage.getItem('adminLoggedIn');
    const adminEmail = localStorage.getItem('adminEmail');
    
    if (adminLoggedIn === 'true') {
      console.log(`ℹ️ Found adminLoggedIn flag for: ${adminEmail}`);
      // Clear the flag since we're processing it
      localStorage.removeItem('adminLoggedIn');
    }
    
  // Initialize supabase client with consistent settings
  const supabase = await initAdminSupabase();
    
    // Debug output of current session before check
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('✓ Current session found for:', session.user.email);
      } else {
        console.log('✗ No current session found');
      }
    } catch (e) {
      console.error('Error checking session:', e);
    }
    
    // To avoid transient null sessions, attempt a short retry for session/materialized role
    async function wait(ms){ return new Promise(r => setTimeout(r, ms)); }
    async function ensureSession(retries = 2, delay = 200){
      for (let i = 0; i <= retries; i++) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) return session;
        if (i < retries) await wait(delay);
      }
      return null;
    }

    await ensureSession();

    // Check admin access (with one optional retry)
    let isAdmin = await checkAdminAccess(supabase);
    if (!isAdmin) {
      await wait(250);
      isAdmin = await checkAdminAccess(supabase);
    }
    
    if (!isAdmin) {
      console.log('❌ Admin access check failed - redirecting to home page');
      // Align with navigation rules: send non-admins to home.html
      window.location.replace('home.html');
      return;
    }
    
    // If we get here, the user is authenticated as admin
    console.log('✅ Admin session verified');
    
  } catch (err) {
    console.error('Authentication check error:', err);
    window.location.replace('home.html');
  }
});
