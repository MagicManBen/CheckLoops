// Setup meeting recordings storage policies
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const serviceKey = (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) || '';
if (!serviceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY not set in environment');
}

const supabase = createClient(supabaseUrl, serviceKey);

async function setupMeetingRecordingsPolicies() {
  console.log('Setting up meeting recordings storage policies...');

  const policies = [
    // Policy 1: Allow authenticated users to upload meeting recordings
    `CREATE POLICY IF NOT EXISTS "Allow authenticated users to upload meeting recordings"
     ON storage.objects FOR INSERT
     TO authenticated
     WITH CHECK (bucket_id = 'meeting-recordings');`,
    
    // Policy 2: Allow authenticated users to view meeting recordings  
    `CREATE POLICY IF NOT EXISTS "Allow authenticated users to view meeting recordings"
     ON storage.objects FOR SELECT
     TO authenticated
     USING (bucket_id = 'meeting-recordings');`,
    
    // Policy 3: Allow authenticated users to update meeting recordings
    `CREATE POLICY IF NOT EXISTS "Allow authenticated users to update meeting recordings"
     ON storage.objects FOR UPDATE
     TO authenticated
     USING (bucket_id = 'meeting-recordings')
     WITH CHECK (bucket_id = 'meeting-recordings');`,
    
    // Policy 4: Allow authenticated users to delete meeting recordings
    `CREATE POLICY IF NOT EXISTS "Allow authenticated users to delete meeting recordings"
     ON storage.objects FOR DELETE
     TO authenticated
     USING (bucket_id = 'meeting-recordings');`
  ];

  for (let i = 0; i < policies.length; i++) {
    console.log(`\nExecuting policy ${i + 1}...`);
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql: policies[i] });
      
      if (error) {
        console.error(`Error with policy ${i + 1}:`, error);
      } else {
        console.log(`✅ Policy ${i + 1} created successfully`);
      }
    } catch (err) {
      console.error(`Exception with policy ${i + 1}:`, err);
    }
  }

  // Test the policies by trying to list objects
  console.log('\nTesting storage access...');
  try {
    const { data, error } = await supabase.storage
      .from('meeting-recordings')
      .list('', { limit: 1 });
    
    if (error) {
      console.error('Storage test error:', error);
    } else {
      console.log('✅ Storage access test successful:', data);
    }
  } catch (err) {
    console.error('Storage test exception:', err);
  }
}

// Run the setup
setupMeetingRecordingsPolicies();