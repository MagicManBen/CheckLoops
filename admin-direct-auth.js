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
    
    // Immediately update user display
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('master_users')
          .select('full_name, role, access_type')
          .eq('auth_user_id', session.user.id)
          .maybeSingle();
        
        const userName = document.getElementById('user-name');
        const userInitials = document.getElementById('user-initials');
        
        if (userName) {
          const displayName = profile?.full_name || 
                            session.user?.user_metadata?.full_name ||
                            session.user?.user_metadata?.name ||
                            (session.user.email ? session.user.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'User');
          userName.textContent = displayName;
          console.log('✅ Set user display to:', displayName);
          
          // Also update initials
          if (userInitials) {
            const nameParts = displayName.split(' ');
            const initials = nameParts.length >= 2 
              ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
              : displayName.substring(0, 2).toUpperCase();
            userInitials.textContent = initials;
          }
        }
      }
    } catch (e) {
      console.error('Failed to update user display:', e);
    }
    
  } catch (err) {
    console.error('Authentication check error:', err);
    window.location.replace('home.html');
  }
});
