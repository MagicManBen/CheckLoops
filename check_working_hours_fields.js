import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkWorkingHoursFields() {
  try {
    // First, let's get the structure by querying for the specific user
    console.log('Checking user ben.howard@stoke.nhs.uk...\n');
    
    const { data, error } = await supabase
      .from('master_users')
      .select('*')
      .eq('email', 'ben.howard@stoke.nhs.uk')
      .single();

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('User data:', JSON.stringify(data, null, 2));
    console.log('\n--- Checking working hours fields ---');
    console.log('working_hours:', data.working_hours);
    console.log('weekly_hours:', data.weekly_hours);
    console.log('weekly_sessions:', data.weekly_sessions);
    console.log('contract_hours:', data.contract_hours);

  } catch (err) {
    console.error('Error:', err);
  }
}

checkWorkingHoursFields();
