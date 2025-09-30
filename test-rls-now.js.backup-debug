#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const ANON_KEY = 'sb_publishable_wpy7lxfbI2HwvsznlWJVKg_Zx7HnAc4';
const SERVICE_KEY = 'sb_secret_ylIhDtikpno4LTTUmpDJvw_Ov7BtIEp';

console.log('\nTesting current RLS status after policy creation...\n');

// Test location
const TEST_LOCATION = '1-11309361439'; // Groves Medical Centre

async function testCurrentRLS() {
  const anonClient = createClient(SUPABASE_URL, ANON_KEY);
  const serviceClient = createClient(SUPABASE_URL, SERVICE_KEY);

  // Simple test update
  const testUpdate = {
    website: 'www.test-website.com',
    main_phone_number: '01234567890',
    constituency: 'Kingston and Surbiton',
    provider_constituency: 'Kingston and Surbiton',
    updated_at: new Date().toISOString()
  };

  console.log('1. Testing with ANON KEY...');
  const { data: anonData, error: anonError } = await anonClient
    .from('CQC All GPs')
    .update(testUpdate)
    .eq('location_id', TEST_LOCATION)
    .select();

  if (anonError) {
    console.log('   ERROR:', anonError.message);
  } else if (!anonData || anonData.length === 0) {
    console.log('   ❌ BLOCKED: 0 rows returned (RLS still blocking!)');
  } else {
    console.log('   ✅ SUCCESS: Updated', anonData.length, 'rows');
  }

  console.log('\n2. Testing with SERVICE KEY...');
  const { data: serviceData, error: serviceError } = await serviceClient
    .from('CQC All GPs')
    .update(testUpdate)
    .eq('location_id', TEST_LOCATION)
    .select('location_id, website, main_phone_number, constituency');

  if (serviceError) {
    console.log('   ERROR:', serviceError.message);
  } else if (!serviceData || serviceData.length === 0) {
    console.log('   ❌ FAILED: 0 rows');
  } else {
    console.log('   ✅ SUCCESS: Updated fields:', serviceData[0]);
  }

  console.log('\n3. Checking what fields are actually NULL...');
  const { data: checkData } = await serviceClient
    .from('CQC All GPs')
    .select(`
      location_id,
      constituency,
      provider_constituency,
      main_phone_number,
      website,
      current_ratings,
      historic_ratings,
      key_question_ratings
    `)
    .eq('location_id', TEST_LOCATION)
    .single();

  console.log('   Current values:');
  console.log('   - constituency:', checkData.constituency || 'NULL');
  console.log('   - provider_constituency:', checkData.provider_constituency || 'NULL');
  console.log('   - main_phone_number:', checkData.main_phone_number || 'NULL');
  console.log('   - website:', checkData.website || 'NULL');
  console.log('   - current_ratings:', checkData.current_ratings ? 'Has data' : 'NULL');
  console.log('   - historic_ratings:', checkData.historic_ratings ? 'Has data' : 'NULL');
  console.log('   - key_question_ratings:', checkData.key_question_ratings ? 'Has data' : 'NULL');
}

testCurrentRLS().catch(console.error);
