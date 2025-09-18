import fetch from 'node-fetch';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

async function checkColumnTypes() {
    console.log('🔍 CHECKING COLUMN TYPES IN EXISTING TABLES');
    console.log('==========================================\n');

    // Fetch sample data from profiles to see actual values
    const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?limit=1`, {
        headers: {
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'apikey': SERVICE_KEY
        }
    });

    if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
            console.log('📊 Sample profile record:');
            console.log('-------------------------');
            const profile = data[0];

            for (const [key, value] of Object.entries(profile)) {
                const valueType = value === null ? 'null' : typeof value;
                const displayValue = value === null ? 'null' :
                                   typeof value === 'object' ? JSON.stringify(value).substring(0, 50) :
                                   String(value).substring(0, 50);

                console.log(`${key}:`);
                console.log(`  Value: ${displayValue}`);
                console.log(`  Type: ${valueType}`);

                // Check if it looks like a UUID
                if (typeof value === 'string' &&
                    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
                    console.log(`  ⚠️  This appears to be a UUID!`);
                }
                console.log('');
            }

            console.log('\n🔍 ANALYSIS:');
            console.log('============');
            if (profile.org_id) {
                console.log(`org_id value: ${profile.org_id}`);
                if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profile.org_id)) {
                    console.log('❌ org_id IS A UUID, not an INT!');
                    console.log('   We need to change the master_users table to use UUID for org_id');
                } else if (typeof profile.org_id === 'number') {
                    console.log('✅ org_id is a number (INT)');
                } else {
                    console.log(`⚠️  org_id has unexpected type: ${typeof profile.org_id}`);
                }
            } else {
                console.log('org_id is null in this sample');
            }

            // Check other ID fields
            if (profile.site_id) {
                console.log(`\nsite_id value: ${profile.site_id}`);
                console.log(`site_id type: ${typeof profile.site_id}`);
            }

            if (profile.team_id) {
                console.log(`\nteam_id value: ${profile.team_id}`);
                console.log(`team_id type: ${typeof profile.team_id}`);
            }
        } else {
            console.log('No profiles found');
        }
    } else {
        console.log('Error fetching profiles:', await response.text());
    }
}

// Run the check
checkColumnTypes().catch(console.error);