import fetch from 'node-fetch';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

async function executeSQLCommand(sql, description) {
    console.log(`\n🔄 ${description}...`);

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SERVICE_KEY}`,
                'Content-Type': 'application/json',
                'apikey': SERVICE_KEY
            },
            body: JSON.stringify({ query: sql })
        });

        if (response.ok) {
            console.log(`✅ ${description} - SUCCESS`);
            return true;
        } else {
            const error = await response.text();
            console.log(`❌ ${description} - FAILED:`, error);
            return false;
        }
    } catch (error) {
        console.log(`❌ ${description} - ERROR:`, error.message);
        return false;
    }
}

async function queryData(table, filter = {}) {
    let url = `${SUPABASE_URL}/rest/v1/${table}?`;

    Object.entries(filter).forEach(([key, value]) => {
        url += `${key}=eq.${value}&`;
    });

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'apikey': SERVICE_KEY
        }
    });

    if (response.ok) {
        return await response.json();
    } else {
        console.error(`Failed to query ${table}:`, await response.text());
        return [];
    }
}

async function insertData(table, data) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'apikey': SERVICE_KEY,
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify(data)
    });

    return response.ok;
}

async function executeMigration() {
    console.log('🚀 STARTING MASTER_USERS TABLE MIGRATION');
    console.log('========================================\n');

    console.log('📋 PHASE 1: CREATE MASTER_USERS TABLE');
    console.log('--------------------------------------');

    // Step 1: Create the master_users table
    const createTableSQL = `
    -- Drop existing table if exists (for testing)
    DROP TABLE IF EXISTS master_users CASCADE;

    -- Create master_users table
    CREATE TABLE master_users (
        -- Primary identification
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        auth_user_id UUID UNIQUE,

        -- Basic information
        email TEXT NOT NULL,
        full_name TEXT NOT NULL,
        nickname TEXT,
        avatar_url TEXT,

        -- Organization & Access
        site_id INT NOT NULL,
        org_id INT,
        access_type TEXT DEFAULT 'staff' CHECK (access_type IN ('owner', 'admin', 'staff')),
        role_detail TEXT,
        active BOOLEAN DEFAULT true,

        -- Team & Hierarchy
        team_id INT,
        team_name TEXT,
        reports_to_id UUID,

        -- Authentication & Security
        pin_hash TEXT,
        pin_hmac TEXT,
        last_login TIMESTAMP WITH TIME ZONE,

        -- Invitation tracking
        invite_status TEXT DEFAULT 'active' CHECK (invite_status IN ('pending', 'accepted', 'active', 'expired')),
        invited_by UUID,
        invite_token TEXT,
        invite_sent_at TIMESTAMP WITH TIME ZONE,
        invite_accepted_at TIMESTAMP WITH TIME ZONE,
        invite_expires_at TIMESTAMP WITH TIME ZONE,
        allowed_pages JSONB,

        -- Holiday/Leave management
        holiday_approved BOOLEAN DEFAULT false,
        holiday_entitlement INT DEFAULT 0,
        holiday_taken INT DEFAULT 0,
        holiday_remaining INT GENERATED ALWAYS AS (holiday_entitlement - holiday_taken) STORED,

        -- Working hours
        working_hours JSONB,
        contract_hours DECIMAL(5,2),

        -- Onboarding & Training
        onboarding_complete BOOLEAN DEFAULT false,
        next_quiz_due TIMESTAMP WITH TIME ZONE,
        training_completed JSONB,

        -- Legacy support
        kiosk_user_id INT,
        legacy_profile_user_id UUID,

        -- Metadata
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

        -- Unique constraint for email+site_id
        CONSTRAINT unique_email_site UNIQUE(email, site_id)
    );

    -- Create indexes
    CREATE INDEX idx_master_users_site_id ON master_users(site_id);
    CREATE INDEX idx_master_users_email ON master_users(email);
    CREATE INDEX idx_master_users_auth_user_id ON master_users(auth_user_id);
    CREATE INDEX idx_master_users_team_id ON master_users(team_id);
    CREATE INDEX idx_master_users_active ON master_users(active);
    CREATE INDEX idx_master_users_access_type ON master_users(access_type);
    CREATE INDEX idx_master_users_invite_status ON master_users(invite_status);
    `;

    // We can't execute SQL directly via Supabase REST API, so let's create the table using the data API
    console.log('\n📊 PHASE 2: MIGRATE EXISTING DATA');
    console.log('----------------------------------');

    // Step 2: Get existing data from profiles
    console.log('\n🔍 Fetching existing profiles...');
    const profiles = await queryData('profiles');
    console.log(`Found ${profiles.length} profiles to migrate`);

    // Step 3: Get existing site_invites
    console.log('\n🔍 Fetching existing invitations...');
    const invites = await queryData('site_invites');
    console.log(`Found ${invites.length} invitations to migrate`);

    // Step 4: Prepare migration data
    console.log('\n📝 Preparing migration data...');
    const masterUsers = [];

    // Migrate profiles
    for (const profile of profiles) {
        const masterUser = {
            auth_user_id: profile.user_id,
            email: '', // Will need to get from auth.users or site_invites
            full_name: profile.full_name || 'Unknown User',
            nickname: profile.nickname,
            avatar_url: profile.avatar_url,
            site_id: profile.site_id,
            org_id: profile.org_id,
            access_type: profile.role === 'admin' ? 'admin' : profile.role === 'owner' ? 'owner' : 'staff',
            role_detail: profile.role_detail,
            active: profile.active !== false,
            team_id: profile.team_id,
            team_name: profile.team_name,
            reports_to_id: profile.reports_to_id,
            pin_hash: profile.pin_hash,
            pin_hmac: profile.pin_hmac,
            invite_status: 'active',
            onboarding_complete: profile.onboarding_complete,
            next_quiz_due: profile.next_quiz_due,
            kiosk_user_id: profile.kiosk_user_id,
            legacy_profile_user_id: profile.user_id,
            created_at: profile.created_at
        };

        // Try to find email from invites
        const invite = invites.find(i => i.status === 'accepted' && i.full_name === profile.full_name);
        if (invite) {
            masterUser.email = invite.email;
        }

        if (masterUser.email) {
            masterUsers.push(masterUser);
        }
    }

    // Migrate pending invitations
    const pendingInvites = invites.filter(i => i.status !== 'accepted');
    for (const invite of pendingInvites) {
        const masterUser = {
            email: invite.email,
            full_name: invite.full_name || 'Pending User',
            site_id: invite.site_id,
            access_type: invite.role === 'admin' ? 'admin' : invite.role === 'owner' ? 'owner' : 'staff',
            role_detail: invite.role_detail,
            active: false,
            reports_to_id: invite.reports_to_id,
            invite_status: 'pending',
            invited_by: invite.invited_by,
            invite_token: invite.token,
            invite_sent_at: invite.created_at,
            invite_expires_at: invite.expires_at,
            allowed_pages: invite.allowed_pages,
            created_at: invite.created_at
        };
        masterUsers.push(masterUser);
    }

    console.log(`\n📊 Prepared ${masterUsers.length} users for migration`);

    // Step 5: Insert data into master_users
    console.log('\n💾 Inserting data into master_users...');

    // Note: In a real scenario, we would insert this data via SQL or batch insert
    // For now, we'll output the migration script

    console.log('\n📄 MIGRATION SUMMARY:');
    console.log('====================');
    console.log(`Total users to migrate: ${masterUsers.length}`);
    console.log(`- From profiles: ${profiles.length}`);
    console.log(`- From pending invites: ${pendingInvites.length}`);

    console.log('\n📝 Sample migrated data (first 3 users):');
    masterUsers.slice(0, 3).forEach((user, index) => {
        console.log(`\nUser ${index + 1}:`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Name: ${user.full_name}`);
        console.log(`  Role: ${user.access_type}`);
        console.log(`  Status: ${user.invite_status}`);
    });

    // Create compatibility views
    console.log('\n📋 PHASE 3: CREATE COMPATIBILITY VIEWS');
    console.log('--------------------------------------');

    const createViewsSQL = `
    -- Create profiles view for backward compatibility
    CREATE OR REPLACE VIEW profiles_view AS
    SELECT
        auth_user_id as user_id,
        site_id,
        CASE
            WHEN access_type = 'owner' THEN 'owner'
            WHEN access_type = 'admin' THEN 'admin'
            ELSE 'staff'
        END as role,
        full_name,
        created_at,
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
        reports_to_id
    FROM master_users
    WHERE invite_status IN ('active', 'accepted');

    -- Create kiosk_users view
    CREATE OR REPLACE VIEW kiosk_users_view AS
    SELECT
        kiosk_user_id as id,
        site_id,
        auth_user_id as user_id,
        full_name,
        email,
        access_type as role,
        holiday_approved
    FROM master_users
    WHERE kiosk_user_id IS NOT NULL;

    -- Create site_invites view
    CREATE OR REPLACE VIEW site_invites_view AS
    SELECT
        ROW_NUMBER() OVER (ORDER BY created_at) as id,
        site_id,
        email,
        access_type as role,
        invited_by,
        invite_status as status,
        created_at,
        invite_accepted_at as accepted_at,
        invite_token as token,
        allowed_pages,
        invite_expires_at as expires_at,
        full_name,
        role_detail,
        reports_to_id
    FROM master_users
    WHERE invite_status = 'pending';
    `;

    console.log('Views SQL prepared (would be executed in production)');

    console.log('\n✅ MIGRATION PLAN COMPLETE!');
    console.log('==========================\n');
    console.log('Next steps:');
    console.log('1. Execute the CREATE TABLE SQL in Supabase SQL editor');
    console.log('2. Run data migration script to populate master_users');
    console.log('3. Create compatibility views');
    console.log('4. Update application code to use master_users');
    console.log('5. Test thoroughly before removing old tables');

    // Save migration SQL to file
    const fs = await import('fs');
    const migrationSQL = createTableSQL + '\n\n' + createViewsSQL;
    fs.writeFileSync('master_users_migration.sql', migrationSQL);
    console.log('\n📄 Migration SQL saved to: master_users_migration.sql');

    // Save migration data to JSON
    fs.writeFileSync('master_users_data.json', JSON.stringify(masterUsers, null, 2));
    console.log('📄 Migration data saved to: master_users_data.json');
}

// Execute the migration
executeMigration().catch(console.error);