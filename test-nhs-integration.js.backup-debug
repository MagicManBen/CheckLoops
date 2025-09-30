import fetch from 'node-fetch';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME';

// Test practice ODS codes (common GP practices)
const TEST_PRACTICES = [
    'A81001', // The Densham Surgery (Newcastle)
    'G82650', // The Medical Centre (Birmingham)
    'F84006', // Parkfield Medical Centre (Manchester)
    'P84034', // Jubilee Street Practice (London)
    'Y02733'  // York Medical Group
];

async function testNHSDataFetch() {
    console.log('Testing NHS Data Integration...\n');

    for (const odsCode of TEST_PRACTICES) {
        console.log(`\n==============================`);
        console.log(`Testing practice: ${odsCode}`);
        console.log(`==============================`);

        try {
            // 1. Call the fetch-nhs-data edge function
            const response = await fetch(`${SUPABASE_URL}/functions/v1/fetch-nhs-data`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    practice_ods_code: odsCode,
                    data_sources: ['ods', 'prescribing']
                })
            });

            const result = await response.json();

            console.log(`\nAPI Response Status: ${response.status}`);
            console.log(`Success: ${result.success}`);

            if (result.success) {
                console.log(`Data sources fetched: ${result.data_sources_fetched.join(', ')}`);

                // Check what data was retrieved
                if (result.data?.ods_data) {
                    console.log(`\n✓ ODS Data Retrieved:`);
                    console.log(`  - Practice Name: ${result.data.ods_data.name || 'N/A'}`);
                    console.log(`  - Status: ${result.data.ods_data.status || 'N/A'}`);
                    console.log(`  - Addresses: ${result.data.ods_data.addresses?.length || 0} address(es)`);
                    console.log(`  - Roles: ${result.data.ods_data.roles?.length || 0} role(s)`);
                } else {
                    console.log(`\n✗ No ODS data retrieved`);
                }

                if (result.data?.prescribing_data) {
                    console.log(`\n✓ Prescribing Data Retrieved:`);
                    console.log(`  - Data Month: ${result.data.prescribing_data.data_month || 'N/A'}`);
                    console.log(`  - Top Medications: ${result.data.prescribing_data.top_medications?.length || 0}`);
                    if (result.data.prescribing_data.top_medications?.length > 0) {
                        console.log(`  - Example: ${result.data.prescribing_data.top_medications[0].name}`);
                    }
                } else {
                    console.log(`\n✗ No prescribing data retrieved`);
                }
            } else {
                console.log(`\n✗ Failed to fetch data`);
                if (result.errors) {
                    console.log(`Errors:`, result.errors);
                }
            }

            // 2. Check if data was saved to database
            console.log(`\nChecking database storage...`);
            const dbResponse = await fetch(`${SUPABASE_URL}/rest/v1/NHS_All_GPs?practice_ods_code=eq.${odsCode}`, {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                }
            });

            const dbData = await dbResponse.json();

            if (dbData && dbData.length > 0) {
                const record = dbData[0];
                console.log(`✓ Data saved to NHS_All_GPs table`);
                console.log(`  - Practice Name: ${record.practice_name || 'N/A'}`);
                console.log(`  - Last Updated: ${record.last_updated || 'N/A'}`);
                console.log(`  - Has ODS Data: ${!!record.ods_data}`);
                console.log(`  - Has Prescribing Data: ${!!record.prescribing_data}`);
                console.log(`  - Has QOF Data: ${!!record.qof_data}`);
                console.log(`  - Has Patient Survey: ${!!record.patient_survey_data}`);
                console.log(`  - Data Quality Score: ${record.data_quality_score || 0}%`);
            } else {
                console.log(`✗ No data found in NHS_All_GPs table`);
            }

        } catch (error) {
            console.error(`Error testing ${odsCode}:`, error.message);
        }
    }

    console.log(`\n\n==============================`);
    console.log(`Test Summary`);
    console.log(`==============================`);
    console.log(`Tested ${TEST_PRACTICES.length} practices`);
    console.log(`Check the results above to verify:`);
    console.log(`1. API data retrieval completeness`);
    console.log(`2. Database storage completeness`);
}

// Run the test
testNHSDataFetch();