// Separate login redirect for admin pages
// This script redirects users to the login page if not authenticated
// and ensures they return to the admin page after login

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Create Supabase client if not already created
    if (!window.supabase) {
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
      window.supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' }
      });
    }
    
    // Check if we have a valid session
    const { data: { session }, error } = await window.supabase.auth.getSession();
    
    if (error || !session) {
      console.log('🔒 No valid session, redirecting to login page');
      // Store current page as the redirect target
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
      // Redirect to login page
      window.location.href = 'Home.html?redirect=admin&_=' + Date.now();
      return;
    }
    
    // Check if user has admin role
    const checkAdminRole = async () => {
      try {
        // Check profile table
        const { data: profile, error: profileError } = await window.supabase
          .from('master_users')
          .select('role')
          .eq('auth_user_id', session.user.id)
          .maybeSingle();
          
        if (profile && ['admin', 'owner'].includes(profile.role?.toLowerCase())) {
          console.log('✅ Admin access verified from profile');
          return true;
        }
        
        // Check invitations
        const { data: invite, error: inviteError } = await window.supabase
          .from('site_invites')
          .select('role')
          .eq('email', session.user.email)
          .in('role', ['admin', 'owner'])
          .maybeSingle();
          
        if (invite) {
          console.log('✅ Admin access verified from invitation');
          return true;
        }
        
        // Check user metadata
        const rawRole = session.user?.user_metadata?.role || session.user?.raw_user_meta_data?.role;
        if (rawRole && ['admin', 'owner'].includes(String(rawRole).toLowerCase())) {
          console.log('✅ Admin access verified from user metadata');
          return true;
        }
        
        return false;
      } catch (err) {
        console.error('Error checking admin role:', err);
        return false;
      }
    };
    
    const hasAdminAccess = await checkAdminRole();
    
    if (!hasAdminAccess) {
      console.log('⛔ User is authenticated but lacks admin access');
      // Redirect to staff page
      window.location.href = 'staff.html?accessdenied=true&_=' + Date.now();
    }
    
  } catch (err) {
    console.error('Error in admin auth check:', err);
  }
});
