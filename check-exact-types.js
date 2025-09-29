import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseServiceKey = 'sb_secret_ylIhDtikpno4LTTUmpDJvw_Ov7BtIEp';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkExactTypes() {
  console.log('Checking EXACT data types in Supabase...\n');

  try {
    // Get schema information using raw SQL query
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT
          table_name,
          column_name,
          data_type,
          udt_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name IN ('master_users', 'activity_likes', 'avatar_emotion_changes')
        AND column_name = 'site_id'
        ORDER BY table_name;
      `
    });

    if (error) {
      console.log('RPC not available, checking data directly...\n');

      // Check by querying actual data
      const queries = [
        { table: 'master_users', query: supabase.from('master_users').select('site_id').limit(5) },
        { table: 'activity_likes', query: supabase.from('activity_likes').select('site_id').limit(5) }
      ];

      for (const { table, query } of queries) {
        const { data: result, error: queryError } = await query;

        if (!queryError && result && result.length > 0) {
          console.log(`\n${table}:`);
          console.log('Sample values:', result.map(r => r.site_id));
          console.log('JavaScript types:', result.map(r => typeof r.site_id));
          console.log('First value:', result[0].site_id);
          console.log('Is it a number?', typeof result[0].site_id === 'number');
          console.log('Is it a string?', typeof result[0].site_id === 'string');
        }
      }
    } else {
      console.log('Schema information:', data);
    }

    // Test the exact comparison that's failing
    console.log('\n\nTesting the problematic query pattern:');

    // First get a user's site_id from master_users
    const { data: userData } = await supabase
      .from('master_users')
      .select('site_id, auth_user_id')
      .limit(1)
      .single();

    if (userData) {
      console.log('\nmaster_users site_id:', userData.site_id);
      console.log('Type:', typeof userData.site_id);

      // Now try to query with this site_id
      console.log('\nTrying to query activity_likes with this site_id...');
      const { data: likesData, error: likesError } = await supabase
        .from('activity_likes')
        .select('*')
        .eq('site_id', userData.site_id) // This might fail due to type mismatch
        .limit(1);

      if (likesError) {
        console.log('Error with direct comparison:', likesError.message);

        // Try with string conversion
        console.log('\nTrying with String() conversion...');
        const { data: likesData2, error: likesError2 } = await supabase
          .from('activity_likes')
          .select('*')
          .eq('site_id', String(userData.site_id))
          .limit(1);

        if (likesError2) {
          console.log('Still error:', likesError2.message);
        } else {
          console.log('Success with String conversion!');
        }
      } else {
        console.log('Direct comparison worked!');
      }
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

checkExactTypes();