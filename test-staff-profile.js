// Test script to verify the fix for user profile loading in staff.html
// To use: Include this script in staff.html or any staff page for testing
// Remove after verification

(async function() {
  console.log('Running staff profile loading test...');
  
  try {
    // Wait for Supabase to be initialized
    while (!window.supabase && !window.__supabaseClient) {
      console.log('Waiting for Supabase initialization...');
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const sb = window.supabase || window.__supabaseClient;
    console.log('Supabase client available:', !!sb);
    
    // Check for session
    const { data: { session }, error: sessionError } = await sb.auth.getSession();
    if (sessionError) {
      console.error('Session error:', sessionError);
      return;
    }
    
    if (!session || !session.user) {
      console.error('No active session found');
      return;
    }
    
    console.log('Active session found for user:', session.user.email);
    
    // Get profile directly
    const { data: profileRow, error: profileError } = await sb
      .from('master_users')
      .select('id, kiosk_user_id, role, access_type, role_detail, full_name, nickname, site_id, avatar_url, team_id, team_name')
      .eq('auth_user_id', session.user.id)
      .maybeSingle();
      
    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return;
    }
    
    console.log('Profile data retrieved:', profileRow);
    
    // Test the fixed getCurrentUserSiteText function
    if (typeof window.getCurrentUserSiteText === 'function') {
      console.log('Testing getCurrentUserSiteText function...');
      const siteText = await window.getCurrentUserSiteText(sb, session.user, profileRow);
      console.log('Site text result:', siteText);
      
      // Verify avatar loading
      const navbarAvatar = document.getElementById('navbar-avatar');
      const userAvatar = document.getElementById('user-avatar');
      
      console.log('Navbar avatar element:', !!navbarAvatar);
      console.log('User avatar element:', !!userAvatar);
      
      // Update display elements for visual verification
      const emailPill = document.getElementById('email-pill');
      const rolePill = document.getElementById('role-pill');
      const welcomeTitle = document.getElementById('welcome');
      
      if (emailPill) {
        console.log('Email pill element found, text:', emailPill.textContent);
      }
      
      if (rolePill) {
        console.log('Role pill element found, text:', rolePill.textContent);
      }
      
      if (welcomeTitle) {
        console.log('Welcome title element found, text:', welcomeTitle.textContent);
      }
      
      // Add test status to the page
      const testDiv = document.createElement('div');
      testDiv.style.position = 'fixed';
      testDiv.style.bottom = '10px';
      testDiv.style.left = '10px';
      testDiv.style.background = '#4ade80';
      testDiv.style.color = 'white';
      testDiv.style.padding = '8px 16px';
      testDiv.style.borderRadius = '4px';
      testDiv.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
      testDiv.style.zIndex = '9999';
      testDiv.style.fontSize = '14px';
      testDiv.innerHTML = `
        <b>Profile Test Complete</b>
        <div>Email: ${session.user.email}</div>
        <div>Name: ${profileRow?.nickname || profileRow?.full_name || 'Not set'}</div>
        <div>Site: ${profileRow?.site_id || 'Unknown'}</div>
        <div>Role: ${profileRow?.access_type || profileRow?.role || 'Not set'}</div>
      `;
      document.body.appendChild(testDiv);
      
      console.log('Test complete - profile loading verified');
      
      // Auto-remove test indicator after 20 seconds
      setTimeout(() => {
        try {
          testDiv.remove();
        } catch (e) {}
      }, 20000);
    } else {
      console.error('getCurrentUserSiteText function not available');
    }
  } catch (err) {
    console.error('Test error:', err);
  }
})();