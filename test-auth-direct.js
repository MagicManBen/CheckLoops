// Test authentication with service role to bypass RLS
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://unveoqnlqnobufhublyw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc',
  {
    auth: {
      persistSession: false
    }
  }
);

async function testDirect() {
  console.log('=== Testing Direct Database Access ===\n');

  // 1. Check Ben's master_users record directly
  console.log('1. Fetching Ben\'s master_users record directly...');
  const { data: profile, error: profileError } = await supabase
    .from('master_users')
    .select('auth_user_id, email, access_type, role, role_detail, full_name')
    .eq('email', 'benhowardmagic@hotmail.com')
    .single();

  if (profileError) {
    console.error('❌ Failed to fetch profile:', profileError.message);
    return;
  }

  console.log('✅ Master_users record:');
  console.log('   auth_user_id:', profile.auth_user_id);
  console.log('   email:', profile.email);
  console.log('   access_type:', profile.access_type);
  console.log('   role:', profile.role);
  console.log('   role_detail:', profile.role_detail);
  console.log('   full_name:', profile.full_name);

  // 2. Check what auth-core.js would determine
  console.log('\n2. Auth-core.js logic:');
  const effectiveRole = (profile.access_type || profile.role || 'staff').toLowerCase();
  console.log('   Effective role:', effectiveRole);
  console.log('   Is Admin?:', effectiveRole === 'admin' || effectiveRole === 'owner');

  // 3. Check what UI would display
  console.log('\n3. UI Display:');
  const displayRole = profile.access_type
    ? profile.access_type.charAt(0).toUpperCase() + profile.access_type.slice(1).toLowerCase()
    : 'Staff';
  console.log('   Badge text should be:', displayRole);

  // 4. Check RLS policies on master_users table
  console.log('\n4. Checking RLS status...');
  try {
    // Try to get RLS status (this requires admin access to database)
    const { data: rlsData, error: rlsError } = await supabase.rpc('get_table_rls_status', {
      table_name: 'master_users'
    });

    if (rlsError) {
      console.log('   Cannot check RLS status (function may not exist)');
    } else {
      console.log('   RLS enabled:', rlsData);
    }
  } catch (e) {
    console.log('   Cannot check RLS status');
  }

  console.log('\n=== Analysis Complete ===');
  console.log('\nSUMMARY:');
  console.log('- Ben\'s access_type is:', profile.access_type);
  console.log('- This SHOULD grant admin access');
  console.log('- Badge SHOULD display:', displayRole);
  console.log('- Admin portal SHOULD be visible');
}

testDirect().catch(console.error);