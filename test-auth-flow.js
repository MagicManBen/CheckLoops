// Test authentication flow for Ben's user
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://unveoqnlqnobufhublyw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc'
);

async function testAuth() {
  console.log('=== Testing Authentication Flow ===\n');

  // 1. Sign in as Ben
  console.log('1. Signing in as benhowardmagic@hotmail.com...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'benhowardmagic@hotmail.com',
    password: 'Hello1!'
  });

  if (authError) {
    console.error('❌ Authentication failed:', authError.message);
    return;
  }

  console.log('✅ Successfully authenticated');
  console.log('   User ID:', authData.user.id);
  console.log('   Email:', authData.user.email);

  // 2. Check master_users record
  console.log('\n2. Fetching master_users record...');
  const { data: profile, error: profileError } = await supabase
    .from('master_users')
    .select('access_type, role, role_detail, full_name')
    .eq('auth_user_id', authData.user.id)
    .single();

  if (profileError) {
    console.error('❌ Failed to fetch profile:', profileError.message);
    return;
  }

  console.log('✅ Master_users record found:');
  console.log('   access_type:', profile.access_type);
  console.log('   role:', profile.role);
  console.log('   role_detail:', profile.role_detail);
  console.log('   full_name:', profile.full_name);

  // 3. Determine effective role (mimicking auth-core.js logic)
  console.log('\n3. Determining effective role...');
  const effectiveRole = (profile.access_type || profile.role || 'staff').toLowerCase();
  console.log('   Effective role:', effectiveRole);
  console.log('   Is Admin?:', effectiveRole === 'admin' || effectiveRole === 'owner');

  // 4. Check what would be displayed in UI (mimicking setTopbar logic)
  console.log('\n4. UI Display values:');
  const displayRole = profile.access_type
    ? profile.access_type.charAt(0).toUpperCase() + profile.access_type.slice(1).toLowerCase()
    : 'Staff';
  console.log('   Badge text:', displayRole);
  console.log('   Should show Admin Portal?:', ['admin', 'owner'].includes(effectiveRole));

  // 5. Test access to admin-protected content
  console.log('\n5. Testing admin access...');
  if (effectiveRole === 'admin' || effectiveRole === 'owner') {
    console.log('✅ User SHOULD have access to:');
    console.log('   - Admin dashboard');
    console.log('   - Admin portal button');
    console.log('   - All admin sections');
  } else {
    console.log('❌ User SHOULD NOT have access to admin areas');
  }

  console.log('\n=== Test Complete ===');

  // Sign out
  await supabase.auth.signOut();
}

testAuth().catch(console.error);