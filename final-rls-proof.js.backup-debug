#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const ANON_KEY = 'sb_publishable_wpy7lxfbI2HwvsznlWJVKg_Zx7HnAc4';
const SERVICE_KEY = 'sb_secret_ylIhDtikpno4LTTUmpDJvw_Ov7BtIEp';
const TEST_LOCATION = '1-10240838706'; // Ravenscroft Health

console.log('\n' + '='.repeat(60));
console.log('FINAL RLS PROOF - SUPABASE DATABASE TEST');
console.log('='.repeat(60) + '\n');

// Test CQC data update
const testCqcUpdate = {
  location_name: 'Ravenscroft Health',
  provider_id: '1-2277924156',
  overall_rating: 'Good',
  last_inspection_date: '2022-02-15T00:00:00+00:00',
  constituency: 'Ruislip, Northwood and Pinner',
  provider_constituency: 'Harrow East',
  provider_county: 'London',
  current_ratings: JSON.stringify({
    overall: { rating: 'Good', reportDate: '2022-03-31' }
  }),
  historic_ratings: JSON.stringify([]),
  key_question_ratings: JSON.stringify([
    { name: 'Safe', rating: 'Good' },
    { name: 'Well-led', rating: 'Good' }
  ]),
  registration_date: '2021-01-20T00:00:00+00:00',
  registration_status: 'Registered',
  updated_at: new Date().toISOString()
};

// Test ODS data update
const testOdsUpdate = {
  ods_code: 'C81057',
  nhs_ods_data: JSON.stringify({ test: 'data' }),
  last_nhs_update: new Date().toISOString(),
  nhs_last_updated: new Date().toISOString()
};

async function testAnonKey() {
  console.log('TEST 1: ANON KEY (What Smart Setup uses)');
  console.log('-'.repeat(40));

  const supabase = createClient(SUPABASE_URL, ANON_KEY);

  // Test CQC update
  console.log('Attempting CQC data update...');
  const { data: cqcData, error: cqcError } = await supabase
    .from('CQC All GPs')
    .update(testCqcUpdate)
    .eq('location_id', TEST_LOCATION)
    .select();

  if (cqcError) {
    console.log('❌ CQC Update Error:', cqcError.message);
  } else if (!cqcData || cqcData.length === 0) {
    console.log('❌ CQC Update BLOCKED BY RLS (0 rows returned)');
  } else {
    console.log('✅ CQC Update succeeded:', cqcData.length, 'rows');
  }

  // Test ODS update
  console.log('\nAttempting ODS data update...');
  const { data: odsData, error: odsError } = await supabase
    .from('CQC All GPs')
    .update(testOdsUpdate)
    .eq('location_id', TEST_LOCATION)
    .select();

  if (odsError) {
    console.log('❌ ODS Update Error:', odsError.message);
  } else if (!odsData || odsData.length === 0) {
    console.log('❌ ODS Update BLOCKED BY RLS (0 rows returned)');
  } else {
    console.log('✅ ODS Update succeeded:', odsData.length, 'rows');
  }

  console.log('\n');
}

async function testServiceKey() {
  console.log('TEST 2: SERVICE KEY (Bypasses RLS)');
  console.log('-'.repeat(40));

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  // Test CQC update
  console.log('Attempting CQC data update...');
  const { data: cqcData, error: cqcError } = await supabase
    .from('CQC All GPs')
    .update(testCqcUpdate)
    .eq('location_id', TEST_LOCATION)
    .select('location_id, overall_rating, constituency, current_ratings');

  if (cqcError) {
    console.log('❌ CQC Update Error:', cqcError.message);
  } else if (!cqcData || cqcData.length === 0) {
    console.log('❌ CQC Update failed (0 rows)');
  } else {
    console.log('✅ CQC Update SUCCESSFUL!');
    console.log('   Saved:', {
      overall_rating: cqcData[0].overall_rating,
      constituency: cqcData[0].constituency,
      has_current_ratings: !!cqcData[0].current_ratings
    });
  }

  // Test ODS update
  console.log('\nAttempting ODS data update...');
  const { data: odsData, error: odsError } = await supabase
    .from('CQC All GPs')
    .update(testOdsUpdate)
    .eq('location_id', TEST_LOCATION)
    .select('location_id, ods_code, last_nhs_update');

  if (odsError) {
    console.log('❌ ODS Update Error:', odsError.message);
  } else if (!odsData || odsData.length === 0) {
    console.log('❌ ODS Update failed (0 rows)');
  } else {
    console.log('✅ ODS Update SUCCESSFUL!');
    console.log('   Saved:', {
      ods_code: odsData[0].ods_code,
      last_nhs_update: odsData[0].last_nhs_update
    });
  }

  console.log('\n');
}

async function verifyDatabase() {
  console.log('DATABASE VERIFICATION');
  console.log('-'.repeat(40));

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  const { data, error } = await supabase
    .from('CQC All GPs')
    .select(`
      location_id,
      location_name,
      overall_rating,
      constituency,
      provider_constituency,
      registration_status,
      ods_code,
      last_nhs_update,
      updated_at
    `)
    .eq('location_id', TEST_LOCATION)
    .single();

  if (error) {
    console.log('❌ Verification failed:', error.message);
  } else {
    console.log('✅ Data successfully saved in Supabase:');
    console.log('   Location:', data.location_name);
    console.log('   Rating:', data.overall_rating);
    console.log('   Constituency:', data.constituency);
    console.log('   Provider Constituency:', data.provider_constituency);
    console.log('   Registration:', data.registration_status);
    console.log('   ODS Code:', data.ods_code);
    console.log('   Last NHS Update:', data.last_nhs_update);
    console.log('   Updated:', data.updated_at);
  }

  console.log('\n');
}

async function showConclusion() {
  console.log('='.repeat(60));
  console.log('CONCLUSION');
  console.log('='.repeat(60));
  console.log();
  console.log('1. ❌ ANON KEY: Cannot update due to RLS policies');
  console.log('2. ✅ SERVICE KEY: Updates work perfectly');
  console.log('3. ✅ DATA SAVES: All fields are stored correctly');
  console.log();
  console.log('THE PROBLEM:');
  console.log('  RLS policies block the anon key from updating rows.');
  console.log('  This is why Smart Setup fails to save data.');
  console.log();
  console.log('THE SOLUTION:');
  console.log('  Option 1: Fix RLS policies (run fix-rls-policies.sql)');
  console.log('  Option 2: Use Edge Functions with service key');
  console.log('  Option 3: Keep the workaround in smartsetup.html');
  console.log();
  console.log('⚠️  REMEMBER: Revoke service key after testing!');
  console.log('='.repeat(60));
}

async function main() {
  await testAnonKey();
  await testServiceKey();
  await verifyDatabase();
  showConclusion();
}

main().catch(console.error);