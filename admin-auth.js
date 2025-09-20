// Admin authentication helper
// This file provides consistent Supabase initialization for admin pages

// Initialize Supabase with consistent auth settings
export async function initAdminSupabase() {
  try {
    // Import Supabase client
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    
    // Create client with settings matching staff-common.js
    const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
      auth: { 
        persistSession: true, 
        autoRefreshToken: true, 
        detectSessionInUrl: true, 
        flowType: 'pkce' 
      }
    });
    
    return supabase;
  } catch (err) {
    console.error('Failed to initialize admin Supabase client:', err);
    throw err;
  }
}

// Check if user has admin privileges
export async function checkAdminAccess(supabase) {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
      console.log('❌ No active session found');
      return false;
    }

    // Authoritative check: master_users.access_type only
    const { data: profile, error: profileError } = await supabase
      .from('master_users')
      .select('access_type')
      .eq('auth_user_id', session.user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Failed to load master_users profile:', profileError);
      return false;
    }

    const accessType = String(profile?.access_type || '').toLowerCase();
    const isAdmin = accessType === 'admin' || accessType === 'owner';
    console.log('Admin access via master_users.access_type:', accessType, '=>', isAdmin);
    return isAdmin;
  } catch (err) {
    console.error('Error checking admin access:', err);
    return false;
  }
}

// Require admin session or redirect
export async function requireAdminSession() {
  try {
    const supabase = await initAdminSupabase();
    const isAdmin = await checkAdminAccess(supabase);
    
    if (!isAdmin) {
      // Sign out and redirect to staff login per navigation rules
      await supabase.auth.signOut();
      window.location.replace('home.html');
      return null;
    }
    
    // Return session and supabase instance if admin access confirmed
    const { data: { session } } = await supabase.auth.getSession();
    return { supabase, session };
  } catch (err) {
    console.error('Error requiring admin session:', err);
    window.location.replace('home.html');
    return null;
  }
}
