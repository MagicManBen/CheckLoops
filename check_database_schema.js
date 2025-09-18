import { createClient } from '@supabase/supabase-js';

async function checkDatabaseSchema() {
  const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME';
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log('=== DATABASE SCHEMA CHECK ===\n');

  // Authenticate
  const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
    email: 'benhowardmagic@hotmail.com',
    password: 'Hello1!'
  });

  if (!user) {
    console.error('Authentication failed:', authError);
    return;
  }

  console.log('Authenticated as:', user.email);
  console.log('\n1. Checking 3_staff_working_patterns table...');

  // Test query 3_staff_working_patterns directly
  try {
    const { data, error } = await supabase
      .from('3_staff_working_patterns')
      .select('*')
      .limit(1);

    if (error) {
      console.error('   Error querying 3_staff_working_patterns:', error);
    } else {
      console.log('   ✅ Can query 3_staff_working_patterns');
      if (data && data[0]) {
        console.log('   Columns:', Object.keys(data[0]));
      }
    }
  } catch (e) {
    console.error('   Exception:', e);
  }

  console.log('\n2. Checking profiles table...');
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (error) {
      console.error('   Error querying profiles:', error);
    } else {
      console.log('   ✅ Can query profiles');
      if (data && data[0]) {
        console.log('   Columns:', Object.keys(data[0]));
      }
    }
  } catch (e) {
    console.error('   Exception:', e);
  }

  console.log('\n3. Checking teams table...');
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .limit(1);

    if (error) {
      console.error('   Error querying teams:', error);
    } else {
      console.log('   ✅ Can query teams');
      if (data && data[0]) {
        console.log('   Columns:', Object.keys(data[0]));
      }
    }
  } catch (e) {
    console.error('   Exception:', e);
  }

  console.log('\n4. Checking 1_staff_holiday_profiles table...');
  try {
    const { data, error } = await supabase
      .from('1_staff_holiday_profiles')
      .select('*')
      .limit(1);

    if (error) {
      console.error('   Error querying 1_staff_holiday_profiles:', error);
    } else {
      console.log('   ✅ Can query 1_staff_holiday_profiles');
      if (data && data[0]) {
        console.log('   Columns:', Object.keys(data[0]));
      }
    }
  } catch (e) {
    console.error('   Exception:', e);
  }

  console.log('\n5. Checking 2_staff_entitlements table...');
  try {
    const { data, error } = await supabase
      .from('2_staff_entitlements')
      .select('*')
      .limit(1);

    if (error) {
      console.error('   Error querying 2_staff_entitlements:', error);
    } else {
      console.log('   ✅ Can query 2_staff_entitlements');
      if (data && data[0]) {
        console.log('   Columns:', Object.keys(data[0]));
      }
    }
  } catch (e) {
    console.error('   Exception:', e);
  }

  console.log('\n6. Testing join queries...');

  // Test working patterns with user data
  console.log('   a) Working patterns direct query:');
  try {
    const { data, error } = await supabase
      .from('3_staff_working_patterns')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('      Error:', error.message);
    } else {
      console.log('      ✅ Found', data?.length || 0, 'working pattern(s)');
    }
  } catch (e) {
    console.error('      Exception:', e);
  }

  // Test holiday profiles query
  console.log('   b) Holiday profiles query:');
  try {
    const { data, error } = await supabase
      .from('1_staff_holiday_profiles')
      .select('*')
      .eq('email', user.email);

    if (error) {
      console.error('      Error:', error.message);
    } else {
      console.log('      ✅ Found', data?.length || 0, 'holiday profile(s)');
    }
  } catch (e) {
    console.error('      Exception:', e);
  }

  console.log('\n7. Checking staff_app_welcome table...');
  try {
    const { data, error } = await supabase
      .from('staff_app_welcome')
      .select('*')
      .limit(1);

    if (error) {
      console.error('   Error querying staff_app_welcome:', error);
    } else {
      console.log('   ✅ Can query staff_app_welcome');
      if (data && data[0]) {
        console.log('   Columns:', Object.keys(data[0]));
      }
    }
  } catch (e) {
    console.error('   Exception:', e);
  }

  console.log('\n=== SCHEMA CHECK COMPLETE ===');
  await supabase.auth.signOut();
}

checkDatabaseSchema().catch(console.error);