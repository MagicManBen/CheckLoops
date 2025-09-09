/**
 * This is a diagnostic script to help test and debug
 * the navigation flow from staff pages to admin page.
 * 
 * To use it, load any staff page in the browser, then open
 * the developer console and paste this code.
 */

// Clear any test data from previous runs
sessionStorage.removeItem('navigationTestStarted');
sessionStorage.removeItem('navigationTestComplete');

// Store the current timestamp to track navigation flow
sessionStorage.setItem('navigationTestStarted', Date.now());
console.log('🧪 Navigation test started');

// Get current user data
(async function() {
  try {
    // Create Supabase client
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' }
    });
    
    // Get current user
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('❌ Auth error:', error);
      return;
    }
    
    if (!user) {
      console.error('❌ No authenticated user found');
      return;
    }
    
    // Log user info
    console.log('👤 Current user:', {
      id: user.id,
      email: user.email,
      rawUserMetaData: user.user_metadata
    });
    
    // Get profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (profileError) {
      console.error('❌ Profile fetch error:', profileError);
    } else {
      console.log('👤 Profile data:', profile);
    }
    
    // Store diagnostic data for the admin page to check
    sessionStorage.setItem('testDiagnosticEmail', user.email);
    sessionStorage.setItem('testDiagnosticRole', profile?.role || user?.user_metadata?.role || 'unknown');
    sessionStorage.setItem('testDiagnosticUserId', user.id);
    
    // Setup for navigation
    console.log('🔄 Setting up forced auth refresh for navigation');
    sessionStorage.setItem('forceAuthRefresh', 'true');
    sessionStorage.setItem('cameFromStaffAt', String(Date.now()));
    
    // Set a flag to track test completion
    sessionStorage.setItem('navigationTestComplete', 'pending');
    
    // Navigate to admin page after a short delay
    console.log('🧭 Navigating to admin page in 1 second...');
    setTimeout(() => {
      window.location.href = 'index.html?test=' + Date.now();
    }, 1000);
    
  } catch (error) {
    console.error('❌ Test script error:', error);
  }
})();
