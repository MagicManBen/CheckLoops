import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testDirectInsert() {
    console.log('Testing direct table access...\n');

    // First, check if table exists
    const { data: tableCheck, error: tableError } = await supabase
        .from('NHS_All_GPs')
        .select('count', { count: 'exact', head: true });

    if (tableError) {
        console.log('❌ Error accessing NHS_All_GPs table:', tableError.message);

        // Try to list all tables to see what exists
        const { data: tables, error: tablesError } = await supabase
            .rpc('get_tables', {});

        if (!tablesError && tables) {
            console.log('\nAvailable tables:', tables);
        }
    } else {
        console.log('✅ NHS_All_GPs table exists and is accessible');
    }

    // Try to insert test data
    console.log('\nTrying to insert test data...');
    const testData = {
        practice_ods_code: 'TEST001',
        practice_name: 'Test Practice',
        ods_data: { test: true, name: 'Test Practice' },
        data_quality_score: 50.0,
        data_completeness: { ods_data: true, qof_data: false }
    };

    const { data: insertData, error: insertError } = await supabase
        .from('NHS_All_GPs')
        .insert(testData)
        .select()
        .single();

    if (insertError) {
        console.log('❌ Error inserting test data:', insertError.message);
    } else {
        console.log('✅ Test data inserted successfully:', insertData);

        // Clean up test data
        const { error: deleteError } = await supabase
            .from('NHS_All_GPs')
            .delete()
            .eq('practice_ods_code', 'TEST001');

        if (!deleteError) {
            console.log('✅ Test data cleaned up');
        }
    }

    // Check if we can query the CQC table
    console.log('\nChecking CQC table access...');
    const { data: cqcData, error: cqcError } = await supabase
        .from('CQC all GPs')
        .select('location_name')
        .limit(1);

    if (cqcError) {
        console.log('❌ Error accessing CQC table:', cqcError.message);
    } else {
        console.log('✅ CQC table is accessible');
    }
}

testDirectInsert();