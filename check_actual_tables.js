import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkActualTables() {
    console.log('\n=== Checking What Tables Actually Exist ===\n');

    // Try to query information_schema (might not work due to permissions)
    try {
        const { data: tables, error } = await supabase
            .from('information_schema.tables')
            .select('table_name, table_type')
            .eq('table_schema', 'public');

        if (!error && tables) {
            console.log('Tables found:', tables);
        }
    } catch (e) {
        console.log('Cannot query information_schema directly');
    }

    // Check common table patterns
    const tablesToCheck = [
        // User related
        'master_users',
        'profiles',
        'users',
        'kiosk_users',
        'staff',

        // Holiday related
        'holidays',
        'holiday_requests',
        'holiday_approvals',
        'staff_holidays',
        '4_holiday_requests',

        // Schedule related
        'schedules',
        'staff_schedules',
        'item_allowed_types',

        // Training related
        'training_records',
        'training_types',
        'mandatory_training',
        'staff_training',

        // Other
        'complaints',
        'staff_complaints',
        'two_week_email',
        'staff_two_week_email',
        'meetings',
        'staff_meetings',
        'kiosk_scans',
        'staff_kiosk_scans',
        'site_invites',
        'rooms',
        'items',
        'check_types',
        'submissions'
    ];

    console.log('Testing individual tables:\n');
    const existingTables = [];
    const nonExistentTables = [];

    for (const table of tablesToCheck) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(1);

            if (!error) {
                existingTables.push(table);
                console.log(`✅ ${table} - EXISTS`);
                if (data && data.length > 0) {
                    const cols = Object.keys(data[0]);
                    console.log(`   Columns: ${cols.slice(0, 5).join(', ')}${cols.length > 5 ? '...' : ''}`);
                }
            } else {
                nonExistentTables.push(table);
                console.log(`❌ ${table} - NOT FOUND`);
            }
        } catch (e) {
            nonExistentTables.push(table);
            console.log(`❌ ${table} - ERROR`);
        }
    }

    console.log('\n=== Summary ===');
    console.log('\nExisting tables:', existingTables.join(', '));
    console.log('\nNon-existent tables:', nonExistentTables.join(', '));
}

checkActualTables().catch(console.error);