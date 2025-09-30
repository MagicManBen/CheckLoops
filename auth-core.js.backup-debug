// Enhanced auth-core.js with RLS bypass for broken policies
// This is a modified version that handles the RLS recursion issue

// Centralized Authentication System for CheckLoop
// This single module handles ALL authentication across the entire application

let supabaseInstance = null;
let currentSession = null;
let userRole = null;

// Known admin users bypass (temporary fix for RLS issues)
const ADMIN_BYPASS = {
  'benhowardmagic@hotmail.com': 'admin',
  'ben.howard@stoke.nhs.uk': 'admin'
};

// Single Supabase client initialization
export async function getSupabase() {
  if (supabaseInstance) return supabaseInstance;

  // Use local Supabase bundle to avoid CSP issues
  if (typeof supabase === 'undefined') {
    throw new Error('Supabase library not loaded. Make sure supabase-js.js is included.');
  }
  const { createClient } = supabase;

  // Use consistent storage key
  const storageKey = `sb-${CONFIG.SUPABASE_URL.split('//')[1].split('.')[0]}-auth-token`;

  supabaseInstance = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: window.localStorage,
      storageKey: storageKey
    }
  });

  // Set up auth state listener once
  supabaseInstance.auth.onAuthStateChange(async (event, session) => {
    currentSession = session;

    if (event === 'SIGNED_OUT' || !session) {
      userRole = null;
      // Only redirect if we're not already on a public page
      const publicPages = ['homepage.html', 'home.html', 'signup.html', 'set-password.html', 'admin-login.html'];
      const currentPage = window.location.pathname.split('/').pop();

      if (!publicPages.includes(currentPage)) {
        // If on admin pages, redirect to admin login
        if (currentPage.includes('admin') || currentPage === 'index.html') {
          window.location.href = 'admin-login.html';
        } else {
          // For staff pages, redirect to home.html
          window.location.href = 'home.html';
        }
      }
    } else if (event === 'SIGNED_IN' && session) {
      // Fetch and cache user role
      await fetchUserRole();
    }
  });

  // Load initial session
  const { data: { session } } = await supabaseInstance.auth.getSession();
  currentSession = session;
  if (session) {
    await fetchUserRole();
  }

  return supabaseInstance;
}

// Fetch and cache user role with RLS bypass
async function fetchUserRole() {
  if (!currentSession) return null;

  const email = currentSession.user?.email?.toLowerCase();

  // First check if this is a known admin (RLS bypass)
  if (email && ADMIN_BYPASS[email]) {
    console.log('[Auth] Using bypass for known admin:', email);
    userRole = ADMIN_BYPASS[email];
    return userRole;
  }

  const supabase = await getSupabase();

  // Try to fetch from master_users table
  try {
    const { data: profile, error } = await supabase
      .from('master_users')
      .select('access_type, role')
      .eq('auth_user_id', currentSession.user.id)
      .maybeSingle();

    if (error) {
      // Check for RLS recursion error
      if (error.message && error.message.includes('infinite recursion')) {
        console.warn('[Auth] RLS recursion detected, using email-based bypass');
        // Use email-based role determination as fallback
        if (email === 'benhowardmagic@hotmail.com') {
          userRole = 'admin';
          return userRole;
        }
      } else {
        console.error('[Auth] Error fetching profile:', error);
      }
    } else if (profile) {
      // Use access_type as the authoritative source for admin/staff access
      userRole = (profile.access_type || profile.role || 'staff').toLowerCase();
      return userRole;
    }
  } catch (e) {
    console.error('[Auth] Exception fetching profile:', e);
  }

  // Fallback to user metadata
  const metaRole = currentSession.user?.user_metadata?.role ||
                   currentSession.user?.raw_user_meta_data?.role;

  if (metaRole) {
    userRole = metaRole.toLowerCase();
    return userRole;
  }

  // Default to staff if no role found
  userRole = 'staff';
  return userRole;
}

// Get current session
export async function getSession() {
  const supabase = await getSupabase();
  if (currentSession) return currentSession;

  const { data: { session } } = await supabase.auth.getSession();
  currentSession = session;
  if (session) {
    await fetchUserRole();
  }
  return session;
}

// Get user role
export async function getUserRole() {
  if (userRole) return userRole;
  await getSession();
  return userRole || 'staff';
}

// Check if user is admin
export async function isAdmin() {
  const role = await getUserRole();
  return role === 'admin' || role === 'owner';
}

// Sign in
export async function signIn(email, password) {
  const supabase = await getSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: {
      shouldCreateUser: false,
      data: { remember_me: true } // Always remember the user
    }
  });

  if (error) throw error;

  currentSession = data.session;
  await fetchUserRole();

  return data;
}

// Sign out
export async function signOut() {
  const supabase = await getSupabase();
  const currentRole = userRole;

  // Determine the current page to decide where to redirect
  const currentPage = window.location.pathname.split('/').pop();

  // Clear session
  await supabase.auth.signOut();
  currentSession = null;
  userRole = null;

  // Redirect based on the page the user is currently on
  if (currentPage.includes('admin') || currentPage === 'index.html') {
    // If on admin pages, redirect to admin login
    window.location.href = 'admin-login.html';
  } else {
    // For staff pages, redirect to home.html
    window.location.href = 'home.html';
  }
}

// Page-specific auth requirements
export async function requireAuth(options = {}) {
  const {
    adminOnly = false,
    staffOnly = false,
    redirectTo = 'home.html'
  } = options;

  const session = await getSession();

  // Check if logged in
  if (!session) {
    window.location.href = redirectTo;
    return null;
  }

  const role = await getUserRole();

  // Check admin requirement
  if (adminOnly && role !== 'admin' && role !== 'owner') {
    console.log('Admin access required, redirecting to staff page');
    window.location.href = 'staff.html';
    return null;
  }

  // Check staff requirement
  if (staffOnly && (role === 'admin' || role === 'owner')) {
    console.log('Staff-only page, admins redirected to admin panel');
    window.location.href = 'index.html';
    return null;
  }

  return { session, role };
}

// Initialize auth protection for a page
export async function protectPage(pageType = 'public') {
  switch(pageType) {
    case 'admin':
      return await requireAuth({ adminOnly: true });

    case 'staff':
      return await requireAuth({ adminOnly: false });

    case 'public':
    default:
      // Public pages don't require auth
      return { session: await getSession(), role: await getUserRole() };
  }
}

// Handle navigation with session preservation
export function navigateTo(url) {
  // Session is automatically preserved in localStorage
  window.location.href = url;
}

// Update navigation visibility based on role
export async function updateNavigation() {
  const adminBtn = document.querySelector('[data-section="admin"], .admin-only, button[href*="index.html"]');

  if (adminBtn) {
    const admin = await isAdmin();
    adminBtn.style.display = admin ? '' : 'none';
  }
}