import fetch from 'node-fetch';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SERVICE_KEY = (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) || '';
if (!SERVICE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY not set in environment');
}

// Email to preserve (corrected - no dot after 'ben')
const PRESERVE_EMAIL = 'benhowardmagic@hotmail.com';

async function cleanUsersForTesting() {
    console.log('🧹 CLEANING USERS FOR TESTING');
    console.log('==============================\n');
    console.log(`Preserving only: ${PRESERVE_EMAIL}`);
    console.log('Deleting all other users...\n');

    try {
        // Step 1: Find the user to preserve
        console.log('📋 Step 1: Finding user to preserve...');

        const preserveUserResp = await fetch(
            `${SUPABASE_URL}/rest/v1/master_users?email=eq.${encodeURIComponent(PRESERVE_EMAIL)}`,
            {
                headers: {
                    'Authorization': `Bearer ${SERVICE_KEY}`,
                    'apikey': SERVICE_KEY
                }
            }
        );

        let preserveUserId = null;
        let preserveUserAuthId = null;

        if (preserveUserResp.ok) {
            const users = await preserveUserResp.json();
            if (users.length > 0) {
                preserveUserId = users[0].id;
                preserveUserAuthId = users[0].auth_user_id;
                console.log(`✅ Found user to preserve:`);
                console.log(`   - Master User ID: ${preserveUserId}`);
                console.log(`   - Auth User ID: ${preserveUserAuthId}`);
                console.log(`   - Email: ${users[0].email}`);
                console.log(`   - Name: ${users[0].full_name}`);
            } else {
                console.log(`⚠️  User with email ${PRESERVE_EMAIL} not found in master_users`);
                console.log('   This user will be able to sign up fresh');
            }
        }

        // Step 2: Get count of users before deletion
        console.log('\n📋 Step 2: Checking current users...');

        const countResp = await fetch(
            `${SUPABASE_URL}/rest/v1/master_users?select=*`,
            {
                headers: {
                    'Authorization': `Bearer ${SERVICE_KEY}`,
                    'apikey': SERVICE_KEY,
                    'Prefer': 'count=exact'
                }
            }
        );

        if (countResp.ok) {
            const totalCount = countResp.headers.get('content-range')?.split('/')[1] || '0';
            console.log(`   Total users before cleanup: ${totalCount}`);
        }

        // Step 3: Delete all other users from master_users
        console.log('\n📋 Step 3: Deleting users from master_users...');

        let deleteQuery = `${SUPABASE_URL}/rest/v1/master_users`;
        if (preserveUserId) {
            // Delete all users except the one to preserve
            deleteQuery += `?id=neq.${preserveUserId}`;
        } else {
            // Delete ALL users (need a WHERE clause that matches all)
            deleteQuery += `?id=neq.00000000-0000-0000-0000-000000000000`;  // This will match all real IDs
        }

        const deleteResp = await fetch(deleteQuery, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${SERVICE_KEY}`,
                'apikey': SERVICE_KEY,
                'Prefer': 'count=exact'
            }
        });

        if (deleteResp.ok || deleteResp.status === 204) {
            const deletedCount = deleteResp.headers.get('content-range')?.split('/')[1] || 'unknown';
            console.log(`   ✅ Deleted users from master_users`);
        } else {
            console.log(`   ❌ Error deleting users: ${await deleteResp.text()}`);
        }

        // Step 4: Clean up related tables (that aren't views)
        console.log('\n📋 Step 4: Cleaning up related tables...');

        const tablesToClean = [
            'submissions',
            'complaints',
            'training_records',
            'meeting_attendees',
            'quiz_attempts',
            'user_achievements',
            '4_holiday_requests',
            '3_staff_working_patterns',
            '2_staff_entitlements',
            '1_staff_holiday_profiles'
        ];

        for (const table of tablesToClean) {
            try {
                // Build delete query based on whether we're preserving a user
                let query = `${SUPABASE_URL}/rest/v1/${table}`;

                // For tables with user_id field
                if (preserveUserAuthId && ['training_records', '4_holiday_requests', '3_staff_working_patterns', '1_staff_holiday_profiles'].includes(table)) {
                    query += `?user_id=neq.${preserveUserAuthId}`;
                } else if (preserveUserId && table === 'submissions') {
                    // Submissions might have various user fields
                    query += `?or=(user_id.neq.${preserveUserAuthId},user_id.is.null)`;
                }

                const resp = await fetch(query, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${SERVICE_KEY}`,
                        'apikey': SERVICE_KEY
                    }
                });

                if (resp.ok || resp.status === 204) {
                    console.log(`   ✅ Cleaned ${table}`);
                } else {
                    // Table might not exist or have no records
                    console.log(`   ⚠️  Skipped ${table} (may not exist or be empty)`);
                }
            } catch (error) {
                console.log(`   ⚠️  Could not clean ${table}`);
            }
        }

        // Step 5: Clean auth.users (if we can)
        console.log('\n📋 Step 5: Note about auth.users...');
        console.log('   ⚠️  auth.users table cannot be directly cleaned via REST API');
        console.log('   Users will remain in auth.users but won\'t have profiles');

        // Step 6: Verify the cleanup
        console.log('\n📋 Step 6: Verifying cleanup...');

        const verifyResp = await fetch(
            `${SUPABASE_URL}/rest/v1/master_users?select=id,email,full_name,access_type`,
            {
                headers: {
                    'Authorization': `Bearer ${SERVICE_KEY}`,
                    'apikey': SERVICE_KEY
                }
            }
        );

        if (verifyResp.ok) {
            const remainingUsers = await verifyResp.json();
            console.log(`\n✅ Cleanup complete!`);
            console.log(`   Remaining users: ${remainingUsers.length}`);

            if (remainingUsers.length > 0) {
                console.log('\n   Preserved users:');
                remainingUsers.forEach(user => {
                    console.log(`   - ${user.email} (${user.full_name}) - ${user.access_type}`);
                });
            } else {
                console.log('   No users remaining - ready for fresh signup testing!');
            }
        }

        // Step 7: Check the views
        console.log('\n📋 Step 7: Checking views...');

        const viewChecks = ['profiles', 'kiosk_users', 'site_invites'];
        for (const view of viewChecks) {
            const resp = await fetch(
                `${SUPABASE_URL}/rest/v1/${view}?select=*`,
                {
                    headers: {
                        'Authorization': `Bearer ${SERVICE_KEY}`,
                        'apikey': SERVICE_KEY,
                        'Prefer': 'count=exact'
                    }
                }
            );

            if (resp.ok) {
                const count = resp.headers.get('content-range')?.split('/')[1] || '0';
                console.log(`   ${view} view: ${count} records`);
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log('🎉 USER CLEANUP COMPLETE!');
        console.log('='.repeat(50));
        console.log('\nYou can now test the full signup process.');
        console.log('\nNOTE: Users may still exist in auth.users table');
        console.log('but they have no profile data, so signup will work.');

        if (preserveUserId) {
            console.log(`\n✅ Preserved: ${PRESERVE_EMAIL}`);
        } else {
            console.log(`\n⚠️  ${PRESERVE_EMAIL} was not found, so all users deleted`);
        }

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    }
}

// Run the cleanup
console.log('Starting user cleanup for testing...\n');
cleanUsersForTesting().catch(console.error);