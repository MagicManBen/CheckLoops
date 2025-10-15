/**
 * Demo Authentication System for CheckLoops
 * Provides instant demo access without requiring signup
 */

const DEMO_USER = {
  email: 'demo@checkloops.com',
  password: 'DemoCheckLoops2024!',
  userId: null, // Will be set after user is created
  siteId: 1,
  displayName: 'Demo User',
  role: 'staff'
};

/**
 * Initialize demo user in Supabase
 * This should be called from server-side or one-time setup
 */
async function setupDemoUser(supabaseAdmin) {
  try {
    // Check if demo user exists
    const { data: existingUser, error: checkError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (checkError) {
      console.error('Error checking for existing users:', checkError);
      return null;
    }

    let demoUser = existingUser.users.find(u => u.email === DEMO_USER.email);

    if (!demoUser) {
      // Create demo user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: DEMO_USER.email,
        password: DEMO_USER.password,
        email_confirm: true,
        user_metadata: {
          full_name: DEMO_USER.displayName,
          is_demo: true
        }
      });

      if (createError) {
        console.error('Error creating demo user:', createError);
        return null;
      }

      demoUser = newUser.user;
    }

    DEMO_USER.userId = demoUser.id;

    // Ensure demo user has master_users entry
    const { data: masterUser, error: masterError } = await supabaseAdmin
      .from('master_users')
      .select('*')
      .eq('auth_user_id', demoUser.id)
      .single();

    if (masterError && masterError.code === 'PGRST116') {
      // User doesn't exist, create them
      const { error: insertError } = await supabaseAdmin
        .from('master_users')
        .insert({
          auth_user_id: demoUser.id,
          full_name: DEMO_USER.displayName,
          email: DEMO_USER.email,
          phone: '01234567890',
          role: DEMO_USER.role,
          team_id: null,
          is_admin: false,
          is_active: true,
          is_demo: true,
          holiday_approved: true
        });

      if (insertError) {
        console.error('Error creating master_users entry:', insertError);
        return null;
      }
    }

    // Ensure demo user is linked to site 1
    const { data: teamMember, error: teamError } = await supabaseAdmin
      .from('team_members')
      .select('*')
      .eq('user_id', demoUser.id)
      .eq('site_id', DEMO_USER.siteId)
      .single();

    if (teamError && teamError.code === 'PGRST116') {
      // Link user to site
      const { error: linkError } = await supabaseAdmin
        .from('team_members')
        .insert({
          user_id: demoUser.id,
          site_id: DEMO_USER.siteId,
          role: DEMO_USER.role,
          is_active: true
        });

      if (linkError) {
        console.error('Error linking user to site:', linkError);
        return null;
      }
    }

    console.log('Demo user setup complete:', demoUser.id);
    return demoUser;
  } catch (error) {
    console.error('Error in setupDemoUser:', error);
    return null;
  }
}

/**
 * Sign in as demo user
 */
async function signInAsDemo(supabase) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: DEMO_USER.email,
      password: DEMO_USER.password
    });

    if (error) {
      console.error('Demo login error:', error);
      return { success: false, error };
    }

    // Store demo flag in session
    localStorage.setItem('isDemoUser', 'true');
    localStorage.setItem('demoSiteId', DEMO_USER.siteId.toString());

    return { success: true, session: data.session };
  } catch (error) {
    console.error('Demo login exception:', error);
    return { success: false, error };
  }
}

/**
 * Check if current user is demo user
 */
function isDemoUser() {
  return localStorage.getItem('isDemoUser') === 'true';
}

/**
 * Get demo site ID
 */
function getDemoSiteId() {
  return parseInt(localStorage.getItem('demoSiteId') || '1');
}

/**
 * Clear demo flags on sign out
 */
function clearDemoFlags() {
  localStorage.removeItem('isDemoUser');
  localStorage.removeItem('demoSiteId');
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.demoAuth = {
    signInAsDemo,
    isDemoUser,
    getDemoSiteId,
    clearDemoFlags,
    DEMO_USER
  };
}
