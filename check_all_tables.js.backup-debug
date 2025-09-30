import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseKey = (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) || '';
if (!supabaseKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY not set in environment');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getAllTables() {
    console.log('\n=== Checking staff_ prefixed tables ===');
    const staffTables = [
        'staff_holidays',
        'staff_holiday_approvals',
        'staff_schedules',
        'staff_training',
        'staff_complaints',
        'staff_meetings',
        'staff_kiosk_scans',
        'staff_two_week_email'
    ];

    for (const table of staffTables) {
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);

        if (!error) {
            console.log(`\n✓ ${table} exists`);
            if (data && data.length > 0) {
                console.log(`  Columns: ${Object.keys(data[0]).join(', ')}`);
            }
        }
    }

    // Check other common tables
    console.log('\n=== Checking other common tables ===');
    const otherTables = [
        'holiday_requests',
        'training_records',
        'kiosk_users',
        'achievement_users',
        'user_achievements',
        'practice_quiz_results'
    ];

    for (const table of otherTables) {
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);

        if (!error) {
            console.log(`\n✓ ${table} exists`);
            if (data && data.length > 0) {
                console.log(`  Columns: ${Object.keys(data[0]).join(', ')}`);
            }
        }
    }
}

getAllTables().catch(console.error);
