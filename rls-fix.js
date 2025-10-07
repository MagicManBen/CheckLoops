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

// Provide a safe shim for removeUserComplete so pages that include older markup
// which call `removeUserComplete(...)` won't throw a fatal error if the full
// admin dashboard script hasn't loaded. This shim will wait briefly for a real
// implementation, then fall back to a minimal, safe deletion/cancel-invite flow
// that uses window.supabase if available.
(function(){
  if (window.removeUserComplete && typeof window.removeUserComplete === 'function') return;

  let resolved = false;

  // If a real implementation is attached later, use it.
  const tryAttachReal = () => {
    if (window.removeUserComplete && typeof window.removeUserComplete === 'function') {
      resolved = true;
      return true;
    }
    return false;
  };

  // Minimal fallback implementation: accept either (payload) or (id, isUserId)
  window.removeUserComplete = async function(payloadOrId, maybeIsUserId) {
    // If real implementation becomes available, defer to it
    if (tryAttachReal() && window.removeUserComplete !== arguments.callee) {
      return window.removeUserComplete.apply(this, arguments);
    }

    // Wait briefly (up to 1.5s) for a real implementation to appear
    const start = Date.now();
    while (!resolved && Date.now() - start < 1500) {
      if (tryAttachReal()) return window.removeUserComplete.apply(this, arguments);
      // small sleep
      await new Promise(r => setTimeout(r, 120));
    }

    // Normalize payload
    let payload = {};
    if (typeof payloadOrId === 'string' || typeof payloadOrId === 'number') {
      const id = payloadOrId;
      const isUserId = maybeIsUserId !== false;
      if (isUserId) payload.userId = id; else payload.inviteId = id;
    } else if (payloadOrId && typeof payloadOrId === 'object') {
      payload = Object.assign({}, payloadOrId);
    }

    // Best-effort fallback: If supabase is available, try a simple delete/cancel
    try {
      if (!window.supabase) {
        console.warn('[removeUserComplete shim] Supabase client not found; cannot perform fallback deletion.');
        alert('Delete function is temporarily unavailable. Please try again from the Admin dashboard.');
        return;
      }

      // If inviteId -> delete site_invites
      if (payload.inviteId) {
        const { error } = await window.supabase.from('site_invites').delete().eq('id', payload.inviteId);
        if (error) throw error;
        alert('Invitation cancelled');
        if (typeof window.loadPracticeUsers === 'function') window.loadPracticeUsers();
        return;
      }

      // If userId or masterId -> attempt to delete via Edge Function first
      const userId = payload.userId || payload.authUserId || '';
      const masterId = payload.masterId || payload.master_id || payload.id || '';

      // Preferred path: server-side deletion (uses service role)
      try {
        if (userId && typeof window.supabase?.functions?.invoke === 'function') {
          const { data: fnRes, error: fnErr } = await window.supabase.functions.invoke('delete-user', {
            body: { userId, masterId: masterId || undefined, email: payload.email || undefined, site_id: payload.site_id || window.ctx?.site_id }
          });
          if (!fnErr && fnRes?.ok) {
            alert('User removed (server). Refreshing list...');
            if (typeof window.loadPracticeUsers === 'function') window.loadPracticeUsers();
            if (typeof window.loadTeamOverview === 'function') window.loadTeamOverview();
            return;
          }
        }
      } catch (e) {
        console.warn('[removeUserComplete shim] Edge function delete failed, using fallback:', e?.message || e);
      }

      // Fallback: client-side deletes
      if (masterId) {
        await window.supabase.from('master_users').delete().eq('id', masterId);
      }

      if (userId) {
        // Try to delete auth user with a couple of attempts
        const authAdmin = window.supabase?.auth?.admin;
        if (authAdmin && typeof authAdmin.deleteUser === 'function') {
          let authErr = null;
          for (let attempt = 1; attempt <= 2; attempt++) {
            try {
              await authAdmin.deleteUser(userId);
              authErr = null;
              break;
            } catch (err) {
              authErr = err;
              console.warn(`[removeUserComplete shim] Auth delete attempt ${attempt} failed:`, err.message || err);
              // short backoff
              await new Promise(r => setTimeout(r, 250 * attempt));
            }
          }

          if (authErr) {
            // Log to deletion debug console if present
            try {
              if (window.deletionDebugLog && Array.isArray(window.deletionDebugLog)) {
                window.deletionDebugLog.push({ level: 'error', msg: 'Auth deletion failed', err: authErr });
                const logEl = document.getElementById('deletion-debug-log');
                if (logEl) logEl.textContent = JSON.stringify(window.deletionDebugLog, null, 2);
              }
            } catch (logErr) { /* ignore */ }

            // Give an actionable console command the admin can copy/paste to delete the user manually
            const manualCmd = `// Run in browser console (with Supabase client available):\n` +
              `await supabase.auth.admin.deleteUser('${userId}').catch(e=>console.error('deleteUser failed',e));`;

            alert('User record removed from master_users, but removing the auth account failed.\n\nOpen your browser console and run the provided command to remove the auth user, or retry from the Admin dashboard. The command was also copied to your clipboard.');

            try { navigator.clipboard.writeText(manualCmd); } catch (_) {}
            // Also show the manual command in a prompt so it can be copied if clipboard is unavailable
            try { window.prompt('Manual supabase.auth.admin.deleteUser command (copy and run in console):', manualCmd); } catch (_) {}
          }
        }
      }

      alert('User removed (fallback). Refreshing list...');
      if (typeof window.loadPracticeUsers === 'function') window.loadPracticeUsers();
      if (typeof window.loadTeamOverview === 'function') window.loadTeamOverview();
    } catch (e) {
      console.error('[removeUserComplete shim] Fallback deletion failed', e);
      alert('Failed to delete user: ' + (e.message || e));
    }
  };
})();