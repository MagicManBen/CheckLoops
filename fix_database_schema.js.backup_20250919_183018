import { createClient } from '@supabase/supabase-js';

async function fixDatabaseSchema() {
  const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME';
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log('=== DATABASE SCHEMA CHECK ===\n');

  // 1. Check profiles table constraint
  console.log('1. Checking profiles table role constraint...');
  try {
    // Try to insert a test record with role='gp'
    const testData = {
      user_id: '00000000-0000-0000-0000-000000000000',
      role: 'gp',
      full_name: 'Test GP'
    };

    const { error } = await supabase
      .from('profiles')
      .upsert(testData)
      .select();

    if (error && error.code === '23514') {
      console.log('   ❌ profiles_role_chk constraint is blocking "gp" value');
      console.log('   Fix needed: ALTER TABLE profiles DROP CONSTRAINT profiles_role_chk;');
      console.log('   Then: ALTER TABLE profiles ADD CONSTRAINT profiles_role_chk CHECK (role IN (\'admin\', \'staff\', \'gp\', \'doctor\', \'nurse\', \'receptionist\', \'manager\', \'pharmacist\'));');
    } else if (error) {
      console.log('   Other error:', error.message);
    } else {
      console.log('   ✅ "gp" role is allowed');
      // Clean up test record
      await supabase.from('profiles').delete().eq('user_id', '00000000-0000-0000-0000-000000000000');
    }
  } catch (e) {
    console.error('   Error checking constraint:', e);
  }

  // 2. Check teams table columns
  console.log('\n2. Checking teams table columns...');
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .limit(1);

    if (error && error.message.includes('auth_user_id')) {
      console.log('   ❌ teams table has RLS policy referencing non-existent auth_user_id column');
      console.log('   Fix needed: Update RLS policy to use auth.uid() instead of auth_user_id');
    } else if (error) {
      console.log('   Other error:', error.message);
    } else {
      console.log('   ✅ teams table query works');
      if (data && data[0]) {
        console.log('   Columns:', Object.keys(data[0]).join(', '));
      }
    }
  } catch (e) {
    console.error('   Error checking teams:', e);
  }

  // 3. Check 1_staff_holiday_profiles columns
  console.log('\n3. Checking 1_staff_holiday_profiles table...');
  try {
    const { data, error } = await supabase
      .from('1_staff_holiday_profiles')
      .select('*')
      .limit(1);

    if (error && error.message.includes('site_id')) {
      console.log('   ❌ Missing site_id column');
      console.log('   Fix needed: ALTER TABLE "1_staff_holiday_profiles" ADD COLUMN site_id integer;');
    } else if (error) {
      console.log('   Other error:', error.message);
    } else {
      console.log('   ✅ Table query works');
      if (data && data[0]) {
        console.log('   Columns:', Object.keys(data[0]).join(', '));
      }
    }
  } catch (e) {
    console.error('   Error checking holiday profiles:', e);
  }

  // 4. Check staff_app_welcome table
  console.log('\n4. Checking staff_app_welcome table...');
  try {
    const { data, error } = await supabase
      .from('staff_app_welcome')
      .select('*')
      .limit(1);

    if (error) {
      console.log('   Error:', error.message);
      if (error.code === '42P01') {
        console.log('   ❌ Table does not exist');
        console.log('   Fix needed: Create staff_app_welcome table');
      }
    } else {
      console.log('   ✅ Table exists');
      if (data && data[0]) {
        console.log('   Columns:', Object.keys(data[0]).join(', '));
      }
    }
  } catch (e) {
    console.error('   Error checking staff_app_welcome:', e);
  }

  // 5. Check 3_staff_working_patterns table
  console.log('\n5. Checking 3_staff_working_patterns table...');
  try {
    const { data, error } = await supabase
      .from('3_staff_working_patterns')
      .select('*')
      .limit(1);

    if (error) {
      console.log('   Error:', error.message);
    } else {
      console.log('   ✅ Table query works');
      if (data && data[0]) {
        const columns = Object.keys(data[0]);
        console.log('   Has monday_hours?', columns.includes('monday_hours'));
        console.log('   Has monday_sessions?', columns.includes('monday_sessions'));
      }
    }
  } catch (e) {
    console.error('   Error checking working patterns:', e);
  }

  console.log('\n=== SCHEMA CHECK COMPLETE ===');
  console.log('\nSQL Fixes to run in Supabase SQL Editor:');
  console.log('--------------------------------------');
  console.log(`
-- 1. Fix profiles role constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_chk;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_chk
  CHECK (role IN ('admin', 'staff', 'gp', 'doctor', 'nurse', 'receptionist', 'manager', 'pharmacist'));

-- 2. Add site_id to holiday profiles if missing
ALTER TABLE "1_staff_holiday_profiles"
  ADD COLUMN IF NOT EXISTS site_id integer;

-- 3. Create staff_app_welcome table if missing
CREATE TABLE IF NOT EXISTS staff_app_welcome (
  id serial PRIMARY KEY,
  user_id uuid NOT NULL,
  site_id integer,
  nickname text,
  role_detail text,
  team_id integer,
  team_name text,
  avatar_url text,
  working_hours jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Fix teams table RLS if needed (check existing policies first)
-- This needs to be done in the Supabase dashboard under Authentication > Policies
  `);
}

fixDatabaseSchema().catch(console.error);