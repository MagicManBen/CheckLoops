import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function resetAdminPassword() {
  console.log('Resetting admin password for benhowardmagic@hotmail.com...\n');

  try {
    // Update the password for the admin user
    const { data, error } = await supabase.auth.admin.updateUserById(
      '55f1b4e6-01f4-452d-8d6c-617fe7794873',
      { password: 'Looptestadmin1' }
    );

    if (error) {
      console.error('Error resetting password:', error);
      return;
    }

    console.log('✅ Password reset successfully!');
    console.log('   Email: benhowardmagic@hotmail.com');
    console.log('   Password: Looptestadmin1');
    console.log('\nYou can now login with these credentials.');

  } catch (err) {
    console.error('Failed to reset password:', err);
  }
}

resetAdminPassword().catch(console.error);