import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkTablesViaSQL() {
    console.log('Checking tables via SQL...\n');

    // Use raw SQL to check for tables
    const { data, error } = await supabase.rpc('query_json', {
        query_text: `
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name LIKE '%NHS%'
            ORDER BY table_name
        `
    });

    if (error) {
        console.log('RPC not available, trying direct SQL via REST...');

        // Try using fetch to run SQL directly
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                query: `SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'NHS_All_GPs'`
            })
        });

        if (response.ok) {
            const result = await response.json();
            console.log('SQL Result:', result);
        } else {
            console.log('Direct SQL failed:', await response.text());

            // Try to insert via direct SQL POST
            console.log('\nTrying direct SQL insert via POST...');
            const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/NHS_All_GPs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SERVICE_ROLE_KEY,
                    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    practice_ods_code: 'TEST002',
                    practice_name: 'Test via POST'
                })
            });

            if (insertResponse.ok) {
                console.log('✅ Direct POST insert succeeded!');
                const data = await insertResponse.json();
                console.log('Inserted data:', data);

                // Clean up
                const deleteResponse = await fetch(`${SUPABASE_URL}/rest/v1/NHS_All_GPs?practice_ods_code=eq.TEST002`, {
                    method: 'DELETE',
                    headers: {
                        'apikey': SERVICE_ROLE_KEY,
                        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
                    }
                });

                if (deleteResponse.ok) {
                    console.log('✅ Cleanup successful');
                }
            } else {
                const errorText = await insertResponse.text();
                console.log('❌ Direct POST insert failed:', errorText);
            }
        }
    } else {
        console.log('Tables found via SQL:', data);
    }
}

checkTablesViaSQL();