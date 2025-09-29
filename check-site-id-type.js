import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseServiceKey = 'sb_secret_ylIhDtikpno4LTTUmpDJvw_Ov7BtIEp';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSiteIdTypes() {
  console.log('Checking site_id data types...\n');

  try {
    // Check master_users table
    const { data: userData, error: userError } = await supabase
      .from('master_users')
      .select('site_id')
      .limit(1);

    if (!userError && userData && userData.length > 0) {
      console.log('master_users.site_id sample value:', userData[0].site_id);
      console.log('master_users.site_id type:', typeof userData[0].site_id);
      console.log('Is numeric?:', !isNaN(userData[0].site_id));
    }

    // Check activity_likes table
    const { data: likesData, error: likesError } = await supabase
      .from('activity_likes')
      .select('site_id')
      .limit(1);

    if (!likesError && likesData && likesData.length > 0) {
      console.log('\nactivity_likes.site_id sample value:', likesData[0].site_id);
      console.log('activity_likes.site_id type:', typeof likesData[0].site_id);
      console.log('Is numeric?:', !isNaN(likesData[0].site_id));
    }

    // Get table schema information
    const { data: schemaData, error: schemaError } = await supabase
      .rpc('get_table_schema', {
        table_name: 'master_users'
      })
      .single();

    if (schemaError) {
      // Try alternative approach - query information_schema
      console.log('\nQuerying schema information...');

      // This won't work with service key, but let's check what we have
      console.log('\nBased on the data, site_id appears to be stored as:',
        typeof userData[0].site_id === 'string' ? 'TEXT/VARCHAR' : 'INTEGER');
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

checkSiteIdTypes();