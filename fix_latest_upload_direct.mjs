#!/usr/bin/env node

/**
 * FIX is_latest_upload - Direct Supabase Connection
 * 
 * This script connects to your Supabase database and marks
 * the most recent upload per site as is_latest_upload = true
 */

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'YOUR_SERVICE_KEY_HERE';

async function fixLatestUpload() {
  console.log('🔧 Fixing is_latest_upload flag...\n');

  try {
    // Use fetch to call Supabase REST API
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    console.log('1️⃣ Checking current state...');
    
    // Check current state
    const { count: totalCount } = await supabase
      .from('emis_apps_raw')
      .select('*', { count: 'exact', head: true });
    
    const { count: trueCount } = await supabase
      .from('emis_apps_raw')
      .select('*', { count: 'exact', head: true })
      .eq('is_latest_upload', true);
    
    const { count: falseCount } = await supabase
      .from('emis_apps_raw')
      .select('*', { count: 'exact', head: true })
      .eq('is_latest_upload', false);
    
    console.log(`   Total rows: ${totalCount}`);
    console.log(`   is_latest_upload = true: ${trueCount}`);
    console.log(`   is_latest_upload = false: ${falseCount}\n`);
    
    if (trueCount > 0) {
      console.log('✅ Already have rows marked as latest. Checking if correct...\n');
    }
    
    console.log('2️⃣ Resetting all to false...');
    
    // Reset all to false
    const { error: resetError } = await supabase
      .from('emis_apps_raw')
      .update({ is_latest_upload: false })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all
    
    if (resetError) {
      console.error('❌ Error resetting:', resetError);
      process.exit(1);
    }
    
    console.log('   ✅ All rows set to false\n');
    
    console.log('3️⃣ Finding most recent upload per site...');
    
    // Get all uploads with their row counts
    const { data: uploads, error: uploadsError } = await supabase
      .from('emis_apps_raw')
      .select('site_id, upload_id, upload_timestamp, created_at')
      .not('site_id', 'is', null)
      .order('site_id')
      .order('upload_timestamp', { ascending: false })
      .order('created_at', { ascending: false })
      .order('upload_id', { ascending: false });
    
    if (uploadsError) {
      console.error('❌ Error getting uploads:', uploadsError);
      process.exit(1);
    }
    
    // Group by site_id and get the most recent upload_id for each
    const latestPerSite = {};
    uploads.forEach(row => {
      const siteId = row.site_id;
      if (!latestPerSite[siteId]) {
        latestPerSite[siteId] = row.upload_id;
      }
    });
    
    console.log(`   Found ${Object.keys(latestPerSite).length} sites\n`);
    
    for (const [siteId, uploadId] of Object.entries(latestPerSite)) {
      console.log(`   Site ${siteId}: Latest upload ${uploadId.substring(0, 8)}...`);
    }
    
    console.log('\n4️⃣ Marking latest uploads as true...');
    
    // Mark the latest upload for each site as true
    for (const [siteId, uploadId] of Object.entries(latestPerSite)) {
      const { error: updateError, count } = await supabase
        .from('emis_apps_raw')
        .update({ is_latest_upload: true })
        .eq('site_id', parseInt(siteId))
        .eq('upload_id', uploadId)
        .select('*', { count: 'exact', head: true });
      
      if (updateError) {
        console.error(`   ❌ Error updating site ${siteId}:`, updateError);
      } else {
        console.log(`   ✅ Site ${siteId}: Marked ${count} rows as latest`);
      }
    }
    
    console.log('\n5️⃣ Verifying fix...');
    
    const { count: newTrueCount } = await supabase
      .from('emis_apps_raw')
      .select('*', { count: 'exact', head: true })
      .eq('is_latest_upload', true);
    
    const { count: viewCount } = await supabase
      .from('emis_apps_filled')
      .select('*', { count: 'exact', head: true });
    
    console.log(`   ✅ Rows marked as latest: ${newTrueCount}`);
    console.log(`   ✅ Rows in emis_apps_filled view: ${viewCount}\n`);
    
    if (newTrueCount > 0 && viewCount > 0) {
      console.log('🎉 SUCCESS! Your dashboard should now show data.');
      console.log('   Refresh your browser to see the changes.\n');
    } else {
      console.log('⚠️  WARNING: Still no data in view. This may indicate:');
      console.log('   1. The view definition needs to be updated');
      console.log('   2. There is no data in emis_apps_raw at all\n');
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Check if @supabase/supabase-js is installed
(async () => {
  try {
    await import('@supabase/supabase-js');
    await fixLatestUpload();
  } catch (e) {
    if (e.code === 'ERR_MODULE_NOT_FOUND') {
      console.log('📦 Installing @supabase/supabase-js...\n');
      const { execSync } = require('child_process');
      execSync('npm install @supabase/supabase-js', { stdio: 'inherit' });
      console.log('\n✅ Installed. Running fix...\n');
      await fixLatestUpload();
    } else {
      throw e;
    }
  }
})();
