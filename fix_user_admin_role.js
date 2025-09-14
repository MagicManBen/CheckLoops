import { createClient } from '@supabase/supabase-js';

async function fixUserAdminRole() {
  console.log('=== FIXING USER ADMIN ROLE ===\n');

  // First, let me try to create the Supabase client and login as the user
  const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME';
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Login as the user
    console.log('1. Logging in as the user...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'benhowardmagic@hotmail.com',
      password: 'Hello1!'
    });

    if (authError) {
      console.error('Login error:', authError);
      return;
    }

    console.log('✅ Logged in successfully');
    const userId = authData.user.id;
    console.log('User ID:', userId);

    // Check current profile
    console.log('\n2. Checking current profile...');
    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('Profile check error:', profileError);
    } else {
      console.log('Current profile:', currentProfile);
    }

    // Update profile role to admin
    console.log('\n3. Updating profile role to admin...');
    const { data: updateData, error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('user_id', userId)
      .select();

    if (updateError) {
      console.error('Profile update error:', updateError);
    } else {
      console.log('✅ Profile updated successfully:', updateData);
    }

    // Try to create an admin site invite while logged in (RLS should allow this)
    console.log('\n4. Attempting to create admin site invite...');
    const inviteData = {
      email: 'benhowardmagic@hotmail.com',
      role: 'admin',
      site_id: 2,
      full_name: 'Ben Howard',
      status: 'accepted',
      token: crypto.randomUUID(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    const { data: inviteResult, error: inviteError } = await supabase
      .from('site_invites')
      .insert([inviteData])
      .select();

    if (inviteError) {
      console.error('Site invite creation error:', inviteError);
      console.log('This is expected if RLS policies prevent creation.');
    } else {
      console.log('✅ Admin site invite created successfully:', inviteResult);
    }

    // Update user metadata as additional fallback
    console.log('\n5. Updating user metadata...');
    const { error: metaError } = await supabase.auth.updateUser({
      data: {
        role: 'admin',
        admin_access: true
      }
    });

    if (metaError) {
      console.error('Metadata update error:', metaError);
    } else {
      console.log('✅ User metadata updated successfully');
    }

    console.log('\n=== ADMIN ROLE FIX COMPLETE ===');
    console.log('User should now have admin access through:');
    console.log('1. Profile role: admin');
    console.log('2. User metadata: role = admin');
    console.log('3. Site invite (if RLS allowed creation)');

  } catch (error) {
    console.error('Error:', error);
  }
}

fixUserAdminRole().catch(console.error);