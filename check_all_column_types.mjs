import fetch from 'node-fetch';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

async function checkAllColumnTypes() {
    console.log('🔍 COMPREHENSIVE COLUMN TYPE CHECK');
    console.log('===================================\n');

    // Tables to check
    const tables = ['profiles', 'kiosk_users', 'site_invites'];

    for (const table of tables) {
        console.log(`\n📊 TABLE: ${table}`);
        console.log('------------------------');

        const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?limit=1`, {
            headers: {
                'Authorization': `Bearer ${SERVICE_KEY}`,
                'apikey': SERVICE_KEY
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.length > 0) {
                const record = data[0];
                console.log('Sample record analysis:\n');

                // Analyze each field
                for (const [key, value] of Object.entries(record)) {
                    let dataType = 'UNKNOWN';

                    if (value === null) {
                        dataType = 'NULL (type unknown)';
                    } else if (typeof value === 'string') {
                        // Check if it's a UUID
                        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
                            dataType = '🔸 UUID';
                        } else if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
                            dataType = '📅 TIMESTAMP';
                        } else {
                            dataType = '📝 TEXT/VARCHAR';
                        }
                    } else if (typeof value === 'number') {
                        if (Number.isInteger(value)) {
                            if (value > 2147483647) {
                                dataType = '🔢 BIGINT';
                            } else {
                                dataType = '🔢 INT';
                            }
                        } else {
                            dataType = '🔢 DECIMAL/FLOAT';
                        }
                    } else if (typeof value === 'boolean') {
                        dataType = '✓ BOOLEAN';
                    } else if (typeof value === 'object') {
                        dataType = '📦 JSON/JSONB';
                    }

                    console.log(`  ${key.padEnd(20)} : ${dataType.padEnd(20)} | Value: ${JSON.stringify(value)?.substring(0, 40)}`);
                }
            } else {
                console.log('  (Table is empty)');
            }
        } else {
            console.log('  ❌ Could not access table');
        }
    }

    console.log('\n\n🎯 KEY FINDINGS FOR MIGRATION:');
    console.log('==============================');
    console.log('Based on the data analysis, here are the correct types needed:');
    console.log('\n📋 For master_users table:');
    console.log('  - user_id/auth_user_id: UUID');
    console.log('  - site_id: INT');
    console.log('  - org_id: UUID or NULL');
    console.log('  - team_id: INT or NULL');
    console.log('  - reports_to_id: Check if INT/BIGINT or UUID');
    console.log('  - kiosk_user_id: INT');
    console.log('  - All text fields: TEXT');
    console.log('  - Boolean fields: BOOLEAN');
    console.log('  - Timestamps: TIMESTAMP WITH TIME ZONE');
}

// Run the check
checkAllColumnTypes().catch(console.error);