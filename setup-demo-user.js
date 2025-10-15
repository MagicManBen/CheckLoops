#!/usr/bin/env node

/**
 * Setup Demo User for CheckLoops
 * Run this script with: node setup-demo-user.js
 */

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

const DEMO_USER = {
  email: 'demo@checkloops.com',
  password: 'DemoCheckLoops2024!',
  full_name: 'Demo User',
  site_id: 1
};

async function setupDemoUser() {
  console.log('🚀 Setting up demo user for CheckLoops...\n');

  try {
    // Step 1: Create auth user
    console.log('Step 1: Creating authentication user...');
    const createUserResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY
      },
      body: JSON.stringify({
        email: DEMO_USER.email,
        password: DEMO_USER.password,
        email_confirm: true,
        user_metadata: {
          full_name: DEMO_USER.full_name,
          is_demo: true
        }
      })
    });

    let authUser;
    if (createUserResponse.status === 422) {
      // User already exists, get their ID
      console.log('   ℹ️  User already exists, fetching user ID...');
      const listUsersResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'apikey': SUPABASE_SERVICE_KEY
        }
      });
      
      const { users } = await listUsersResponse.json();
      authUser = users.find(u => u.email === DEMO_USER.email);
      
      if (!authUser) {
        throw new Error('User exists but could not be found');
      }
    } else if (!createUserResponse.ok) {
      const error = await createUserResponse.json();
      throw new Error(`Failed to create user: ${JSON.stringify(error)}`);
    } else {
      const result = await createUserResponse.json();
      authUser = result;
    }

    console.log(`   ✅ Auth user ID: ${authUser.id}\n`);

    // Step 2: Create master_users entry
    console.log('Step 2: Creating master_users entry...');
    const masterUserResponse = await fetch(`${SUPABASE_URL}/rest/v1/master_users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        auth_user_id: authUser.id,
        full_name: DEMO_USER.full_name,
        email: DEMO_USER.email,
        role: 'staff',
        access_type: 'staff',
        site_id: DEMO_USER.site_id,
        active: true,
        holiday_year: new Date().getFullYear(),
        holiday_taken: 0,
        weekly_hours: 37.5
      })
    });

    if (!masterUserResponse.ok && masterUserResponse.status !== 409) {
      const error = await masterUserResponse.text();
      console.log(`   ⚠️  Warning: ${error}`);
    } else {
      console.log('   ✅ Master user entry created\n');
    }

    // Step 3: Link to site
    console.log('Step 3: Linking user to demo site...');
    const teamMemberResponse = await fetch(`${SUPABASE_URL}/rest/v1/team_members`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        user_id: authUser.id,
        site_id: DEMO_USER.site_id,
        role: 'staff'
      })
    });

    if (!teamMemberResponse.ok && teamMemberResponse.status !== 409) {
      const error = await teamMemberResponse.text();
      console.log(`   ⚠️  Warning: ${error}`);
    } else {
      console.log('   ✅ User linked to demo site\n');
    }

    console.log('✨ Demo user setup complete!\n');
    console.log('📧 Email:', DEMO_USER.email);
    console.log('🔑 Password:', DEMO_USER.password);
    console.log('🆔 User ID:', authUser.id);
    console.log('🏢 Site ID:', DEMO_USER.site_id);
    console.log('\n🎉 You can now use the "Access Demo Site Instantly!" button on the landing page\n');

  } catch (error) {
    console.error('❌ Error setting up demo user:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the setup
setupDemoUser();
