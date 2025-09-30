// Enhanced login-redirect.js to handle login redirects properly
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Check for a redirect parameter in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const redirectTarget = urlParams.get('redirect');
    
    if (redirectTarget) {
      console.log(`🔀 Login page loaded with redirect target: ${redirectTarget}`);
      
      // Update the signin form title/hint based on redirect target
      const signinTitle = document.getElementById('signin-title');
      const signinHint = document.getElementById('signin-hint');
      
      if (signinTitle && signinHint) {
        if (redirectTarget === 'admin') {
          signinTitle.textContent = 'Admin Access';
          signinHint.textContent = 'Sign in with your admin credentials to access the dashboard.';
        } else if (redirectTarget === 'staff') {
          signinTitle.textContent = 'Staff Portal';
          signinHint.textContent = 'Sign in with your staff credentials to access your account.';
        }
      }
      
      // Store the redirect target for after login
      sessionStorage.setItem('redirectAfterLogin', redirectTarget);
      
      // Monitor form submission
      const signinForm = document.getElementById('signin-form');
      if (signinForm) {
        signinForm.addEventListener('submit', (e) => {
          // Store the redirect in localStorage so it persists through page navigation
          localStorage.setItem('pendingRedirect', redirectTarget);
          console.log(`🔒 Form submitted, stored pending redirect: ${redirectTarget}`);
        });
      }
    }
    
    // Initialize Supabase if possible to check current auth state
    const initSupabaseAndCheckAuth = async () => {
      try {
        if (!window.supabase && typeof createClient !== 'undefined') {
          console.log('🔄 Creating Supabase client to check auth state');
          window.supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
            auth: { 
              persistSession: true, 
              autoRefreshToken: true,
              detectSessionInUrl: true,
              flowType: 'pkce',
              storage: window.localStorage,
              storageKey: `sb-${CONFIG.SUPABASE_URL.split('//')[1].split('.')[0]}-auth-token`
            }
          });
        }
        
        if (window.supabase) {
          // Check if already logged in
          const { data: { session } } = await window.supabase.auth.getSession();
          
          if (session) {
            console.log('✅ Session detected on login page; deferring redirect to page logic');
            // Do not redirect here to avoid race with home.html logic.
          }
          
          // Set up auth state change listener for future login
          window.supabase.auth.onAuthStateChange((event, session) => {
            // Let home.html's onAuthStateChange + redirectByRole own navigation.
            // Avoid double-redirects here.
          });
        }
      } catch (err) {
        console.error('Error initializing Supabase client:', err);
      }
    };
    
    // Try to initialize Supabase and check auth immediately if possible
    if (window.supabase || typeof createClient !== 'undefined') {
      await initSupabaseAndCheckAuth();
    } else {
      // Wait for Supabase to be available (might be loaded later)
      const checkSupabase = setInterval(async () => {
        if (window.supabase || typeof createClient !== 'undefined') {
          clearInterval(checkSupabase);
          await initSupabaseAndCheckAuth();
        }
      }, 100);
      
      // Give up after 5 seconds to avoid infinite interval
      setTimeout(() => clearInterval(checkSupabase), 5000);
    }
  } catch (err) {
    console.error('Error in login-redirect.js:', err);
  }
});
