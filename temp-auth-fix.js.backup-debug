// Temporary fix: Create a bypass for master_users RLS issues
// This modifies auth-core.js to use a different approach

import fs from 'fs';

const authCoreContent = fs.readFileSync('auth-core.js', 'utf8');

// Create a modified version that handles the RLS issue
const modifiedContent = authCoreContent.replace(
  /\/\/ Check master_users table first[\s\S]*?maybeSingle\(\);/,
  `// Check master_users table first (source of truth)
  // TEMPORARY FIX: Catching RLS errors and using fallback
  let profile = null;
  try {
    const { data, error } = await supabase
      .from('master_users')
      .select('access_type, role')
      .eq('auth_user_id', currentSession.user.id)
      .maybeSingle();

    if (error && error.message.includes('infinite recursion')) {
      console.warn('RLS recursion issue detected, using metadata fallback');
    } else if (!error) {
      profile = data;
    }
  } catch (e) {
    console.warn('Failed to fetch profile:', e);
  }`
);

// Also add a fallback for when profile fetch fails
const finalContent = modifiedContent.replace(
  'if (profile) {',
  `if (profile) {`
).replace(
  '// Fallback to user metadata',
  `// Enhanced fallback for RLS issues
  // If we couldn't fetch the profile due to RLS, check if user is known admin
  const email = currentSession.user?.email?.toLowerCase();
  if (!profile && email === 'benhowardmagic@hotmail.com') {
    console.log('Known admin user detected, granting admin role');
    userRole = 'admin';
    return userRole;
  }

  // Fallback to user metadata`
);

fs.writeFileSync('auth-core-fixed.js', finalContent);
console.log('Created auth-core-fixed.js with RLS workaround');

// Also create a config with temporary fix
const configFix = `// Temporary configuration adjustment for RLS issues
// This adds a bypass for known admin users

window.RLS_BYPASS_USERS = {
  'benhowardmagic@hotmail.com': {
    access_type: 'admin',
    role: 'admin',
    full_name: 'Ben Howard'
  }
};

// Function to check if current user needs RLS bypass
window.checkRLSBypass = function(email) {
  const bypass = window.RLS_BYPASS_USERS[email?.toLowerCase()];
  if (bypass) {
    console.log('Using RLS bypass for:', email);
    return bypass;
  }
  return null;
};
`;

fs.writeFileSync('rls-bypass-config.js', configFix);
console.log('Created rls-bypass-config.js');

console.log('\nTo apply the fix:');
console.log('1. Replace auth-core.js with auth-core-fixed.js');
console.log('2. Include rls-bypass-config.js in your HTML files before other scripts');
console.log('\nThis is a temporary workaround until RLS policies can be fixed in Supabase dashboard.');