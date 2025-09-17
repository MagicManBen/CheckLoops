import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://unveoqnlqnobufhublyw.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkTriggers() {
    console.log('=== CHECKING TRIGGERS ON KIOSK_USERS TABLE ===\n');

    // Check triggers
    const { data: triggers, error: triggerError } = await supabase
        .rpc('exec_sql', {
            sql: `
                SELECT
                    tgname as trigger_name,
                    tgtype,
                    proname as function_name
                FROM pg_trigger t
                JOIN pg_proc p ON p.oid = t.tgfoid
                WHERE t.tgrelid = 'kiosk_users'::regclass
                AND tgname NOT LIKE 'pg_%'
            `
        }).single();

    if (triggerError) {
        // Try a different approach
        console.log('Checking triggers via information_schema...');
        const { data, error } = await supabase
            .from('_trigger_info')
            .select('*');
        console.log('Triggers:', data || 'Could not fetch');
        console.log('Error:', error);
    } else {
        console.log('Triggers on kiosk_users:', triggers);
    }

    // Check if the problematic function exists
    console.log('\n=== CHECKING FOR upsert_user_achievement FUNCTION ===');
    const { data: func, error: funcError } = await supabase
        .rpc('exec_sql', {
            sql: `
                SELECT proname
                FROM pg_proc
                WHERE proname = 'upsert_user_achievement'
            `
        }).single();

    if (func) {
        console.log('Function exists:', func);
    } else {
        console.log('Function does NOT exist - this is causing the error!');
    }
}

// Note: exec_sql might not exist, so let's use a direct query approach
checkTriggers().catch(err => {
    console.log('Could not check via RPC, error:', err.message);
    console.log('\nRun this SQL directly in Supabase to check:');
    console.log(`
SELECT
    tgname as trigger_name,
    proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE t.tgrelid = 'kiosk_users'::regclass;
    `);
});