// Display logged-in user information on the dashboard
document.addEventListener('DOMContentLoaded', async () => {
  // Create the user welcome message element if it doesn't exist
  let welcomeMessageEl = document.getElementById('user-welcome-message');
  
  if (!welcomeMessageEl) {
  // Create the element but do not insert it into the DOM so the welcome banner is hidden by default
  // (Removing automatic banner display at dashboard drop-in)
  // const dashboardSection = document.getElementById('view-dashboard');
  // const dashboardPanel = dashboardSection.querySelector('.panel');

  welcomeMessageEl = document.createElement('div');
  welcomeMessageEl.id = 'user-welcome-message';
  welcomeMessageEl.style = 'background: linear-gradient(135deg, rgba(118, 167, 255, 0.2), rgba(118, 167, 255, 0.1)); border: 1px solid rgba(118, 167, 255, 0.3); border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px; font-size: 28px; font-weight: 700; color: var(--white);';
  welcomeMessageEl.textContent = 'Loading user information...';

  // Intentionally not inserted into the DOM to remove the welcome banner on initial load
  }
  
  try {
    // Check if supabase is available (initialized by admin-direct-auth.js)
    if (typeof supabase === 'undefined' || !supabase) {
      // Try to initialize Supabase
      try {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
        window.supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
          auth: { 
            persistSession: true, 
            autoRefreshToken: true, 
            detectSessionInUrl: true, 
            flowType: 'pkce' 
          }
        });
      } catch (e) {
        console.error('Failed to initialize supabase:', e);
        welcomeMessageEl.textContent = 'ERROR: User not logged in';
        welcomeMessageEl.style.background = 'linear-gradient(135deg, rgba(255, 107, 107, 0.2), rgba(255, 107, 107, 0.1))';
        welcomeMessageEl.style.borderColor = 'rgba(255, 107, 107, 0.3)';
        return;
      }
    }
    
    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      welcomeMessageEl.textContent = 'ERROR: User not logged in';
      welcomeMessageEl.style.background = 'linear-gradient(135deg, rgba(255, 107, 107, 0.2), rgba(255, 107, 107, 0.1))';
      welcomeMessageEl.style.borderColor = 'rgba(255, 107, 107, 0.3)';
      return;
    }
    
    // Try to get user profile information
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, role')
      .eq('user_id', session.user.id)
      .maybeSingle();
    
    let displayName = '';
    
    if (profileError || !profile) {
      // Fallback to email if profile not found
      displayName = session.user.email || 'Unknown User';
    } else {
      // Use name from profile if available
      if (profile.first_name || profile.last_name) {
        displayName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
      } else {
        displayName = session.user.email || 'Unknown User';
      }
    }
    
    // Update welcome message
    welcomeMessageEl.innerHTML = `Welcome, <span style="color: #76a7ff;">${displayName}</span>! 👋`;
    welcomeMessageEl.style.background = 'linear-gradient(135deg, rgba(43, 212, 167, 0.2), rgba(43, 212, 167, 0.1))';
    welcomeMessageEl.style.borderColor = 'rgba(43, 212, 167, 0.3)';
    
  } catch (err) {
    console.error('Error displaying user information:', err);
    welcomeMessageEl.textContent = 'ERROR: Unable to load user information';
    welcomeMessageEl.style.background = 'linear-gradient(135deg, rgba(255, 107, 107, 0.2), rgba(255, 107, 107, 0.1))';
    welcomeMessageEl.style.borderColor = 'rgba(255, 107, 107, 0.3)';
  }
});
