import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseServiceKey = 'sb_secret_nV3xSrLVHL50Zqp_DeZsgA_lLAYAaQs';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupCertificates() {
  console.log('🧹 Starting certificate cleanup...\n');

  try {
    // List all files in training_certificates bucket
    console.log('📋 Listing files in training_certificates bucket...');
    const { data: files, error: listError } = await supabase.storage
      .from('training_certificates')
      .list('', {
        limit: 1000,
        offset: 0
      });

    if (listError) {
      console.error('❌ Error listing files:', listError.message);
      return;
    }

    console.log(`✅ Found ${files?.length || 0} items in bucket\n`);

    if (!files || files.length === 0) {
      console.log('✅ Bucket is already empty!');
      return;
    }

    // Filter out the folder marker (id === '2')
    const filesToDelete = files.filter(f => f.id !== '2' && f.name);

    if (filesToDelete.length === 0) {
      console.log('✅ No files to delete (only folder markers found)');
      return;
    }

    console.log(`🗑️  Deleting ${filesToDelete.length} certificate files...\n`);

    // Delete files by site folder (more efficient)
    const foldersByPath = {};
    filesToDelete.forEach(file => {
      const path = file.name.split('/')[0];
      if (!foldersByPath[path]) {
        foldersByPath[path] = [];
      }
      foldersByPath[path].push(file.name);
    });

    let deletedCount = 0;
    let errorCount = 0;

    for (const [folder, paths] of Object.entries(foldersByPath)) {
      console.log(`📂 Deleting from folder "${folder}" (${paths.length} files)...`);

      const { data, error } = await supabase.storage
        .from('training_certificates')
        .remove(paths);

      if (error) {
        console.error(`   ❌ Error deleting from ${folder}:`, error.message);
        errorCount += paths.length;
      } else {
        console.log(`   ✅ Successfully deleted ${paths.length} files`);
        deletedCount += paths.length;
      }
    }

    console.log('\n📊 Deletion Summary:');
    console.log(`   ✅ Deleted: ${deletedCount} files`);
    if (errorCount > 0) {
      console.log(`   ❌ Failed: ${errorCount} files`);
    }

    // Verify deletion
    console.log('\n📋 Verifying deletion...');
    const { data: remainingFiles } = await supabase.storage
      .from('training_certificates')
      .list('', {
        limit: 1000,
        offset: 0
      });

    const actualFiles = remainingFiles?.filter(f => f.id !== '2' && f.name) || [];
    console.log(`✅ Remaining files in bucket: ${actualFiles.length}`);

    if (actualFiles.length > 0) {
      console.log('\n📋 Remaining files:');
      actualFiles.forEach(file => {
        console.log(`   - ${file.name}`);
      });
    }

    console.log('\n✨ Cleanup complete!');
    console.log('🎯 Your training_records database should also be cleaned using the SQL script.');

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    process.exit(1);
  }
}

cleanupCertificates();
