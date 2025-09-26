#!/usr/bin/env node

// Test script to verify Supabase setup for NHS/CQC integration
// Run with: node test-supabase-setup.js

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_ylIhDtikpno4LTTUmpDJvw_Ov7BtIEp';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Required columns for full integration
const REQUIRED_COLUMNS = [
  'location_id', 'location_name', 'provider_id', 'provider_name',
  'nhs_ods_data', 'last_nhs_update', 'nhs_last_updated', 'ods_code',
  'location_source', 'provider_source',
  'address_line_1', 'address_line_2', 'town_city', 'county', 'postcode',
  'latitude', 'longitude', 'main_phone_number', 'website',
  'overall_rating', 'current_ratings', 'last_inspection_date'
];

async function checkDatabase() {
  console.log('🔍 CHECKING DATABASE STRUCTURE...\n');

  try {
    // Get a sample row to check columns
    const { data: sampleRow, error } = await supabase
      .from('CQC All GPs')
      .select('*')
      .limit(1)
      .single();

    if (error && !error.message.includes('0 rows')) {
      console.error('❌ Error accessing table:', error.message);
      return;
    }

    const existingColumns = sampleRow ? Object.keys(sampleRow) : [];
    console.log(`📊 Found ${existingColumns.length} columns in table\n`);

    // Check for missing columns
    const missingColumns = REQUIRED_COLUMNS.filter(col => !existingColumns.includes(col));
    const presentColumns = REQUIRED_COLUMNS.filter(col => existingColumns.includes(col));

    console.log(`✅ PRESENT COLUMNS (${presentColumns.length}/${REQUIRED_COLUMNS.length}):`);
    presentColumns.forEach(col => console.log(`   - ${col}`));

    if (missingColumns.length > 0) {
      console.log(`\n❌ MISSING COLUMNS (${missingColumns.length}):`);
      missingColumns.forEach(col => console.log(`   - ${col}`));
      console.log('\n⚠️  ACTION REQUIRED: Run COMPLETE_MIGRATION.sql in Supabase SQL Editor');
    } else {
      console.log('\n✅ All required columns are present!');
    }

    // Check for data
    const { count } = await supabase
      .from('CQC All GPs')
      .select('*', { count: 'exact', head: true });

    console.log(`\n📈 Total rows in table: ${count || 0}`);

    // Check for rows with NHS data
    const { count: nhsCount } = await supabase
      .from('CQC All GPs')
      .select('*', { count: 'exact', head: true })
      .not('nhs_ods_data', 'is', null);

    console.log(`   Rows with NHS data: ${nhsCount || 0}`);

    // Check for rows with ODS codes
    const { count: odsCount } = await supabase
      .from('CQC All GPs')
      .select('*', { count: 'exact', head: true })
      .not('ods_code', 'is', null)
      .neq('ods_code', '');

    console.log(`   Rows with ODS codes: ${odsCount || 0}`);

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

async function checkEdgeFunctions() {
  console.log('\n🔍 CHECKING EDGE FUNCTIONS...\n');

  try {
    // Test fetch-nhs-data-complete
    const { data, error } = await supabase.functions.invoke('fetch-nhs-data-complete', {
      body: { location_id: 'test', data_sources: [] }
    });

    if (error) {
      if (error.message?.includes('not found')) {
        console.log('❌ fetch-nhs-data-complete: NOT DEPLOYED');
        console.log('   Run: supabase functions deploy fetch-nhs-data-complete');
      } else {
        console.log('⚠️  fetch-nhs-data-complete: Function exists but returned error');
        console.log(`   ${error.message}`);
      }
    } else {
      console.log('✅ fetch-nhs-data-complete: DEPLOYED AND RESPONDING');
      if (data?.status) {
        console.log(`   Status: ${data.status}`);
      }
    }

    // Test fetch-cqc-details (legacy)
    const { error: cqcError } = await supabase.functions.invoke('fetch-cqc-details', {
      body: { location_id: 'test' }
    });

    if (cqcError) {
      if (cqcError.message?.includes('not found')) {
        console.log('ℹ️  fetch-cqc-details: Not deployed (legacy function, not required)');
      } else {
        console.log('✅ fetch-cqc-details: Deployed (legacy function)');
      }
    } else {
      console.log('✅ fetch-cqc-details: Deployed (legacy function)');
    }

  } catch (err) {
    console.error('❌ Error checking functions:', err.message);
  }
}

async function testIntegration() {
  console.log('\n🧪 TESTING INTEGRATION WITH SAMPLE DATA...\n');

  try {
    // Get a sample location with an ODS code
    const { data: sample } = await supabase
      .from('CQC All GPs')
      .select('location_id, location_name, ods_code')
      .not('location_id', 'is', null)
      .limit(1)
      .single();

    if (!sample) {
      console.log('ℹ️  No sample data available for testing');
      return;
    }

    console.log(`📍 Testing with: ${sample.location_name || 'Unknown'}`);
    console.log(`   Location ID: ${sample.location_id}`);
    console.log(`   ODS Code: ${sample.ods_code || 'Not set'}`);

    // Test CQC phase
    console.log('\n   Testing CQC phase...');
    const { data: cqcResult, error: cqcError } = await supabase.functions.invoke(
      'fetch-nhs-data-complete',
      {
        body: {
          location_id: sample.location_id,
          data_sources: ['cqc']
        }
      }
    );

    if (cqcError) {
      console.log(`   ❌ CQC phase failed: ${cqcError.message}`);
    } else if (cqcResult) {
      console.log(`   ✅ CQC phase: ${cqcResult.status || 'completed'}`);
      if (cqcResult.database_updated) {
        console.log('      Database updated successfully');
      }
      if (cqcResult.ods_code) {
        console.log(`      ODS code found: ${cqcResult.ods_code}`);
      }
    }

    // Test ODS phase if we have an ODS code
    const odsCode = cqcResult?.ods_code || sample.ods_code;
    if (odsCode) {
      console.log('\n   Testing ODS phase...');
      const { data: odsResult, error: odsError } = await supabase.functions.invoke(
        'fetch-nhs-data-complete',
        {
          body: {
            location_id: sample.location_id,
            ods_code: odsCode,
            data_sources: ['ods']
          }
        }
      );

      if (odsError) {
        console.log(`   ❌ ODS phase failed: ${odsError.message}`);
      } else if (odsResult) {
        console.log(`   ✅ ODS phase: ${odsResult.status || 'completed'}`);
        if (odsResult.database_updated) {
          console.log('      Database updated successfully');
        }
        if (odsResult.data?.ods_data) {
          console.log('      NHS ODS data fetched');
        }
      }
    } else {
      console.log('\n   ℹ️  No ODS code available for testing ODS phase');
    }

  } catch (err) {
    console.error('❌ Integration test error:', err.message);
  }
}

async function main() {
  console.log('=' .repeat(50));
  console.log('SUPABASE NHS/CQC INTEGRATION CHECK');
  console.log('=' .repeat(50));

  await checkDatabase();
  await checkEdgeFunctions();
  await testIntegration();

  console.log('\n' + '=' .repeat(50));
  console.log('CHECK COMPLETE');
  console.log('=' .repeat(50));

  if (process.argv.includes('--fix')) {
    console.log('\n📝 To fix any issues:');
    console.log('1. Run COMPLETE_MIGRATION.sql in Supabase SQL Editor');
    console.log('2. Deploy edge function: supabase functions deploy fetch-nhs-data-complete');
    console.log('3. Test with cqctest-detailed-full-fixed.html');
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkDatabase, checkEdgeFunctions, testIntegration };