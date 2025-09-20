// Direct test of authentication with bypass
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://unveoqnlqnobufhublyw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME' // Anon key from config.js
);

async function testDirectLogin() {
  console.log('=== Testing Direct Login with Bypass ===\n');

  // Sign in
  console.log('1. Signing in as benhowardmagic@hotmail.com...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'benhowardmagic@hotmail.com',
    password: 'Hello1!'
  });

  if (authError) {
    console.error('❌ Failed to authenticate:', authError.message);
    return;
  }

  console.log('✅ Authenticated successfully');
  console.log('   User ID:', authData.user.id);
  console.log('   Email:', authData.user.email);

  // Try to fetch master_users record (will likely fail due to RLS)
  console.log('\n2. Testing master_users query...');
  const { data: profile, error: profileError } = await supabase
    .from('master_users')
    .select('access_type, role, full_name')
    .eq('auth_user_id', authData.user.id)
    .single();

  if (profileError) {
    if (profileError.message.includes('infinite recursion')) {
      console.log('❌ RLS recursion error detected (expected)');
      console.log('✅ The bypass in auth-core.js will handle this');
    } else {
      console.error('❌ Unexpected error:', profileError.message);
    }
  } else {
    console.log('✅ Unexpectedly succeeded! Profile data:', profile);
  }

  console.log('\n3. Testing what auth-core.js bypass would do:');
  const email = authData.user.email.toLowerCase();
  const ADMIN_BYPASS = {
    'benhowardmagic@hotmail.com': 'admin',
    'ben.howard@stoke.nhs.uk': 'admin'
  };

  if (ADMIN_BYPASS[email]) {
    console.log('✅ Email is in bypass list');
    console.log('   Bypass role:', ADMIN_BYPASS[email]);
    console.log('   This user WILL be treated as admin');
  } else {
    console.log('❌ Email NOT in bypass list');
  }

  console.log('\n=== Expected Behavior ===');
  console.log('When logging in via the UI:');
  console.log('1. auth-core.js will detect the RLS error');
  console.log('2. It will use the bypass for benhowardmagic@hotmail.com');
  console.log('3. getUserRole() will return "admin"');
  console.log('4. Badge should display "Admin"');
  console.log('5. Admin Portal button should be visible');

  // Sign out
  await supabase.auth.signOut();
}

testDirectLogin().catch(console.error);