// Fix for staff pages to ensure user profile is properly loaded
// Include this in all staff subpages that aren't loading profile information

(function() {
  // Wait for DOM to be ready
  const ready = function(callback) {
    if (document.readyState !== 'loading') {
      callback();
    } else {
      document.addEventListener('DOMContentLoaded', callback);
    }
  };

  // Main fix function
  ready(async function() {
    console.log('[Staff Fix] Checking if profile needs to be loaded');
    
    // If email pill is empty, profile may not be loaded
    const emailPill = document.getElementById('email-pill');
    const rolePill = document.getElementById('role-pill');
    
    if ((!emailPill || emailPill.textContent === '—') && 
        (!rolePill || rolePill.textContent === '—')) {
      console.log('[Staff Fix] Profile appears to be missing, loading it now');
      
      try {
        // Wait for Supabase to initialize
        while (!window.supabase && typeof supabase === 'undefined') {
          console.log('[Staff Fix] Waiting for Supabase to initialize...');
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        const sb = window.supabase || supabase;
        if (!sb) {
          console.error('[Staff Fix] Supabase not available');
          return;
        }
        
        // Get session
        const { data: { session } } = await sb.auth.getSession();
        if (!session || !session.user) {
          console.warn('[Staff Fix] No user session found');
          return;
        }
        
        // Get profile
        const { data: profileRow, error } = await sb
          .from('master_users')
          .select('id, access_type, role, email, nickname, full_name, avatar_url')
          .eq('auth_user_id', session.user.id)
          .maybeSingle();
          
        if (error) {
          console.error('[Staff Fix] Error fetching profile:', error);
          return;
        }
        
        console.log('[Staff Fix] Profile loaded:', profileRow);
        
        // Update display elements
        if (emailPill) {
          emailPill.textContent = session.user.email;
        }
        
        if (rolePill) {
          const roleDisplay = (profileRow?.access_type || profileRow?.role || 'Staff')
            .charAt(0).toUpperCase() + (profileRow?.access_type || profileRow?.role || 'Staff').slice(1).toLowerCase();
          rolePill.textContent = roleDisplay;
        }
        
        // Update avatar if it exists
        const navbarAvatar = document.getElementById('navbar-avatar');
        if (navbarAvatar) {
          const displayName = profileRow?.nickname || profileRow?.full_name || session.user?.email?.split('@')[0] || 'User';
          const initial = displayName.charAt(0).toUpperCase();
          
          // Assume avatars are enabled by default
          const useAvatars = true;
          
          if (useAvatars && profileRow?.avatar_url) {
            navbarAvatar.innerHTML = `<img src="${profileRow.avatar_url}" alt="${displayName}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
          } else {
            navbarAvatar.innerHTML = initial;
          }
        }
        
        // Update admin button visibility
        const adminRole = (profileRow?.access_type || profileRow?.role || '').toLowerCase();
        const adminPortalBtn = document.getElementById('adminPortalBtn');
        if (adminPortalBtn) {
          if (adminRole === 'admin' || adminRole === 'owner') {
            adminPortalBtn.style.display = 'inline-flex';
          } else {
            adminPortalBtn.style.display = 'none';
          }
        }
        
        console.log('[Staff Fix] Profile successfully applied to page');
      } catch (err) {
        console.error('[Staff Fix] Error:', err);
      }
    } else {
      console.log('[Staff Fix] Profile already loaded');
    }
  });
})();