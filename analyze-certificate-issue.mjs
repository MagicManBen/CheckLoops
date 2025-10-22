import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseServiceKey = 'sb_secret_nV3xSrLVHL50Zqp_DeZsgA_lLAYAaQs';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findCertificateIssue() {
  console.log('🔍 Finding the certificate URL issue...\n');

  // Get ALL records for user to see the pattern
  console.log('📊 Checking ALL records for user 61b3f0ba-1ffc-4bfc-82f6-30148aa62b76...\n');
  const { data: allRecords } = await supabase
    .from('training_records')
    .select('id,user_id,site_id,training_type_id,completion_date,expiry_date,certificate_url,created_at')
    .eq('user_id', '61b3f0ba-1ffc-4bfc-82f6-30148aa62b76')
    .order('created_at', { ascending: false })
    .limit(50);

  if (allRecords && allRecords.length > 0) {
    console.log(`Found ${allRecords.length} total records:\n`);
    
    // Group by training type
    const grouped = {};
    allRecords.forEach(rec => {
      if (!grouped[rec.training_type_id]) {
        grouped[rec.training_type_id] = [];
      }
      grouped[rec.training_type_id].push(rec);
    });

    // Show type 66 specifically
    if (grouped[66]) {
      console.log('📋 TYPE 66 (Information Governance / Data Security Awareness):');
      console.log(`   Found ${grouped[66].length} records\n`);
      
      grouped[66].forEach((rec, idx) => {
        const hasCert = rec.certificate_url ? '✅' : '❌';
        console.log(`   Record ${idx + 1} (ID: ${rec.id}):`);
        console.log(`     Completion: ${rec.completion_date}`);
        console.log(`     Expiry: ${rec.expiry_date}`);
        console.log(`     ${hasCert} Certificate: ${rec.certificate_url || 'NULL'}`);
        console.log(`     Created: ${rec.created_at}`);
        console.log();
      });
    }

    // Show type 70 for comparison (has some certificates)
    if (grouped[70]) {
      console.log('📋 TYPE 70 (for comparison - some have certificates):');
      grouped[70].slice(0, 3).forEach((rec, idx) => {
        const hasCert = rec.certificate_url ? '✅' : '❌';
        console.log(`   Record ${idx + 1}: ${hasCert} ${rec.certificate_url || 'NULL'}`);
      });
    }

    // Analyze the pattern
    console.log('\n\n📊 PATTERN ANALYSIS:');
    console.log('Records WITHOUT certificates:');
    allRecords.filter(r => !r.certificate_url).forEach(rec => {
      console.log(`  - Type ${rec.training_type_id}: created ${new Date(rec.created_at).toLocaleString()}`);
    });

    console.log('\n\nRecords WITH certificates:');
    allRecords.filter(r => r.certificate_url).slice(0, 5).forEach(rec => {
      console.log(`  - Type ${rec.training_type_id}: ${rec.certificate_url.substring(rec.certificate_url.lastIndexOf('/')+1)}`);
    });
  }

  // Check storage to see what's actually there
  console.log('\n\n📦 Storage bucket contents (training_certificates):');
  const { data: files } = await supabase.storage
    .from('training_certificates')
    .list('', {
      limit: 100,
      offset: 0,
      sortBy: { column: 'updated_at', order: 'desc' }
    });

  if (files && files.length > 0) {
    console.log(`Found ${files.length} files\n`);
    files.slice(0, 20).forEach((file, idx) => {
      if (file.id !== '2') { // Skip the folder marker
        console.log(`  ${idx + 1}. ${file.name}`);
      }
    });
  }

  console.log('\n\n🎯 CONCLUSION:');
  console.log('The records are being created, but certificate_url is NULL.');
  console.log('This happens because window.uploadedFile is null when saveTrainingRecord() is called.');
  console.log('\nFix applied: Added validation to require a file before saving.');
}

findCertificateIssue().catch(console.error);
