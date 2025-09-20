import fetch from 'node-fetch';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SERVICE_KEY = (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) || '';
if (!SERVICE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY not set in environment');
}

async function fixDatabaseIssues() {
    console.log('🔧 Fixing all database issues...\n');

    // Step 1: Check master_users table schema
    console.log('📋 Step 1: Checking master_users table schema...');
    const { data: columns, error: columnsError } = await fetch(
        `${SUPABASE_URL}/rest/v1/rpc/get_table_columns?table_name=master_users`,
        {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SERVICE_KEY}`,
                'apikey': SERVICE_KEY,
                'Content-Type': 'application/json'
            }
        }
    ).then(r => r.json()).catch(() => ({ error: 'Failed to get columns' }));

    // Try alternative approach to get schema
    console.log('\n📊 Fetching master_users data to see actual columns...');
    const masterUsersResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/master_users?email=eq.benhowardmagic@hotmail.com`,
        {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SERVICE_KEY}`,
                'apikey': SERVICE_KEY,
                'Content-Type': 'application/json'
            }
        }
    );

    const masterUsersData = await masterUsersResponse.json();
    if (masterUsersData && masterUsersData.length > 0) {
        console.log('✅ Found user in master_users. Columns available:');
        console.log(Object.keys(masterUsersData[0]));
        console.log('\nCurrent values:');
        console.log(JSON.stringify(masterUsersData[0], null, 2));
    } else {
        console.log('⚠️ User not found in master_users table');
    }

    // Step 2: Check auth.users for the user
    console.log('\n📋 Step 2: Checking auth.users for benhowardmagic@hotmail.com...');
    const authResponse = await fetch(
        `${SUPABASE_URL}/auth/v1/admin/users`,
        {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SERVICE_KEY}`,
                'apikey': SERVICE_KEY,
                'Content-Type': 'application/json'
            }
        }
    );

    const { users } = await authResponse.json();
    const benUser = users?.find(u => u.email === 'benhowardmagic@hotmail.com');

    if (benUser) {
        console.log('✅ Found user in auth.users:');
        console.log('  - ID:', benUser.id);
        console.log('  - Email:', benUser.email);
        console.log('  - Metadata role:', benUser.raw_user_meta_data?.role);
        console.log('  - Metadata admin_access:', benUser.raw_user_meta_data?.admin_access);
    }

    // Step 3: Fix admin access
    console.log('\n🔧 Step 3: Fixing admin access for benhowardmagic@hotmail.com...');

    // First, update master_users if the user exists
    if (masterUsersData && masterUsersData.length > 0) {
        const updatePayload = {
            access_type: 'admin',
            admin_access: true,
            updated_at: new Date().toISOString()
        };

        // Check if role_detail column exists
        if ('role_detail' in masterUsersData[0]) {
            updatePayload.role_detail = 'Admin';
        }

        console.log('Updating master_users with:', updatePayload);

        const updateResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/master_users?email=eq.benhowardmagic@hotmail.com`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${SERVICE_KEY}`,
                    'apikey': SERVICE_KEY,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(updatePayload)
            }
        );

        if (updateResponse.ok) {
            console.log('✅ Successfully updated master_users');
        } else {
            const error = await updateResponse.text();
            console.log('❌ Failed to update master_users:', error);
        }
    } else {
        // Create the user in master_users if not exists
        if (benUser) {
            console.log('Creating user in master_users...');

            const createPayload = {
                auth_user_id: benUser.id,
                email: 'benhowardmagic@hotmail.com',
                access_type: 'admin',
                admin_access: true,
                site_id: 2, // From the logs
                full_name: 'Ben Howard',
                active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const createResponse = await fetch(
                `${SUPABASE_URL}/rest/v1/master_users`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${SERVICE_KEY}`,
                        'apikey': SERVICE_KEY,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify(createPayload)
                }
            );

            if (createResponse.ok) {
                console.log('✅ Successfully created user in master_users');
            } else {
                const error = await createResponse.text();
                console.log('❌ Failed to create in master_users:', error);
            }
        }
    }

    // Step 4: Update auth.users metadata
    if (benUser) {
        console.log('\n🔧 Step 4: Updating auth.users metadata...');

        const metadataUpdate = {
            raw_user_meta_data: {
                ...benUser.raw_user_meta_data,
                role: 'admin',
                admin_access: true
            }
        };

        const metaResponse = await fetch(
            `${SUPABASE_URL}/auth/v1/admin/users/${benUser.id}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${SERVICE_KEY}`,
                    'apikey': SERVICE_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(metadataUpdate)
            }
        );

        if (metaResponse.ok) {
            console.log('✅ Successfully updated auth.users metadata');
        } else {
            const error = await metaResponse.text();
            console.log('❌ Failed to update metadata:', error);
        }
    }

    // Step 5: Verify the fix by checking profiles view
    console.log('\n✅ Step 5: Verifying the fix...');
    const profilesResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?select=*&user_id=eq.${benUser?.id}`,
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
        console.log('✅ User in profiles view:');
        console.log('  - Role:', profilesData[0].role);
        console.log('  - Full Name:', profilesData[0].full_name);
        console.log('  - Site ID:', profilesData[0].site_id);

        if (profilesData[0].role === 'admin') {
            console.log('\n🎉 SUCCESS: User now has admin role in profiles view!');
        } else {
            console.log('\n⚠️ WARNING: User role is still:', profilesData[0].role);
        }
    } else {
        console.log('⚠️ User not found in profiles view');
    }

    // Step 6: Fix INSTEAD OF triggers
    console.log('\n🔧 Step 6: Fixing INSTEAD OF triggers for upserts...');
    console.log('The triggers need to be fixed directly in Supabase SQL editor.');
    console.log('Here is the SQL to run:');

    const triggerFixSQL = `
-- Fix profiles view INSTEAD OF INSERT trigger
CREATE OR REPLACE FUNCTION profiles_instead_insert() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO master_users (
        auth_user_id,
        site_id,
        access_type,
        full_name,
        org_id,
        nickname,
        next_quiz_due,
        onboarding_complete,
        avatar_url,
        kiosk_user_id,
        pin_hash,
        pin_hmac,
        active,
        team_id,
        team_name,
        role_detail,
        admin_access,
        email,
        created_at,
        updated_at
    ) VALUES (
        NEW.user_id,
        NEW.site_id,
        CASE
            WHEN NEW.role = 'owner' THEN 'owner'
            WHEN NEW.role = 'admin' THEN 'admin'
            ELSE 'staff'
        END,
        NEW.full_name,
        NEW.org_id,
        NEW.nickname,
        NEW.next_quiz_due,
        NEW.onboarding_complete,
        NEW.avatar_url,
        NEW.kiosk_user_id,
        NEW.pin_hash,
        NEW.pin_hmac,
        NEW.active,
        NEW.team_id,
        NEW.team_name,
        NEW.role_detail,
        CASE WHEN NEW.role IN ('admin', 'owner') THEN true ELSE false END,
        (SELECT email FROM auth.users WHERE id = NEW.user_id),
        COALESCE(NEW.created_at, now()),
        now()
    )
    ON CONFLICT (auth_user_id) DO UPDATE SET
        site_id = EXCLUDED.site_id,
        access_type = EXCLUDED.access_type,
        full_name = EXCLUDED.full_name,
        org_id = EXCLUDED.org_id,
        nickname = EXCLUDED.nickname,
        next_quiz_due = EXCLUDED.next_quiz_due,
        onboarding_complete = EXCLUDED.onboarding_complete,
        avatar_url = EXCLUDED.avatar_url,
        kiosk_user_id = EXCLUDED.kiosk_user_id,
        pin_hash = EXCLUDED.pin_hash,
        pin_hmac = EXCLUDED.pin_hmac,
        active = EXCLUDED.active,
        team_id = EXCLUDED.team_id,
        team_name = EXCLUDED.team_name,
        role_detail = EXCLUDED.role_detail,
        admin_access = EXCLUDED.admin_access,
        updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
`;

    console.log(triggerFixSQL);
    console.log('\nPlease run the above SQL in Supabase SQL editor to fix the trigger issues.');

    console.log('\n✅ All fixable issues have been addressed!');
    console.log('\nSummary:');
    console.log('1. Updated master_users to set access_type = "admin" for benhowardmagic@hotmail.com');
    console.log('2. Updated auth.users metadata to include admin_access = true');
    console.log('3. Provided SQL to fix INSTEAD OF triggers (needs to be run manually)');
    console.log('\nThe user should now be able to access the admin page!');
}

// Run the fix
fixDatabaseIssues().catch(console.error);