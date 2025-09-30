/* Admin navigation diagnostic checker */
const startTime = Date.now();
console.log('🧪 Admin page diagnostic loaded at', new Date().toISOString());

// Check if we came from a navigation test
const testStarted = sessionStorage.getItem('navigationTestStarted');
const testStatus = sessionStorage.getItem('navigationTestComplete');

if (testStarted && testStatus === 'pending') {
  console.log('🧪 Navigation test detected');
  
  // Mark test as complete
  sessionStorage.setItem('navigationTestComplete', 'complete');
  
  // Calculate navigation time
  const navTimeMs = Date.now() - parseInt(testStarted);
  console.log(`⏱️ Navigation took ${navTimeMs}ms`);
  
  // Log diagnostic information
  console.log('📊 Diagnostic data:', {
    email: sessionStorage.getItem('testDiagnosticEmail'),
    role: sessionStorage.getItem('testDiagnosticRole'),
    userId: sessionStorage.getItem('testDiagnosticUserId'),
    forceAuthRefresh: sessionStorage.getItem('forceAuthRefresh'),
    cameFromStaffAt: sessionStorage.getItem('cameFromStaffAt')
  });
  
  // Force auth refresh after 500ms to ensure it occurs after page load
  setTimeout(async () => {
    try {
      console.log('🔄 Performing test auth refresh...');
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
      const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' }
      });
      
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('❌ Test refresh failed:', error);
      } else {
        console.log('✅ Test refresh succeeded:', {
          user: data.user?.email,
          expiresAt: new Date(data.session?.expires_at * 1000).toISOString()
        });
      }
    } catch (err) {
      console.error('❌ Test refresh error:', err);
    }
  }, 500);
}

