// THIS IS A SERVER-SIDE UTILITY SCRIPT
// Service role keys must never be in client-side code
// Run this script server-side only with proper environment variables

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://unveoqnlqnobufhublyw.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  console.error('   Example: SUPABASE_URL=https://... SUPABASE_SERVICE_ROLE_KEY=... node check_user_role.js');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkUserRole() {
  const { data, error } = await supabase
    .from('master_users')
    .select('auth_auth_user_id, email, role, full_name')
    .eq('email', 'ben.howard@stoke.nhs.uk')
    .single();
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('User profile:', JSON.stringify(data, null, 2));
    console.log(`\nCurrent role: ${data.role}`);
    
    if (data.role !== 'admin' && data.role !== 'owner') {
      console.log('\n⚠️ User needs admin or owner role to see Admin Site button');
      console.log('To fix: Update the role in the profiles table to "admin" or "owner"');
    }
  }
}

checkUserRole();
