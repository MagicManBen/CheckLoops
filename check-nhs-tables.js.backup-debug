import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkNHSTables() {
    console.log('========================================');
    console.log('NHS TABLES & COLUMNS VERIFICATION');
    console.log('========================================\n');

    // 1. Check what tables are available in the API schema
    console.log('1. CHECKING API SCHEMA FOR TABLES');
    console.log('----------------------------------');

    const schemaResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        headers: {
            'apikey': ANON_KEY,
            'Authorization': `Bearer ${ANON_KEY}`
        }
    });

    const schema = await schemaResponse.json();
    const tablePaths = Object.keys(schema.paths || {});

    // Check for NHS tables
    const nhsTables = tablePaths.filter(path => path.toLowerCase().includes('nhs'));
    const cqcTables = tablePaths.filter(path => path.toLowerCase().includes('cqc'));

    console.log(`Found ${nhsTables.length} NHS-related tables:`);
    nhsTables.forEach(t => console.log(`  - ${t}`));

    console.log(`\nFound ${cqcTables.length} CQC-related tables:`);
    cqcTables.slice(0, 5).forEach(t => console.log(`  - ${t}`));

    // 2. Check if we can access NHS_All_GPs table
    console.log('\n2. CHECKING NHS_All_GPs TABLE ACCESS');
    console.log('----------------------------------');

    const { data: nhsData, error: nhsError } = await supabase
        .from('NHS_All_GPs')
        .select('*')
        .limit(1);

    if (nhsError) {
        console.log(`❌ NHS_All_GPs table NOT accessible`);
        console.log(`   Error: ${nhsError.message}`);
    } else {
        console.log(`✅ NHS_All_GPs table IS accessible`);
        console.log(`   Rows found: ${nhsData?.length || 0}`);
    }

    // 3. Check if we can access NHS_Reference_Data table
    console.log('\n3. CHECKING NHS_Reference_Data TABLE ACCESS');
    console.log('----------------------------------');

    const { data: refData, error: refError } = await supabase
        .from('NHS_Reference_Data')
        .select('*')
        .limit(1);

    if (refError) {
        console.log(`❌ NHS_Reference_Data table NOT accessible`);
        console.log(`   Error: ${refError.message}`);
    } else {
        console.log(`✅ NHS_Reference_Data table IS accessible`);
        console.log(`   Rows found: ${refData?.length || 0}`);
    }

    // 4. Check if we can access NHS_CSV_Import_Log table
    console.log('\n4. CHECKING NHS_CSV_Import_Log TABLE ACCESS');
    console.log('----------------------------------');

    const { data: logData, error: logError } = await supabase
        .from('NHS_CSV_Import_Log')
        .select('*')
        .limit(1);

    if (logError) {
        console.log(`❌ NHS_CSV_Import_Log table NOT accessible`);
        console.log(`   Error: ${logError.message}`);
    } else {
        console.log(`✅ NHS_CSV_Import_Log table IS accessible`);
        console.log(`   Rows found: ${logData?.length || 0}`);
    }

    // 5. Check CQC All GPs table structure
    console.log('\n5. CHECKING CQC All GPs TABLE STRUCTURE');
    console.log('----------------------------------');

    const { data: cqcSample, error: cqcError } = await supabase
        .from('CQC All GPs')
        .select('*')
        .limit(1)
        .single();

    if (cqcError) {
        console.log(`❌ CQC All GPs table NOT accessible`);
        console.log(`   Error: ${cqcError.message}`);
    } else {
        console.log(`✅ CQC All GPs table IS accessible`);

        // Check for NHS columns
        const nhsColumns = [
            'nhs_ods_data',
            'nhs_qof_data',
            'nhs_patient_survey_data',
            'nhs_workforce_data',
            'nhs_prescribing_data',
            'nhs_appointments_data',
            'nhs_referrals_data',
            'nhs_data_quality_score',
            'nhs_data_completeness',
            'nhs_last_updated'
        ];

        console.log('\n   NHS Columns in CQC All GPs table:');
        nhsColumns.forEach(col => {
            const exists = cqcSample && col in cqcSample;
            console.log(`   ${exists ? '✅' : '❌'} ${col}`);
        });
    }

    // 6. Summary and recommendations
    console.log('\n========================================');
    console.log('SUMMARY & RECOMMENDATIONS');
    console.log('========================================\n');

    const needsNHSTables = nhsError && refError && logError;
    const needsNHSColumns = cqcSample && !('nhs_ods_data' in cqcSample);

    if (needsNHSTables) {
        console.log('⚠️ NHS TABLES DO NOT EXIST - SQL script needed to create them');
    } else {
        console.log('✅ NHS tables exist (but may not be in API cache yet)');
    }

    if (needsNHSColumns) {
        console.log('⚠️ NHS COLUMNS DO NOT EXIST in CQC table - SQL script needed to add them');
    } else if (cqcSample) {
        console.log('✅ NHS columns exist in CQC All GPs table');
    }

    return { needsNHSTables, needsNHSColumns };
}

// Run the check
checkNHSTables().then(({ needsNHSTables, needsNHSColumns }) => {
    if (needsNHSTables || needsNHSColumns) {
        console.log('\n========================================');
        console.log('SQL SCRIPTS NEEDED');
        console.log('========================================');
        console.log('\nSQL scripts have been generated:');
        if (needsNHSTables) {
            console.log('1. CREATE_NHS_TABLES_FINAL.sql - Creates all NHS tables');
        }
        if (needsNHSColumns) {
            console.log('2. ADD_NHS_COLUMNS_TO_CQC_FINAL.sql - Adds NHS columns to CQC table');
        }
        console.log('\nPlease run the appropriate SQL script(s) in Supabase SQL Editor');
    }
});