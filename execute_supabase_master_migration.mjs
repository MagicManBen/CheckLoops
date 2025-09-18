import fetch from 'node-fetch';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

async function checkTableExists(tableName) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?limit=1`, {
        headers: {
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'apikey': SERVICE_KEY
        }
    });
    return response.ok;
}

async function fetchData(table, limit = 100) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?limit=${limit}`, {
        headers: {
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'apikey': SERVICE_KEY
        }
    });

    if (response.ok) {
        return await response.json();
    }
    return [];
}

async function insertData(table, data) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'apikey': SERVICE_KEY,
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to insert into ${table}: ${error}`);
    }
    return await response.json();
}

async function executeMasterUsersMigration() {
    console.log('🚀 EXECUTING MASTER_USERS TABLE CREATION AND MIGRATION');
    console.log('=====================================================\n');

    try {
        // Step 1: Check if master_users table exists
        console.log('📋 Step 1: Checking if master_users table exists...');
        const masterUsersExists = await checkTableExists('master_users');

        if (masterUsersExists) {
            console.log('✅ master_users table already exists!');

            // Check if it has data
            const existingData = await fetchData('master_users', 1);
            if (existingData.length > 0) {
                console.log('⚠️  Table already contains data. Skipping migration to avoid duplicates.');
                console.log('   If you want to re-run migration, please clear the table first.');
                return;
            }
        } else {
            console.log('❌ master_users table does not exist.');
            console.log('📝 Please create the table first using the SQL provided in master_users_migration.sql');
            console.log('   Run this in the Supabase SQL Editor.');
            return;
        }

        // Step 2: Fetch existing data
        console.log('\n📋 Step 2: Fetching existing data...');

        const [profiles, invites] = await Promise.all([
            fetchData('profiles'),
            fetchData('site_invites')
        ]);

        console.log(`  ✅ Found ${profiles.length} profiles`);
        console.log(`  ✅ Found ${invites.length} invitations`);

        // Step 3: Prepare migration data
        console.log('\n📋 Step 3: Preparing migration data...');

        const masterUsersData = [];

        // Process profiles
        for (const profile of profiles) {
            // Find matching invite to get email
            const matchingInvite = invites.find(inv =>
                (inv.status === 'accepted' && inv.full_name === profile.full_name) ||
                (inv.status === 'accepted' && inv.site_id === profile.site_id)
            );

            const masterUser = {
                auth_user_id: profile.user_id,
                email: matchingInvite?.email || `user_${profile.user_id}@placeholder.com`,
                full_name: profile.full_name || 'Unknown User',
                nickname: profile.nickname || null,
                avatar_url: profile.avatar_url || null,
                site_id: profile.site_id,
                org_id: profile.org_id || null,
                access_type: profile.role === 'admin' ? 'admin' :
                            profile.role === 'owner' ? 'owner' : 'staff',
                role_detail: profile.role_detail || null,
                active: profile.active !== false,
                team_id: profile.team_id || null,
                team_name: profile.team_name || null,
                reports_to_id: profile.reports_to_id || null,
                pin_hash: profile.pin_hash || null,
                pin_hmac: profile.pin_hmac || null,
                invite_status: 'active',
                onboarding_complete: profile.onboarding_complete || false,
                next_quiz_due: profile.next_quiz_due || null,
                kiosk_user_id: profile.kiosk_user_id || null,
                created_at: profile.created_at || new Date().toISOString(),
                holiday_approved: false,
                holiday_entitlement: 25, // Default annual leave
                holiday_taken: 0
            };

            masterUsersData.push(masterUser);
        }

        // Process pending invitations (not accepted yet)
        const pendingInvites = invites.filter(inv => inv.status === 'pending');
        for (const invite of pendingInvites) {
            const masterUser = {
                email: invite.email,
                full_name: invite.full_name || 'Pending User',
                site_id: invite.site_id,
                access_type: invite.role === 'admin' ? 'admin' :
                            invite.role === 'owner' ? 'owner' : 'staff',
                role_detail: invite.role_detail || null,
                active: false,
                reports_to_id: invite.reports_to_id || null,
                invite_status: 'pending',
                invited_by: invite.invited_by || null,
                invite_token: invite.token || null,
                invite_sent_at: invite.created_at || null,
                invite_expires_at: invite.expires_at || null,
                allowed_pages: invite.allowed_pages || null,
                created_at: invite.created_at || new Date().toISOString(),
                holiday_approved: false,
                holiday_entitlement: 25,
                holiday_taken: 0
            };
            masterUsersData.push(masterUser);
        }

        console.log(`  ✅ Prepared ${masterUsersData.length} records for migration`);

        // Step 4: Insert data into master_users
        console.log('\n📋 Step 4: Inserting data into master_users...');

        if (masterUsersData.length > 0) {
            try {
                const inserted = await insertData('master_users', masterUsersData);
                console.log(`  ✅ Successfully inserted ${Array.isArray(inserted) ? inserted.length : 1} records`);
            } catch (error) {
                console.error('  ❌ Error inserting data:', error.message);
                console.log('\n📝 Troubleshooting tips:');
                console.log('  1. Make sure the master_users table was created with the correct schema');
                console.log('  2. Check if there are any unique constraint violations');
                console.log('  3. Verify that all foreign key references are valid');
                return;
            }
        }

        // Step 5: Verify migration
        console.log('\n📋 Step 5: Verifying migration...');
        const migratedData = await fetchData('master_users');
        console.log(`  ✅ master_users table now contains ${migratedData.length} records`);

        // Display sample data
        if (migratedData.length > 0) {
            console.log('\n📊 Sample migrated data:');
            const sample = migratedData.slice(0, 3);
            sample.forEach((user, idx) => {
                console.log(`\n  User ${idx + 1}:`);
                console.log(`    ID: ${user.id}`);
                console.log(`    Email: ${user.email}`);
                console.log(`    Name: ${user.full_name}`);
                console.log(`    Access Type: ${user.access_type}`);
                console.log(`    Status: ${user.invite_status}`);
                console.log(`    Site ID: ${user.site_id}`);
            });
        }

        console.log('\n✅ MIGRATION COMPLETED SUCCESSFULLY!');
        console.log('=====================================\n');
        console.log('📝 Next Steps:');
        console.log('  1. Create the compatibility views (run the VIEW creation SQL)');
        console.log('  2. Test the application with the compatibility views');
        console.log('  3. Once verified, update the HTML files to use master_users directly');
        console.log('  4. Remove the compatibility views and rename old tables to _backup');

        console.log('\n⚠️  IMPORTANT:');
        console.log('  - The application should continue to work with the compatibility views');
        console.log('  - Test thoroughly before removing the old tables');
        console.log('  - Keep backups of the original tables');

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        console.log('\n📝 Please check:');
        console.log('  1. The master_users table exists with correct schema');
        console.log('  2. You have proper permissions');
        console.log('  3. The service key is valid');
    }
}

// Execute the migration
console.log('Starting migration process...\n');
executeMasterUsersMigration().catch(console.error);