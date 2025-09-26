import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SERVICE_KEY = 'sb_secret_ylIhDtikpno4LTTUmpDJvw_Ov7BtIEp';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function testNHSColumns() {
    console.log('Testing NHS columns in CQC All GPs table...\n');

    try {
        // Find a test record
        const { data: records, error: fetchError } = await supabase
            .from('CQC All GPs')
            .select('location_id, location_name, ods_code')
            .not('ods_code', 'is', null)
            .limit(1);

        if (fetchError) {
            console.error('Error fetching:', fetchError);
            return;
        }

        if (records && records.length > 0) {
            const testRecord = records[0];
            console.log(`Testing with: ${testRecord.location_name} (${testRecord.ods_code})`);

            // Try to update with NHS data
            const testData = {
                nhs_ods_data: { test: true, timestamp: new Date().toISOString() },
                nhs_prescribing_data: { test: true },
                nhs_data_quality_score: 50.0,
                nhs_data_completeness: { ods: true, prescribing: true },
                nhs_last_updated: new Date().toISOString()
            };

            const { error: updateError } = await supabase
                .from('CQC All GPs')
                .update(testData)
                .eq('location_id', testRecord.location_id);

            if (updateError) {
                console.log('❌ NHS columns do not exist yet');
                console.log('Error:', updateError.message);
                console.log('\n➡️ Please run ADD_NHS_COLUMNS_CORRECT.sql in Supabase SQL Editor');
            } else {
                console.log('✅ NHS columns exist and are working!');

                // Clean up test data
                await supabase
                    .from('CQC All GPs')
                    .update({
                        nhs_ods_data: null,
                        nhs_prescribing_data: null,
                        nhs_data_quality_score: null,
                        nhs_data_completeness: null,
                        nhs_last_updated: null
                    })
                    .eq('location_id', testRecord.location_id);

                console.log('✅ Test data cleaned up');
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

testNHSColumns();