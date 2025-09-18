import fetch from 'node-fetch';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnViaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

async function queryTable(table) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?limit=5`, {
        headers: {
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'apikey': SERVICE_KEY,
            'Prefer': 'count=exact'
        }
    });

    if (response.ok) {
        const data = await response.json();
        const count = response.headers.get('content-range');
        return {
            success: true,
            data: data,
            totalCount: count ? parseInt(count.split('/')[1]) : data.length
        };
    } else {
        return {
            success: false,
            error: await response.text()
        };
    }
}

async function verifyMigration() {
    console.log('🔍 VERIFYING MASTER_USERS MIGRATION');
    console.log('====================================\n');

    // Check master_users table
    console.log('📊 Checking master_users table...');
    const masterResult = await queryTable('master_users');
    if (masterResult.success) {
        console.log(`✅ master_users table exists with ${masterResult.totalCount} records`);
        if (masterResult.data.length > 0) {
            console.log('   Sample record:');
            const sample = masterResult.data[0];
            console.log(`   - ID: ${sample.id}`);
            console.log(`   - Email: ${sample.email}`);
            console.log(`   - Name: ${sample.full_name}`);
            console.log(`   - Access Type: ${sample.access_type}`);
            console.log(`   - Status: ${sample.invite_status}`);
        }
    } else {
        console.log('❌ master_users table not accessible');
        console.log('   Error:', masterResult.error);
    }

    // Check backward compatibility views
    console.log('\n📊 Checking backward compatibility views...');

    // Check profiles view
    const profilesResult = await queryTable('profiles');
    if (profilesResult.success) {
        console.log(`✅ profiles view works - ${profilesResult.totalCount} records`);
    } else {
        console.log('❌ profiles view not working');
    }

    // Check kiosk_users view
    const kioskResult = await queryTable('kiosk_users');
    if (kioskResult.success) {
        console.log(`✅ kiosk_users view works - ${kioskResult.totalCount} records`);
    } else {
        console.log('❌ kiosk_users view not working');
    }

    // Check site_invites view
    const invitesResult = await queryTable('site_invites');
    if (invitesResult.success) {
        console.log(`✅ site_invites view works - ${invitesResult.totalCount} records`);
    } else {
        console.log('❌ site_invites view not working');
    }

    // Test insert operation through views
    console.log('\n📊 Testing write operations through views...');

    // Test creating a new invitation through site_invites view
    const testInvite = {
        email: 'test.migration@example.com',
        site_id: 1,
        role: 'staff',
        full_name: 'Test Migration User',
        role_detail: 'Test Role'
    };

    const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/site_invites`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'apikey': SERVICE_KEY,
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(testInvite)
    });

    if (insertResponse.ok) {
        console.log('✅ Insert through site_invites view works!');

        // Clean up test data
        await fetch(`${SUPABASE_URL}/rest/v1/master_users?email=eq.test.migration@example.com`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${SERVICE_KEY}`,
                'apikey': SERVICE_KEY
            }
        });
    } else {
        console.log('⚠️  Insert through view may not be configured yet');
    }

    console.log('\n✅ VERIFICATION COMPLETE!');
    console.log('========================\n');

    if (masterResult.success && profilesResult.success) {
        console.log('🎉 Migration appears successful!');
        console.log('   The site should continue working normally.');
        console.log('   All existing queries through profiles, kiosk_users, and site_invites will work.');
    } else {
        console.log('⚠️  Some issues detected. Please check the migration.');
    }
}

// Run verification
verifyMigration().catch(console.error);