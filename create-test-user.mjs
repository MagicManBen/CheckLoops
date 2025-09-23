import { createClient } from '@supabase/supabase-js';

// Your Supabase credentials
const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createTestUsers() {
  console.log('🔨 Creating test users...\n');

  // Test user 1 - Staff user
  const testUser1 = {
    email: 'test.staff@checkloop.com',
    password: 'test123',
    fullName: 'Test Staff',
    accessType: 'staff'
  };

  // Test user 2 - Admin user
  const testUser2 = {
    email: 'test.admin@checkloop.com',
    password: 'admin123',
    fullName: 'Test Admin',
    accessType: 'admin'
  };

  const users = [testUser1, testUser2];

  for (const user of users) {
    console.log(`\n📧 Creating user: ${user.email}`);

    // First try to sign in (in case user already exists)
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: user.password
    });

    if (signInData?.user) {
      console.log(`✅ User already exists and can login!`);

      // Update master_users
      const { error: upsertError } = await supabase
        .from('master_users')
        .upsert({
          auth_user_id: signInData.user.id,
          email: user.email,
          full_name: user.fullName,
          access_type: user.accessType,
          onboarding_complete: true
        }, {
          onConflict: 'email'
        });

      if (!upsertError) {
        console.log(`✅ Master users record updated`);
      }

      await supabase.auth.signOut();
      continue;
    }

    // Try to sign up new user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: user.email,
      password: user.password,
      options: {
        data: {
          full_name: user.fullName,
          access_type: user.accessType
        },
        emailRedirectTo: `${SUPABASE_URL}`
      }
    });

    if (signUpError) {
      console.log(`❌ Sign up failed: ${signUpError.message}`);

      if (signUpError.message.includes('already registered')) {
        console.log('   User exists but password is different.');
        console.log('   → Send password reset email:');

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(user.email);
        if (!resetError) {
          console.log(`   ✅ Password reset email sent to ${user.email}`);
        }
      }
    } else {
      console.log(`✅ User created successfully!`);

      if (signUpData.user) {
        // Create master_users record
        const { error: insertError } = await supabase
          .from('master_users')
          .upsert({
            auth_user_id: signUpData.user.id,
            email: user.email,
            full_name: user.fullName,
            access_type: user.accessType,
            onboarding_complete: true
          }, {
            onConflict: 'email'
          });

        if (!insertError) {
          console.log(`✅ Master users record created`);
        } else {
          console.log(`⚠️  Master users error: ${insertError.message}`);
        }
      }

      if (signUpData.session) {
        console.log(`   User is confirmed and logged in!`);
        await supabase.auth.signOut();
      } else {
        console.log(`   ⚠️  User needs to confirm email before logging in.`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📋 TEST ACCOUNTS SUMMARY:');
  console.log('='.repeat(60));
  console.log('\nStaff User:');
  console.log('  Email: test.staff@checkloop.com');
  console.log('  Password: test123');
  console.log('\nAdmin User:');
  console.log('  Email: test.admin@checkloop.com');
  console.log('  Password: admin123');
  console.log('\n⚠️  NOTE: If these are new accounts, check email for confirmation links.');
  console.log('='.repeat(60));
}

createTestUsers().then(() => {
  console.log('\n✅ Setup complete!');
  process.exit(0);
}).catch(error => {
  console.error('Error:', error);
  process.exit(1);
});