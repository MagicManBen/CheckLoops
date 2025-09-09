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
    // Refresh session to ensure we have the latest token
    await supabase.auth.refreshSession();
    
    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      console.log('❌ No active session found');
      return false;
    }
    
    // Check user's role in profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', session.user.id)
      .maybeSingle();
      
    if (profileError) {
      console.error('Error checking admin role:', profileError);
      return false;
    }
    
    // Check if role is admin or owner
    const isAdmin = profile && ['admin', 'owner'].includes(profile.role?.toLowerCase());
    
    if (!isAdmin) {
      console.log('❌ User does not have admin privileges');
      return false;
    }
    
    console.log('✅ Admin access confirmed for', session.user.email);
    return true;
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
      // Sign out and redirect to admin login
      await supabase.auth.signOut();
      alert('Admin privileges required. Please log in with an administrator account.');
      window.location.replace('admin-login.html');
      return null;
    }
    
    // Return session and supabase instance if admin access confirmed
    const { data: { session } } = await supabase.auth.getSession();
    return { supabase, session };
  } catch (err) {
    console.error('Error requiring admin session:', err);
    window.location.replace('admin-login.html');
    return null;
  }
}
