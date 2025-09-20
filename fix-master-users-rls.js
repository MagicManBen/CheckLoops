// Fix RLS policies on master_users table
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://unveoqnlqnobufhublyw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc'
);

async function fixRLS() {
  console.log('=== Fixing master_users RLS Policies ===\n');

  try {
    // Test authenticated user query
    console.log('1. Testing authenticated user query (simulating benhowardmagic@hotmail.com)...');

    // First sign in as Ben to get a proper auth token
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'benhowardmagic@hotmail.com',
      password: 'Hello1!'
    });

    if (authError) {
      console.error('❌ Failed to authenticate:', authError.message);
      return;
    }

    console.log('✅ Authenticated as:', authData.user.email);

    // Now try to fetch the profile as an authenticated user
    const { data: profile, error: profileError } = await supabase
      .from('master_users')
      .select('access_type, role, full_name')
      .eq('auth_user_id', authData.user.id)
      .single();

    if (profileError) {
      console.error('❌ Cannot read own profile:', profileError.message);
      console.log('\n⚠️ RLS is blocking the user from reading their own record!');

      // Now use service role to bypass RLS and verify the data exists
      const serviceSupabase = createClient(
        'https://unveoqnlqnobufhublyw.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc',
        { auth: { persistSession: false } }
      );

      const { data: directProfile, error: directError } = await serviceSupabase
        .from('master_users')
        .select('access_type, role, full_name')
        .eq('auth_user_id', authData.user.id)
        .single();

      if (!directError && directProfile) {
        console.log('\n✅ Data exists in database (via service role):');
        console.log('   access_type:', directProfile.access_type);
        console.log('   role:', directProfile.role);
        console.log('   full_name:', directProfile.full_name);
        console.log('\n🔧 SOLUTION: Need to fix RLS policies to allow users to read their own records');
      }
    } else {
      console.log('✅ User CAN read their own profile:');
      console.log('   access_type:', profile.access_type);
      console.log('   role:', profile.role);
      console.log('   full_name:', profile.full_name);
      console.log('\n✅ RLS policies appear to be working correctly!');
    }

    // Sign out
    await supabase.auth.signOut();

  } catch (error) {
    console.error('Error:', error);
  }

  console.log('\n=== RLS Check Complete ===');
}

fixRLS().catch(console.error);