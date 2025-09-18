import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkDatabase() {
  console.log('Checking live Supabase database...\n');

  // Check holiday_summary view
  console.log('1. Checking holiday_summary view:');
  const { data: holidaySummary, error: summaryError } = await supabase
    .from('holiday_summary')
    .select('*')
    .limit(2);

  if (summaryError) {
    console.log('Error:', summaryError.message);
  } else {
    console.log('Sample data:', JSON.stringify(holidaySummary, null, 2));
  }

  // Check 1_staff_holiday_profiles
  console.log('\n2. Checking 1_staff_holiday_profiles:');
  const { data: profiles, error: profilesError } = await supabase
    .from('1_staff_holiday_profiles')
    .select('*')
    .limit(2);

  if (profilesError) {
    console.log('Error:', profilesError.message);
  } else {
    console.log('Sample data:', JSON.stringify(profiles, null, 2));
  }

  // Check 2_staff_entitlements
  console.log('\n3. Checking 2_staff_entitlements:');
  const { data: entitlements, error: entError } = await supabase
    .from('2_staff_entitlements')
    .select('*')
    .limit(2);

  if (entError) {
    console.log('Error:', entError.message);
  } else {
    console.log('Sample data:', JSON.stringify(entitlements, null, 2));
  }

  // Check 3_staff_working_patterns
  console.log('\n4. Checking 3_staff_working_patterns:');
  const { data: patterns, error: patternError } = await supabase
    .from('3_staff_working_patterns')
    .select('*')
    .limit(2);

  if (patternError) {
    console.log('Error:', patternError.message);
  } else {
    console.log('Sample data:', JSON.stringify(patterns, null, 2));
  }

  // Check 4_holiday_requests
  console.log('\n5. Checking 4_holiday_requests:');
  const { data: requests, error: reqError } = await supabase
    .from('4_holiday_requests')
    .select('*')
    .limit(2);

  if (reqError) {
    console.log('Error:', reqError.message);
  } else {
    console.log('Sample data:', JSON.stringify(requests, null, 2));
  }

  process.exit(0);
}

checkDatabase().catch(console.error);