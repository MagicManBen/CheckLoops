import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseServiceKey = 'sb_secret_nV3xSrLVHL50Zqp_DeZsgA_lLAYAaQs';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugCertificateUrl() {
  console.log('🔍 Debugging certificate_url persistence...\n');

  // First, let's check if the table exists and has any records
  console.log('📋 Checking training_records table...');
  const { data: allRecords, error: allError } = await supabase
    .from('training_records')
    .select('id,user_id,site_id,training_type_id,completion_date,expiry_date,certificate_url,created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (allError) {
    console.error('❌ Error querying training_records:', allError.message);
  } else {
    console.log(`✅ Found ${allRecords?.length || 0} records`);
    if (allRecords && allRecords.length > 0) {
      console.log('\n📊 Recent training records:');
      allRecords.forEach((record, idx) => {
        console.log(`\n  Record ${idx + 1}:`);
        console.log(`    ID: ${record.id}`);
        console.log(`    User ID: ${record.user_id}`);
        console.log(`    Site ID: ${record.site_id}`);
        console.log(`    Training Type ID: ${record.training_type_id}`);
        console.log(`    Completion Date: ${record.completion_date}`);
        console.log(`    Expiry Date: ${record.expiry_date}`);
        console.log(`    Certificate URL: ${record.certificate_url || '❌ NULL/EMPTY'}`);
        console.log(`    Created At: ${record.created_at}`);
      });
    }
  }

  // Check specifically for training_type_id = 66 (Information Governance)
  console.log('\n\n🔎 Looking for training_type_id = 66 records...');
  const { data: typeRecords, error: typeError } = await supabase
    .from('training_records')
    .select('id,user_id,site_id,training_type_id,completion_date,expiry_date,certificate_url,created_at')
    .eq('training_type_id', 66)
    .order('created_at', { ascending: false })
    .limit(5);

  if (typeError) {
    console.error('❌ Error querying type 66 records:', typeError.message);
  } else {
    console.log(`✅ Found ${typeRecords?.length || 0} records with training_type_id = 66`);
    if (typeRecords && typeRecords.length > 0) {
      typeRecords.forEach((record, idx) => {
        console.log(`\n  Record ${idx + 1}:`);
        console.log(`    ID: ${record.id}`);
        console.log(`    User ID: ${record.user_id}`);
        console.log(`    Site ID: ${record.site_id}`);
        console.log(`    Completion Date: ${record.completion_date}`);
        console.log(`    Expiry Date: ${record.expiry_date}`);
        console.log(`    Certificate URL: ${record.certificate_url || '❌ NULL/EMPTY'}`);
        console.log(`    Created At: ${record.created_at}`);
      });
    }
  }

  // Check pending_training_records table if it exists
  console.log('\n\n📋 Checking pending_training_records table...');
  let pendingRecords;
  let pendingError;
  try {
    const result = await supabase
      .from('pending_training_records')
      .select('id,user_id,site_id,training_type_id,completion_date,expiry_date,certificate_url,created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    pendingRecords = result.data;
    pendingError = result.error;
  } catch (err) {
    pendingError = err;
    pendingRecords = null;
  }

  if (pendingError) {
    console.error('❌ Error querying pending_training_records:', pendingError.message);
  } else if (pendingRecords) {
    console.log(`✅ Found ${pendingRecords?.length || 0} pending records`);
    if (pendingRecords && pendingRecords.length > 0) {
      pendingRecords.forEach((record, idx) => {
        console.log(`\n  Pending Record ${idx + 1}:`);
        console.log(`    ID: ${record.id}`);
        console.log(`    User ID: ${record.user_id}`);
        console.log(`    Site ID: ${record.site_id}`);
        console.log(`    Training Type ID: ${record.training_type_id}`);
        console.log(`    Completion Date: ${record.completion_date}`);
        console.log(`    Expiry Date: ${record.expiry_date}`);
        console.log(`    Certificate URL: ${record.certificate_url || '❌ NULL/EMPTY'}`);
        console.log(`    Created At: ${record.created_at}`);
      });
    }
  } else {
    console.log('(pending_training_records table may not exist)');
  }

  // Check if the storage bucket has any files
  console.log('\n\n📦 Checking storage bucket contents...');
  const { data: files, error: storageError } = await supabase
    .storage
    .from('training_certificates')
    .list('', {
      limit: 100,
      offset: 0,
      sortBy: { column: 'updated_at', order: 'desc' }
    });

  if (storageError) {
    console.error('❌ Error listing storage:', storageError.message);
  } else {
    console.log(`✅ Found ${files?.length || 0} files in storage`);
    if (files && files.length > 0) {
      console.log('\n  Recent files:');
      files.slice(0, 10).forEach((file, idx) => {
        console.log(`    ${idx + 1}. ${file.name} (updated: ${file.updated_at})`);
      });
    }
  }

  console.log('\n\n✨ Debug complete!');
}

debugCertificateUrl().catch(console.error);
