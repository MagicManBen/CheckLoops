// Check if benhowardmagic@hotmail.com has admin role in master_users table
import { createClient } from '@supabase/supabase-js';

// Load config
const CONFIG = {
  SUPABASE_URL: 'https://unveoqnlqnobufhublyw.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME'
};

async function checkAdminProfile() {
  try {
    // Create Supabase client
    const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    
    // Login as the admin user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'benhowardmagic@hotmail.com',
      password: 'Hello1!'
    });
    
    if (authError) {
      console.error('Login failed:', authError);
      return;
    }
    
    console.log('✅ Logged in successfully');
    console.log('User ID:', authData.user.id);
    console.log('User email:', authData.user.email);
    console.log('User metadata role:', authData.user.raw_user_meta_data?.role);
    
    // Check the master_users table
    const { data: profile, error: profileError } = await supabase
      .from('master_users')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .maybeSingle();
    
    if (profileError) {
      console.error('❌ Error fetching profile:', profileError);
    } else if (!profile) {
      console.log('❌ No profile found for this user!');
      console.log('This is the issue - user needs a profile with admin role');
      
      // Try to create the profile
      console.log('\n📝 Attempting to create admin profile...');
      const { data: newProfile, error: createError } = await supabase
        .from('master_users')
        .insert({
          user_id: authData.user.id,
          role: 'admin',
          full_name: 'Ben Howard',
          nickname: 'Ben',
          site_id: 2,
          onboarding_complete: true
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Failed to create profile:', createError);
      } else {
        console.log('✅ Admin profile created successfully:', newProfile);
      }
    } else {
      console.log('✅ Profile found:', profile);
      console.log('Current role:', profile.role);
      
      if (profile.role !== 'admin' && profile.role !== 'owner') {
        console.log('⚠️ Profile exists but role is not admin/owner');
        console.log('📝 Updating role to admin...');
        
        const { data: updatedProfile, error: updateError } = await supabase
          .from('master_users')
          .update({ role: 'admin' })
          .eq('auth_user_id', authData.user.id)
          .select()
          .single();
        
        if (updateError) {
          console.error('❌ Failed to update role:', updateError);
        } else {
          console.log('✅ Role updated to admin:', updatedProfile);
        }
      }
    }
    
    // Sign out
    await supabase.auth.signOut();
    
  } catch (err) {
    console.error('Script error:', err);
  }
}

// Run the check
checkAdminProfile();