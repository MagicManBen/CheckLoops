import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setOnboardingComplete() {
  try {
    console.log('Setting onboarding_complete to true for ben.howard@stoke.nhs.uk...\n');
    
    const { data, error } = await supabase
      .from('master_users')
      .update({ onboarding_complete: true })
      .eq('email', 'ben.howard@stoke.nhs.uk')
      .select();

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('✅ Success! Updated user:');
    console.log(JSON.stringify(data, null, 2));

  } catch (err) {
    console.error('Error:', err);
  }
}

setOnboardingComplete();
