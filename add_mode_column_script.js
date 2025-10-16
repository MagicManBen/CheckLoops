import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addModeColumn() {
  try {
    console.log('Adding mode column to quiz_attempts table...\n');
    
    // Step 1: Add the column
    console.log('Step 1: Adding mode column...');
    const { error: addColError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT \'required\';'
    });
    
    if (addColError) {
      console.log('Note: Column might already exist or RPC not available. Trying direct approach...');
    }
    
    // Step 2: Update existing records based on is_practice
    console.log('Step 2: Updating existing records...');
    
    // Get all records
    const { data: allRecords, error: fetchError } = await supabase
      .from('quiz_attempts')
      .select('id, is_practice');
    
    if (fetchError) {
      console.error('Error fetching records:', fetchError);
      return;
    }
    
    console.log(`Found ${allRecords?.length || 0} records to update`);
    
    // Update each record
    let updated = 0;
    for (const record of allRecords || []) {
      const mode = record.is_practice ? 'practice' : 'required';
      const { error: updateError } = await supabase
        .from('quiz_attempts')
        .update({ mode })
        .eq('id', record.id);
      
      if (!updateError) {
        updated++;
      }
    }
    
    console.log(`✅ Updated ${updated} records`);
    
    // Step 3: Verify the results
    console.log('\nVerifying results...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('quiz_attempts')
      .select('id, user_id, mode, is_practice, completed_at')
      .order('completed_at', { ascending: false })
      .limit(5);
    
    if (verifyError) {
      console.error('Error verifying:', verifyError);
    } else {
      console.log('Recent quiz attempts:');
      verifyData?.forEach(r => {
        console.log(`  - ID: ${r.id}, mode: ${r.mode}, is_practice: ${r.is_practice}, completed: ${r.completed_at}`);
      });
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

addModeColumn();
