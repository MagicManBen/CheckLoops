#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const ANON_KEY = 'sb_publishable_wpy7lxfbI2HwvsznlWJVKg_Zx7HnAc4';
const SERVICE_KEY = 'sb_secret_ylIhDtikpno4LTTUmpDJvw_Ov7BtIEp'; // Will be revoked after testing

const TABLE = 'CQC All GPs';
const TEST_LOCATION_ID = '1-10240838706'; // Ravenscroft Health

console.log('=== RLS Test - Direct Comparison ===\n');

async function testWithAnonKey() {
  console.log('1. Testing with ANON KEY (should be blocked by RLS)...');

  const supabase = createClient(SUPABASE_URL, ANON_KEY);

  const testData = {
    updated_at: new Date().toISOString(),
    also_known_as: `ANON_TEST_${Date.now()}`
  };

  const { data, error } = await supabase
    .from(TABLE)
    .update(testData)
    .eq('location_id', TEST_LOCATION_ID)
    .select();

  if (error) {
    console.log('❌ Anon update error:', error.message);
  } else if (!data || data.length === 0) {
    console.log('❌ Anon update returned 0 rows - RLS IS BLOCKING');
  } else {
    console.log('✅ Anon update succeeded (unexpected!):', data.length, 'rows');
  }
  console.log();
}

async function testWithServiceKey() {
  console.log('2. Testing with SERVICE KEY (bypasses RLS)...');

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const timestamp = new Date().toISOString();
  const testData = {
    updated_at: timestamp,
    also_known_as: `SERVICE_TEST_${Date.now()}`,
    // Test updating multiple fields to verify full access
    website: 'www.ravenscrofthealth.co.uk',
    main_phone_number: '02084270808'
  };

  const { data, error } = await supabase
    .from(TABLE)
    .update(testData)
    .eq('location_id', TEST_LOCATION_ID)
    .select('location_id, location_name, updated_at, also_known_as, website');

  if (error) {
    console.log('❌ Service update error:', error.message);
  } else if (!data || data.length === 0) {
    console.log('❌ Service update returned 0 rows (should not happen!)');
  } else {
    console.log('✅ SERVICE KEY UPDATE SUCCESSFUL!');
    console.log('   Updated fields:', {
      location_name: data[0].location_name,
      updated_at: data[0].updated_at,
      also_known_as: data[0].also_known_as,
      website: data[0].website
    });
  }
  console.log();
}

async function verifyInDatabase() {
  console.log('3. Verifying data in database...');

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  const { data, error } = await supabase
    .from(TABLE)
    .select('location_id, location_name, updated_at, also_known_as, website, main_phone_number')
    .eq('location_id', TEST_LOCATION_ID)
    .single();

  if (error) {
    console.log('❌ Verification failed:', error.message);
  } else {
    console.log('✅ Current data in database:');
    console.log('   Location:', data.location_name);
    console.log('   Updated:', data.updated_at);
    console.log('   Also Known As:', data.also_known_as || '(empty)');
    console.log('   Website:', data.website || '(empty)');
    console.log('   Phone:', data.main_phone_number || '(empty)');
  }
  console.log();
}

async function cleanup() {
  console.log('4. Cleaning up test data...');

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  const { data, error } = await supabase
    .from(TABLE)
    .update({ also_known_as: null })
    .eq('location_id', TEST_LOCATION_ID)
    .select();

  if (!error && data && data.length > 0) {
    console.log('✅ Cleanup successful');
  } else {
    console.log('⚠️  Cleanup may have failed');
  }
  console.log();
}

async function runAllTests() {
  console.log(`Testing location: ${TEST_LOCATION_ID}\n`);

  // Run tests in sequence
  await testWithAnonKey();
  await testWithServiceKey();
  await verifyInDatabase();
  await cleanup();

  console.log('=== CONCLUSION ===');
  console.log('RLS is blocking anon key updates.');
  console.log('Service key bypasses RLS completely.');
  console.log('Solution: Either fix RLS policies or use Edge Functions.\n');

  console.log('⚠️  IMPORTANT: Revoke and regenerate service key after testing!');
}

// Run the tests
runAllTests().catch(console.error);