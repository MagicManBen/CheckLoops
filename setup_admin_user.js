import { createClient } from '@supabase/supabase-js';

// Use service role key to update user metadata
const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function setupAdminUser() {
  console.log('🔧 Setting up admin user...');
  
  const adminUserId = '55f1b4e6-01f4-452d-8d6c-617fe7794873';
  const adminEmail = 'benhowardmagic@hotmail.com';
  
  try {
    // First, create a profile entry for the admin user
    console.log('📝 Creating profile for admin user...');
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        user_id: adminUserId,
        role: 'admin',
        full_name: 'Ben Howard',
        nickname: 'Admin',
        site_id: 2,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });
    
    if (profileError) {
      console.error('❌ Error creating profile:', profileError);
      // Try to update if insert fails
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ role: 'admin' })
        .eq('user_id', adminUserId);
      
      if (updateError) {
        console.error('❌ Error updating profile:', updateError);
      } else {
        console.log('✅ Profile role updated to admin');
      }
    } else {
      console.log('✅ Admin profile created/updated');
    }
    
    // Also update user metadata using admin API
    console.log('🔄 Updating user metadata...');
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.updateUserById(
      adminUserId,
      {
        user_metadata: { 
          role: 'admin',
          site_id: 2,
          email_verified: true
        }
      }
    );
    
    if (userError) {
      console.error('❌ Error updating user metadata:', userError);
    } else {
      console.log('✅ User metadata updated');
      console.log('📧 Admin user:', userData.user.email);
      console.log('🔑 Role:', userData.user.user_metadata.role);
    }
    
    console.log('\n✅ Admin setup complete!');
    console.log('📧 Email:', adminEmail);
    console.log('🔐 Password: Hello1!');
    console.log('🎯 Role: admin');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupAdminUser().catch(console.error);