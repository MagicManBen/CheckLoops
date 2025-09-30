import { supabase } from './config.js';

async function setupStoragePolicies() {
  console.log('Setting up meeting recordings storage policies...');
  
  // The issue is likely that we need to set up storage policies
  // Let's try to create some test data first to see what permissions we need
  
  try {
    // Test if we can list files in the bucket
    console.log('Testing storage bucket access...');
    const { data, error } = await supabase.storage
      .from('meeting-recordings')
      .list('', { limit: 1 });
    
    if (error) {
      console.error('❌ Storage bucket access error:', error);
      
      // If it's a policy error, we need to manually set up policies through Supabase Dashboard
      if (error.message.includes('row-level security')) {
        console.log(`
⚠️  RLS POLICY SETUP REQUIRED:

The meeting-recordings bucket needs Row Level Security policies.
Please go to your Supabase Dashboard and:

1. Go to Storage > Policies
2. Create these policies for the 'meeting-recordings' bucket:

POLICY 1 - INSERT:
- Name: "Allow authenticated users to upload meeting recordings"  
- Command: INSERT
- Target roles: authenticated
- Expression: bucket_id = 'meeting-recordings'

POLICY 2 - SELECT:
- Name: "Allow authenticated users to view meeting recordings"
- Command: SELECT  
- Target roles: authenticated
- Expression: bucket_id = 'meeting-recordings'

POLICY 3 - UPDATE:
- Name: "Allow authenticated users to update meeting recordings"
- Command: UPDATE
- Target roles: authenticated  
- Expression: bucket_id = 'meeting-recordings'

POLICY 4 - DELETE:
- Name: "Allow authenticated users to delete meeting recordings"
- Command: DELETE
- Target roles: authenticated
- Expression: bucket_id = 'meeting-recordings'

Or run this SQL in the SQL Editor:

CREATE POLICY "Allow authenticated users to upload meeting recordings"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'meeting-recordings');

CREATE POLICY "Allow authenticated users to view meeting recordings" 
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'meeting-recordings');

CREATE POLICY "Allow authenticated users to update meeting recordings"
ON storage.objects FOR UPDATE  
TO authenticated
USING (bucket_id = 'meeting-recordings')
WITH CHECK (bucket_id = 'meeting-recordings');

CREATE POLICY "Allow authenticated users to delete meeting recordings"
ON storage.objects FOR DELETE
TO authenticated  
USING (bucket_id = 'meeting-recordings');
        `);
      }
    } else {
      console.log('✅ Storage bucket access successful:', data);
    }
  } catch (err) {
    console.error('❌ Storage setup error:', err);
  }
}

setupStoragePolicies();