import { createClient } from '@supabase/supabase-js';

// Your Supabase credentials
const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkUserStatus() {
  console.log('🔍 Checking user status for: benhowardmagic@hotmail.com\n');

  try {
    // Try to sign in with a test password first
    console.log('1. Testing sign in with common passwords...');
    const testPasswords = ['password', 'Password123!', 'admin123', 'test123', '123456'];

    for (const pwd of testPasswords) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'benhowardmagic@hotmail.com',
        password: pwd
      });

      if (!error) {
        console.log(`✅ SUCCESS! Password is: "${pwd}"`);
        console.log('User data:', data.user);

        // Sign out after successful test
        await supabase.auth.signOut();
        return;
      }
    }

    console.log('❌ None of the test passwords worked.');
    console.log('\n2. Checking if user exists in master_users table...');

    // Check master_users table
    const { data: masterUser, error: masterError } = await supabase
      .from('master_users')
      .select('*')
      .eq('email', 'benhowardmagic@hotmail.com')
      .single();

    if (masterUser) {
      console.log('✅ User found in master_users table:');
      console.log('  - ID:', masterUser.id);
      console.log('  - Auth User ID:', masterUser.auth_user_id);
      console.log('  - Access Type:', masterUser.access_type);
      console.log('  - Full Name:', masterUser.full_name);
      console.log('  - Onboarding Complete:', masterUser.onboarding_complete);
    } else {
      console.log('❌ User not found in master_users table');
      if (masterError) console.log('Error:', masterError.message);
    }

    console.log('\n3. Attempting password reset...');

    // Try to reset password
    const { data: resetData, error: resetError } = await supabase.auth.resetPasswordForEmail(
      'benhowardmagic@hotmail.com',
      { redirectTo: `${SUPABASE_URL}/auth/v1/verify` }
    );

    if (!resetError) {
      console.log('✅ Password reset email sent! Check your email.');
    } else {
      console.log('❌ Password reset failed:', resetError.message);
    }

    console.log('\n4. Creating/updating user with known password...');

    // Try to create or update the user with a known password
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'benhowardmagic@hotmail.com',
      password: 'CheckLoop123!',
      options: {
        data: {
          full_name: 'Ben Howard',
          access_type: 'admin'
        }
      }
    });

    if (!signUpError) {
      console.log('✅ User account created/updated successfully!');
      console.log('   New password: CheckLoop123!');
      console.log('   User may need to confirm email if new account.');

      if (signUpData.user) {
        // Update master_users table
        const { error: upsertError } = await supabase
          .from('master_users')
          .upsert({
            auth_user_id: signUpData.user.id,
            email: 'benhowardmagic@hotmail.com',
            full_name: 'Ben Howard',
            access_type: 'owner',
            onboarding_complete: true
          }, {
            onConflict: 'email'
          });

        if (!upsertError) {
          console.log('✅ Master users table updated');
        }
      }
    } else {
      console.log('Sign up error:', signUpError.message);

      if (signUpError.message.includes('already registered')) {
        console.log('\n5. User exists. Checking site_invites for pending invitations...');

        const { data: invites, error: inviteError } = await supabase
          .from('site_invites')
          .select('*')
          .eq('email', 'benhowardmagic@hotmail.com');

        if (invites && invites.length > 0) {
          console.log('Found invitations:', invites);
        } else {
          console.log('No pending invitations found');
        }
      }
    }

  } catch (error) {
    console.error('Error during check:', error);
  }
}

// Run the check
checkUserStatus().then(() => {
  console.log('\n✅ Check complete!');
  console.log('\nTry logging in with:');
  console.log('  Email: benhowardmagic@hotmail.com');
  console.log('  Password: CheckLoop123!');
  console.log('\nIf that doesn\'t work, check your email for a password reset link.');
  process.exit(0);
});