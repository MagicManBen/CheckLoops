import fetch from 'node-fetch';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

async function testUpsert() {
    console.log('🧪 Testing upsert functionality...\n');

    // Test data that would be sent from staff-welcome.html
    const profileData = {
        user_id: '55f1b4e6-01f4-452d-8d6c-617fe7794873',
        nickname: 'Benjamin B',
        role_detail: 'Admin',
        team_id: 3,
        team_name: 'Nursing',
        avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Benjamin'
    };

    console.log('📝 Attempting upsert with:', profileData);

    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SERVICE_KEY}`,
                'apikey': SERVICE_KEY,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates,return=representation'
            },
            body: JSON.stringify(profileData)
        }
    );

    if (response.ok) {
        const result = await response.json();
        console.log('✅ Upsert successful!');
        console.log('Result:', result);
    } else {
        const error = await response.text();
        console.log('❌ Upsert failed:', error);

        // Parse the error
        try {
            const errorObj = JSON.parse(error);
            if (errorObj.code === '23505') {
                console.log('\n⚠️ DUPLICATE KEY CONSTRAINT VIOLATION');
                console.log('This means the INSTEAD OF triggers need to be fixed.');
                console.log('Please run the FIX_TRIGGERS_FINAL.sql in Supabase SQL editor.');
            }
        } catch (e) {
            // Not JSON
        }
    }

    // Test staff_app_welcome upsert
    console.log('\n📝 Testing staff_app_welcome upsert...');
    const welcomeData = {
        user_id: '55f1b4e6-01f4-452d-8d6c-617fe7794873',
        site_id: 2,
        nickname: 'Benjamin B',
        role_detail: 'Admin',
        team_name: 'Nursing'
    };

    const welcomeResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/staff_app_welcome`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SERVICE_KEY}`,
                'apikey': SERVICE_KEY,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates,return=representation'
            },
            body: JSON.stringify(welcomeData)
        }
    );

    if (welcomeResponse.ok) {
        console.log('✅ staff_app_welcome upsert successful!');
    } else {
        const error = await welcomeResponse.text();
        console.log('❌ staff_app_welcome upsert failed:', error);
    }
}

testUpsert().catch(console.error);