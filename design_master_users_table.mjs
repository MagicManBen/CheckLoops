import fetch from 'node-fetch';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnViaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

async function designMasterUsersTable() {
    console.log('📐 DESIGNING MASTER_USERS TABLE SCHEMA');
    console.log('=====================================\n');

    console.log('📊 Based on analysis, here are the current user-related tables and their purposes:');
    console.log('-----------------------------------------------------------------------------------');

    const tableAnalysis = {
        'profiles': {
            purpose: 'Main user profile data',
            key_columns: [
                'user_id (UUID) - Links to auth.users',
                'site_id (int) - Organization site',
                'role (text) - Admin/Staff/Owner',
                'full_name (text)',
                'nickname (text)',
                'avatar_url (text)',
                'team_id (int)',
                'team_name (text)',
                'role_detail (text) - Job title',
                'reports_to_id (UUID)',
                'active (boolean)',
                'kiosk_user_id (int) - Links to kiosk_users',
                'pin_hash (text)',
                'pin_hmac (text)',
                'onboarding_complete (boolean)',
                'next_quiz_due (timestamp)',
                'created_at (timestamp)'
            ]
        },
        'kiosk_users': {
            purpose: 'Legacy kiosk user data (seems empty now)',
            key_columns: [
                'id (int) - Primary key',
                'site_id (int)',
                'user_id (UUID)',
                'full_name (text)',
                'email (text)',
                'role (text)',
                'holiday_approved (boolean)'
            ]
        },
        'site_invites': {
            purpose: 'User invitations pending acceptance',
            key_columns: [
                'id (int) - Primary key',
                'site_id (int)',
                'email (text)',
                'role (text)',
                'invited_by (UUID)',
                'status (text) - pending/accepted',
                'token (text)',
                'full_name (text)',
                'role_detail (text)',
                'reports_to_id (UUID)',
                'allowed_pages (json)',
                'created_at (timestamp)',
                'accepted_at (timestamp)',
                'expires_at (timestamp)'
            ]
        }
    };

    console.log('\n🎯 PROPOSED MASTER_USERS TABLE SCHEMA:');
    console.log('======================================\n');

    const masterUsersSchema = `
CREATE TABLE IF NOT EXISTS master_users (
    -- Primary identification
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Basic information
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    nickname TEXT,
    avatar_url TEXT,

    -- Organization & Access
    site_id INT NOT NULL,
    org_id INT,
    access_type TEXT DEFAULT 'staff' CHECK (access_type IN ('owner', 'admin', 'staff')),
    role_detail TEXT, -- Job title/position
    active BOOLEAN DEFAULT true,

    -- Team & Hierarchy
    team_id INT REFERENCES teams(id),
    team_name TEXT,
    reports_to_id UUID REFERENCES master_users(id),

    -- Authentication & Security
    pin_hash TEXT,
    pin_hmac TEXT,
    last_login TIMESTAMP WITH TIME ZONE,

    -- Invitation tracking
    invite_status TEXT DEFAULT 'active' CHECK (invite_status IN ('pending', 'accepted', 'active', 'expired')),
    invited_by UUID REFERENCES master_users(id),
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
    working_hours JSONB, -- Store schedule as JSON
    contract_hours DECIMAL(5,2),

    -- Onboarding & Training
    onboarding_complete BOOLEAN DEFAULT false,
    next_quiz_due TIMESTAMP WITH TIME ZONE,
    training_completed JSONB, -- Array of completed training IDs

    -- Legacy support
    kiosk_user_id INT, -- Keep for backward compatibility during migration

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Indexes for performance
    CONSTRAINT unique_email_site UNIQUE(email, site_id)
);

-- Create indexes for common queries
CREATE INDEX idx_master_users_site_id ON master_users(site_id);
CREATE INDEX idx_master_users_email ON master_users(email);
CREATE INDEX idx_master_users_auth_user_id ON master_users(auth_user_id);
CREATE INDEX idx_master_users_team_id ON master_users(team_id);
CREATE INDEX idx_master_users_active ON master_users(active);
CREATE INDEX idx_master_users_access_type ON master_users(access_type);
CREATE INDEX idx_master_users_invite_status ON master_users(invite_status);

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER master_users_updated_at
    BEFORE UPDATE ON master_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
`;

    console.log(masterUsersSchema);

    console.log('\n🔄 MIGRATION STRATEGY:');
    console.log('=====================\n');

    console.log('Phase 1: Create master_users table and migrate existing data');
    console.log('-------------------------------------------------------------');
    console.log('1. Create master_users table with above schema');
    console.log('2. Migrate data from profiles table (primary source)');
    console.log('3. Merge any additional data from kiosk_users table');
    console.log('4. Import pending invites from site_invites table');
    console.log('');

    console.log('Phase 2: Create database views for backward compatibility');
    console.log('---------------------------------------------------------');
    console.log('CREATE VIEW profiles AS SELECT ... FROM master_users;');
    console.log('CREATE VIEW kiosk_users AS SELECT ... FROM master_users;');
    console.log('CREATE VIEW site_invites AS SELECT ... FROM master_users WHERE invite_status = \'pending\';');
    console.log('');

    console.log('Phase 3: Update application code');
    console.log('--------------------------------');
    console.log('1. Update all queries to use master_users table');
    console.log('2. Update user creation flow to insert into master_users');
    console.log('3. Update invitation flow to use master_users');
    console.log('4. Test all functionality thoroughly');
    console.log('');

    console.log('Phase 4: Cleanup (after verification)');
    console.log('-------------------------------------');
    console.log('1. Drop the views');
    console.log('2. Rename old tables to _backup suffix');
    console.log('3. Monitor for any issues');
    console.log('');

    console.log('\n📋 KEY BENEFITS OF MASTER_USERS TABLE:');
    console.log('======================================');
    console.log('✅ Single source of truth for all user data');
    console.log('✅ Eliminates data inconsistency between tables');
    console.log('✅ Simplifies user management and queries');
    console.log('✅ Better performance with proper indexing');
    console.log('✅ Easier to maintain and extend');
    console.log('✅ Clearer data relationships');
    console.log('✅ Reduced complexity in application code');
    console.log('');

    console.log('\n⚠️  CRITICAL CONSIDERATIONS:');
    console.log('============================');
    console.log('1. RLS (Row Level Security) policies need to be recreated for master_users');
    console.log('2. All foreign key relationships need to be updated');
    console.log('3. Application code must be thoroughly tested');
    console.log('4. Backup all data before migration');
    console.log('5. Consider running both schemas in parallel initially');
    console.log('');

    return masterUsersSchema;
}

// Run the design
designMasterUsersTable()
    .then(() => console.log('\n✅ Design complete!'))
    .catch(console.error);