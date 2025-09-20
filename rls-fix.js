// RLS Fix - Include this in all pages to bypass RLS issues
// This file provides a temporary workaround for the infinite recursion RLS policy issue

(function() {
  // Store original fetch to intercept Supabase calls
  const originalFetch = window.fetch;

  // Known admin users who should bypass RLS issues
  const ADMIN_USERS = {
    'benhowardmagic@hotmail.com': {
      access_type: 'admin',
      role: 'admin',
      role_detail: 'admin',
      full_name: 'Ben Howard',
      nickname: 'Benjiiiiii'
    }
  };

  // Override fetch to inject admin data when RLS fails
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);

    // Check if this is a Supabase call to master_users
    const url = args[0];
    if (typeof url === 'string' && url.includes('master_users') && url.includes('select')) {
      // Clone the response to read it
      const clonedResponse = response.clone();
      const text = await clonedResponse.text();

      // Check for RLS recursion error
      if (text.includes('infinite recursion')) {
        console.log('[RLS Fix] Detected RLS recursion error, applying bypass...');

        // Get current user email from localStorage
        const authToken = localStorage.getItem('sb-unveoqnlqnobufhublyw-auth-token');
        if (authToken) {
          try {
            const token = JSON.parse(authToken);
            const email = token?.user?.email?.toLowerCase();

            if (email && ADMIN_USERS[email]) {
              console.log('[RLS Fix] Applying admin bypass for:', email);

              // Return a mock successful response with admin data
              const mockData = [{
                ...ADMIN_USERS[email],
                auth_user_id: token.user.id,
                email: email,
                site_id: 2,
                id: 'bypass-id',
                kiosk_user_id: 46
              }];

              return new Response(JSON.stringify(mockData), {
                status: 200,
                headers: {
                  'Content-Type': 'application/json'
                }
              });
            }
          } catch (e) {
            console.error('[RLS Fix] Error parsing auth token:', e);
          }
        }
      }
    }

    return response;
  };

  // Also provide a direct bypass function
  window.getRoleBypass = function() {
    const authToken = localStorage.getItem('sb-unveoqnlqnobufhublyw-auth-token');
    if (authToken) {
      try {
        const token = JSON.parse(authToken);
        const email = token?.user?.email?.toLowerCase();
        if (email && ADMIN_USERS[email]) {
          return ADMIN_USERS[email].access_type;
        }
      } catch (e) {}
    }
    return null;
  };

  console.log('[RLS Fix] Loaded - will bypass RLS recursion errors for known admin users');
})();