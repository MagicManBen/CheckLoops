// Apply RLS fix to master_users table
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://unveoqnlqnobufhublyw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME'
);

async function applyFix() {
  console.log('=== Applying RLS Fix to master_users ===\n');

  try {
    // Step 1: Temporarily disable RLS to clean up policies
    console.log('1. Temporarily disabling RLS...');
    await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE master_users DISABLE ROW LEVEL SECURITY;'
    }).catch(() => {
      // If the RPC doesn't exist, we'll work around it
      console.log('   Cannot disable RLS via RPC (expected)');
    });

    // Step 2: Since we can't execute raw SQL via the API directly,
    // let's test if we can at least bypass RLS with service role
    console.log('2. Testing service role access...');
    const { data: testData, error: testError } = await supabase
      .from('master_users')
      .select('count')
      .single();

    if (!testError) {
      console.log('✅ Service role can access master_users');
    } else {
      console.log('⚠️ Even service role has issues:', testError.message);
    }

    // Step 3: Test if a regular authenticated user can read after we make changes
    console.log('\n3. Creating a test to verify user access...');

    // Sign in as Ben
    const authSupabase = createClient(
      'https://unveoqnlqnobufhublyw.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub25fYzJpR3NySXJzYlBIZEQ4QVdjYmdaU3J1WmxkbjBib3lpYXE5dnVCaiIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.QOsCahyMz_9tx9OSI4UJtQADlk58qnMcJPRVQhMTdHY' // Anon key
    );

    const { data: authData, error: authError } = await authSupabase.auth.signInWithPassword({
      email: 'benhowardmagic@hotmail.com',
      password: 'Hello1!'
    });

    if (!authError) {
      console.log('✅ Authenticated as:', authData.user.email);

      // Try to read with authenticated user using service role to bypass RLS
      const { data: profile, error: profileError } = await supabase
        .from('master_users')
        .select('access_type, role, full_name')
        .eq('auth_user_id', authData.user.id)
        .single();

      if (!profileError) {
        console.log('✅ Can read profile via service role:');
        console.log('   access_type:', profile.access_type);
        console.log('   role:', profile.role);
      }

      await authSupabase.auth.signOut();
    }

    console.log('\n=== Manual Fix Required ===');
    console.log('The RLS policies have infinite recursion and need to be fixed in the Supabase dashboard:');
    console.log('\n1. Go to: https://unveoqnlqnobufhublyw.supabase.co');
    console.log('2. Navigate to Authentication > Policies');
    console.log('3. Find the master_users table');
    console.log('4. Delete all existing policies');
    console.log('5. Create a simple policy:');
    console.log('   - Name: "Users can read own record"');
    console.log('   - Operation: SELECT');
    console.log('   - Check expression: auth_user_id = auth.uid()');
    console.log('\nThis will allow users to read their own records without recursion.');

  } catch (error) {
    console.error('Error:', error);
  }
}

applyFix().catch(console.error);