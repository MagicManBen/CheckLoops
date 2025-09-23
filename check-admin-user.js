import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkAdminUser() {
  console.log('Checking admin user setup...\n');

  // First, list all auth users to find the correct admin
  const { data: authUser, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.error('Error fetching auth users:', authError);
    return;
  }

  console.log('All auth.users (showing emails):');
  authUser.users.forEach(u => {
    console.log(`   - ${u.email} (ID: ${u.id})`);
  });

  // Check multiple possible admin emails
  const possibleEmails = [
    'ben@laserlearningsolutions.co.uk',
    'benhoward@laserlearningsolutions.co.uk',
    'ben.howard@laserlearningsolutions.co.uk',
    'admin@checkloops.co.uk'
  ];

  let adminAuthUser = null;
  for (const email of possibleEmails) {
    adminAuthUser = authUser.users.find(u => u.email === email);
    if (adminAuthUser) {
      console.log(`\n✅ Found admin user with email: ${email}`);
      break;
    }
  }

  if (!adminAuthUser && authUser.users.length > 0) {
    // Just use the first user for investigation
    adminAuthUser = authUser.users[0];
    console.log(`\n⚠️ Using first user for investigation: ${adminAuthUser.email}`);
  }

  if (!adminAuthUser) {
    console.log('❌ No users found in auth.users table');
    return;
  }

  console.log('✅ Found admin in auth.users:');
  console.log('   - ID:', adminAuthUser.id);
  console.log('   - Email:', adminAuthUser.email);
  console.log('   - Created:', adminAuthUser.created_at);
  console.log('   - Last Sign In:', adminAuthUser.last_sign_in_at);

  // Now check master_users table
  console.log('\nChecking master_users table for benhowardmagic@hotmail.com...');

  // The actual admin user is benhowardmagic@hotmail.com based on auth.users
  const { data: masterUsers, error: masterError } = await supabase
    .from('master_users')
    .select('*');

  if (masterError) {
    console.error('Error fetching master_users:', masterError);
    return;
  }

  console.log(`\nFound ${masterUsers.length} users in master_users table`);

  // Look for the admin user
  const benUser = masterUsers.find(u =>
    u.email === 'benhowardmagic@hotmail.com' ||
    u.auth_user_id === '55f1b4e6-01f4-452d-8d6c-617fe7794873'
  );

  if (!benUser) {
    console.log('\n⚠️ Ben Howard user not found in master_users');
    console.log('All master_users emails:');
    masterUsers.forEach(u => {
      console.log(`   - ${u.email || 'NO EMAIL'} (auth_user_id: ${u.auth_user_id || 'NONE'}, access_type: ${u.access_type})`);
    });
    return;
  }

  const masterUser = benUser;

  console.log('✅ Found in master_users:');
  console.log('   - ID:', masterUser.id);
  console.log('   - Full Name:', masterUser.full_name);
  console.log('   - Email:', masterUser.email);
  console.log('   - Access Type:', masterUser.access_type);
  console.log('   - Site ID:', masterUser.site_id);
  console.log('   - Auth User ID:', masterUser.auth_user_id);
  console.log('   - Created:', masterUser.created_at);

  // Check the actual field name and value
  console.log('\n🔍 Critical check:');
  console.log(`   - access_type field value: "${masterUser.access_type}"`);
  console.log(`   - Is it 'admin'?: ${masterUser.access_type === 'admin'}`);
  console.log(`   - Is it 'owner'?: ${masterUser.access_type === 'owner'}`);
  console.log(`   - Is it 'staff'?: ${masterUser.access_type === 'staff'}`);

  // Show all master_users to understand the data structure
  console.log('\nAll master_users (first 5):');
  const { data: allUsers, error: allError } = await supabase
    .from('master_users')
    .select('id, email, full_name, access_type, auth_user_id, site_id')
    .limit(5);

  if (allError) {
    console.error('Error fetching all users:', allError);
  } else {
    console.table(allUsers);
  }
}

checkAdminUser().catch(console.error);