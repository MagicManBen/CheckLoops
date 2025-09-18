import fetch from 'node-fetch';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

async function quickFixAdmin() {
    console.log('🚀 Quick fix for admin access...\n');

    // Update ONLY the columns that exist
    const updatePayload = {
        access_type: 'admin',
        role_detail: 'Admin',
        updated_at: new Date().toISOString()
    };

    console.log('Updating master_users with:', updatePayload);

    const updateResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/master_users?email=eq.benhowardmagic@hotmail.com`,
        {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${SERVICE_KEY}`,
                'apikey': SERVICE_KEY,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(updatePayload)
        }
    );

    if (updateResponse.ok) {
        const result = await updateResponse.json();
        console.log('✅ Successfully updated master_users:');
        console.log('   - access_type:', result[0]?.access_type);
        console.log('   - role_detail:', result[0]?.role_detail);
    } else {
        const error = await updateResponse.text();
        console.log('❌ Failed to update master_users:', error);
    }

    // Verify the fix
    console.log('\n✅ Verifying the fix in profiles view...');
    const profilesResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?select=*&user_id=eq.55f1b4e6-01f4-452d-8d6c-617fe7794873`,
        {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SERVICE_KEY}`,
                'apikey': SERVICE_KEY,
                'Content-Type': 'application/json'
            }
        }
    );

    const profilesData = await profilesResponse.json();
    if (profilesData && profilesData.length > 0) {
        console.log('User in profiles view:');
        console.log('  - Role:', profilesData[0].role);
        console.log('  - Full Name:', profilesData[0].full_name);
        console.log('  - Site ID:', profilesData[0].site_id);

        if (profilesData[0].role === 'admin') {
            console.log('\n🎉 SUCCESS: User now has admin role!');
        } else {
            console.log('\n⚠️ User role is still:', profilesData[0].role);
        }
    }
}

quickFixAdmin().catch(console.error);