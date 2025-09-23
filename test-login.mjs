import { createClient } from '@supabase/supabase-js';

// Your Supabase credentials
const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testLogin() {
  console.log('🔐 Testing login...\n');

  // Test with the new password
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'benhowardmagic@hotmail.com',
    password: 'CheckLoop123!'
  });

  if (error) {
    console.log('❌ Login failed!');
    console.log('Error:', error.message);
    console.log('Status:', error.status);

    if (error.message.includes('Email not confirmed')) {
      console.log('\n⚠️  User needs to confirm email first!');
      console.log('Check the email inbox for a confirmation link.');
    }
  } else {
    console.log('✅ Login successful!');
    console.log('User ID:', data.user.id);
    console.log('Email:', data.user.email);
    console.log('Email confirmed:', data.user.email_confirmed_at ? 'Yes' : 'No');

    // Check master_users record
    const { data: masterUser } = await supabase
      .from('master_users')
      .select('*')
      .eq('auth_user_id', data.user.id)
      .single();

    if (masterUser) {
      console.log('\n📋 Master User Record:');
      console.log('  Access Type:', masterUser.access_type);
      console.log('  Full Name:', masterUser.full_name);
    } else {
      console.log('\n⚠️  No master_users record found. Creating one...');

      const { error: insertError } = await supabase
        .from('master_users')
        .insert({
          auth_user_id: data.user.id,
          email: data.user.email,
          full_name: 'Ben Howard',
          access_type: 'owner',
          onboarding_complete: true
        });

      if (!insertError) {
        console.log('✅ Master user record created!');
      } else {
        console.log('❌ Failed to create master user:', insertError.message);
      }
    }

    // Sign out
    await supabase.auth.signOut();
  }
}

testLogin().then(() => {
  console.log('\n✅ Test complete!');
  process.exit(0);
});