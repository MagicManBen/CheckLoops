import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFunctionDefinitions() {
    console.log('\n=== CHECKING FUNCTION DEFINITIONS ===\n');

    // Direct SQL to get function definitions
    const sql = `
        SELECT
            p.proname AS function_name,
            pg_get_functiondef(p.oid) AS definition
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname IN ('transfer_fuzzy_match_to_request', 'transfer_fuzzy_training_to_record')
    `;

    try {
        // Try using a direct postgres query
        const { data, error } = await supabase
            .from('pg_proc')
            .select('*')
            .limit(1);

        console.log('Direct table query test:', error ? error.message : 'Can query pg_proc');
    } catch (e) {
        console.log('Cannot directly query system tables');
    }

    // Test the functions by calling them with invalid parameters to see the error
    console.log('\nTesting function existence and errors...\n');

    // Test transfer_fuzzy_training_to_record
    try {
        const { data, error } = await supabase.rpc('transfer_fuzzy_training_to_record', {
            p_fuzzy_match_id: -999,  // Invalid ID
            p_user_id: '00000000-0000-0000-0000-000000000000',
            p_training_type_id: -999
        });

        if (error) {
            console.log('transfer_fuzzy_training_to_record error:', error.message);
            if (error.message.includes('profiles')) {
                console.log('❌ FUNCTION STILL REFERENCES PROFILES TABLE!');
            } else {
                console.log('✅ Error does not mention profiles');
            }
        }
    } catch (e) {
        console.log('transfer_fuzzy_training_to_record exception:', e.message);
    }

    // Test transfer_fuzzy_match_to_request
    try {
        const { data, error } = await supabase.rpc('transfer_fuzzy_match_to_request', {
            p_fuzzy_match_id: -999,  // Invalid ID
            p_user_id: '00000000-0000-0000-0000-000000000000'
        });

        if (error) {
            console.log('transfer_fuzzy_match_to_request error:', error.message);
            if (error.message.includes('profiles')) {
                console.log('❌ FUNCTION STILL REFERENCES PROFILES TABLE!');
            } else {
                console.log('✅ Error does not mention profiles');
            }
        }
    } catch (e) {
        console.log('transfer_fuzzy_match_to_request exception:', e.message);
    }

    console.log('\n=== END CHECK ===\n');
}

checkFunctionDefinitions().catch(console.error);