import { createClient } from '@supabase/supabase-js';

async function testTeamsQuery() {
  const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME';
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log('=== TESTING TEAMS QUERY ===\n');

  // Authenticate
  const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
    email: 'benhowardmagic@hotmail.com',
    password: 'Hello1!'
  });

  if (!user) {
    console.error('Authentication failed:', authError);
    return;
  }

  console.log('Authenticated as:', user.email);

  // Try different team queries
  console.log('\n1. Basic teams query:');
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('*');

    if (error) {
      console.error('   Error:', error);
    } else {
      console.log('   Success! Found', data?.length || 0, 'teams');
    }
  } catch (e) {
    console.error('   Exception:', e);
  }

  console.log('\n2. Teams query with specific columns:');
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('id, name');

    if (error) {
      console.error('   Error:', error);
    } else {
      console.log('   Success! Found', data?.length || 0, 'teams');
    }
  } catch (e) {
    console.error('   Exception:', e);
  }

  console.log('\n3. Teams query with site_id filter:');
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('id, name')
      .eq('site_id', 2);

    if (error) {
      console.error('   Error:', error);
    } else {
      console.log('   Success! Found', data?.length || 0, 'teams for site_id=2');
    }
  } catch (e) {
    console.error('   Exception:', e);
  }

  // Try to get table info using RPC if available
  console.log('\n4. Attempting to get table structure:');
  try {
    // This might fail if the RPC doesn't exist, but let's try
    const { data, error } = await supabase
      .rpc('get_table_columns', { table_name: 'teams' });

    if (error) {
      console.log('   No RPC available for table structure');
    } else {
      console.log('   Table columns:', data);
    }
  } catch (e) {
    // Expected to fail
  }

  console.log('\n=== TEST COMPLETE ===');
  await supabase.auth.signOut();
}

testTeamsQuery().catch(console.error);