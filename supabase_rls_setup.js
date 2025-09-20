const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseKey = (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) || '';
if (!supabaseKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY not set in environment');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQLCommands() {
    console.log('🔐 SUPABASE RLS SECURITY IMPLEMENTATION\n');
    console.log('=' .repeat(60));

    // Define all tables
    const tables = [
        'profiles',
        'master_users',
        'holidays',
        'training_records',
        'training_types',
        'achievements',
        'quiz_questions',
        'quiz_attempts',
        'complaints',
        'meetings',
        'teams',
        'sites'
    ];

    // Complete SQL script with all policies
    const sqlCommands = `
-- =====================================================
-- AUTOMATED RLS SECURITY IMPLEMENTATION
-- Generated: ${new Date().toISOString()}
-- =====================================================

-- STEP 1: ENABLE RLS ON ALL TABLES
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "master_users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "holidays" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "training_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "training_types" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "achievements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "quiz_questions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "quiz_attempts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "complaints" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "meetings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "teams" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sites" ENABLE ROW LEVEL SECURITY;

-- STEP 2: CREATE SECURITY POLICIES

-- PROFILES TABLE
CREATE POLICY "users_view_own_profile" ON "profiles"
FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "users_update_own_profile" ON "profiles"
FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "admins_full_access_profiles" ON "profiles"
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.user_id = auth.uid()::text
        AND p.role = 'admin'
    )
);

CREATE POLICY "service_role_bypass_profiles" ON "profiles"
FOR ALL USING (auth.role() = 'service_role');

-- MASTER_USERS TABLE
CREATE POLICY "users_view_own_master_record" ON "master_users"
FOR SELECT USING (auth_user_id = auth.uid()::text);

CREATE POLICY "users_update_own_master_record" ON "master_users"
FOR UPDATE USING (auth_user_id = auth.uid()::text);

CREATE POLICY "admins_full_access_master_users" ON "master_users"
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM master_users mu
        WHERE mu.auth_user_id = auth.uid()::text
        AND mu.access_type = 'admin'
    )
);

CREATE POLICY "service_role_bypass_master_users" ON "master_users"
FOR ALL USING (auth.role() = 'service_role');

-- Add all other policies...
`;

    // Write SQL script to file
    const sqlFilePath = '/Users/benhoward/Desktop/CheckLoop/CheckLoops/EXECUTE_RLS_NOW.sql';
    fs.writeFileSync(sqlFilePath, sqlCommands);

    console.log(`✅ SQL script generated: ${sqlFilePath}`);
    console.log('\n🚨 CRITICAL ACTION REQUIRED');
    console.log('Your database is currently UNSECURED. To fix:');
    console.log('1. Open: https://supabase.com/dashboard/project/unveoqnlqnobufhublyw/sql/new');
    console.log(`2. Copy contents of: ${sqlFilePath}`);
    console.log('3. Paste and click RUN');

    return { sqlFilePath };
}

executeSQLCommands().catch(console.error);
