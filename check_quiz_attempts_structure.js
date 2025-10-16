import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkQuizAttemptsStructure() {
  try {
    console.log('Checking quiz_attempts table structure...\n');
    
    // Get a sample record to see what columns exist
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error:', error);
      return;
    }

    if (data) {
      console.log('Existing columns in quiz_attempts:');
      Object.keys(data).forEach(col => {
        console.log(`  - ${col}: ${typeof data[col]}`);
      });
    } else {
      console.log('No records found in quiz_attempts table');
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

checkQuizAttemptsStructure();
