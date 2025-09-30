import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseKey = (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) || '';
if (!supabaseKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY not set in environment');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('\n=== Checking master_users table structure ===');

    // Get master_users columns
    const { data: masterUsersColumns, error: muError } = await supabase
        .from('master_users')
        .select('*')
        .limit(1);

    if (muError) {
        console.log('Error fetching master_users:', muError.message);
    } else if (masterUsersColumns && masterUsersColumns.length > 0) {
        console.log('\nmaster_users columns:', Object.keys(masterUsersColumns[0]));
    }

    // Check if profiles table exists
    console.log('\n=== Checking profiles table ===');
    const { data: profilesData, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

    if (pError) {
        console.log('Error fetching profiles:', pError.message);
    } else if (profilesData && profilesData.length > 0) {
        console.log('\nprofiles columns:', Object.keys(profilesData[0]));
    }

    // Check related tables
    console.log('\n=== Checking related tables ===');

    const tables = [
        'two_week_email',
        'holiday_approvals',
        'holidays',
        'schedules',
        'complaints',
        'mandatory_training',
        'kiosk_scans',
        'meetings'
    ];

    for (const table of tables) {
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);

        if (error) {
            console.log(`\n${table}: Error - ${error.message}`);
        } else if (data && data.length > 0) {
            console.log(`\n${table} columns:`, Object.keys(data[0]));
        } else {
            console.log(`\n${table}: Empty or no data`);
        }
    }
}

checkSchema().catch(console.error);