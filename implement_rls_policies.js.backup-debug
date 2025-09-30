import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseServiceKey = (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) || '';
if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY not set in environment');
}

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// SQL commands to enable RLS and create policies
const rlsPolicies = {
    // Enable RLS on all tables
    enableRLS: [
        'ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;',
        'ALTER TABLE "master_users" ENABLE ROW LEVEL SECURITY;',
        'ALTER TABLE "holidays" ENABLE ROW LEVEL SECURITY;',
        'ALTER TABLE "training_records" ENABLE ROW LEVEL SECURITY;',
        'ALTER TABLE "training_types" ENABLE ROW LEVEL SECURITY;',
        'ALTER TABLE "achievements" ENABLE ROW LEVEL SECURITY;',
        'ALTER TABLE "quiz_questions" ENABLE ROW LEVEL SECURITY;',
        'ALTER TABLE "quiz_attempts" ENABLE ROW LEVEL SECURITY;',
        'ALTER TABLE "complaints" ENABLE ROW LEVEL SECURITY;',
        'ALTER TABLE "meetings" ENABLE ROW LEVEL SECURITY;',
        'ALTER TABLE "teams" ENABLE ROW LEVEL SECURITY;',
        'ALTER TABLE "sites" ENABLE ROW LEVEL SECURITY;'
    ],

    // User profile policies - users can only access their own profile
    profiles: [
        `CREATE POLICY "Users can view own profile" ON "profiles"
         FOR SELECT USING (auth.uid()::text = user_id);`,

        `CREATE POLICY "Users can update own profile" ON "profiles"
         FOR UPDATE USING (auth.uid()::text = user_id);`,

        `CREATE POLICY "Admins can view all profiles" ON "profiles"
         FOR SELECT USING (
           EXISTS (
             SELECT 1 FROM profiles
             WHERE user_id = auth.uid()::text
             AND role = 'admin'
           )
         );`,

        `CREATE POLICY "Service role bypass" ON "profiles"
         FOR ALL USING (auth.role() = 'service_role');`
    ],

    // Master users policies - similar to profiles but with more granular control
    master_users: [
        `CREATE POLICY "Users can view own user record" ON "master_users"
         FOR SELECT USING (auth_user_id = auth.uid()::text);`,

        `CREATE POLICY "Users can update own user record" ON "master_users"
         FOR UPDATE USING (auth_user_id = auth.uid()::text);`,

        `CREATE POLICY "Admins can view all user records" ON "master_users"
         FOR SELECT USING (
           EXISTS (
             SELECT 1 FROM master_users
             WHERE auth_user_id = auth.uid()::text
             AND access_type = 'admin'
           )
         );`,

        `CREATE POLICY "Admins can update user records" ON "master_users"
         FOR UPDATE USING (
           EXISTS (
             SELECT 1 FROM master_users
             WHERE auth_user_id = auth.uid()::text
             AND access_type = 'admin'
           )
         );`,

        `CREATE POLICY "Service role bypass" ON "master_users"
         FOR ALL USING (auth.role() = 'service_role');`
    ],

    // Holiday policies - users can view/manage their own holidays, admins can see all
    holidays: [
        `CREATE POLICY "Users can view own holidays" ON "holidays"
         FOR SELECT USING (
           user_id = auth.uid()::text OR
           EXISTS (
             SELECT 1 FROM master_users
             WHERE auth_user_id = auth.uid()::text
             AND id::text = holidays.user_id
           )
         );`,

        `CREATE POLICY "Users can create own holidays" ON "holidays"
         FOR INSERT WITH CHECK (
           user_id = auth.uid()::text OR
           EXISTS (
             SELECT 1 FROM master_users
             WHERE auth_user_id = auth.uid()::text
             AND id::text = user_id
           )
         );`,

        `CREATE POLICY "Users can update own holidays" ON "holidays"
         FOR UPDATE USING (
           user_id = auth.uid()::text OR
           EXISTS (
             SELECT 1 FROM master_users
             WHERE auth_user_id = auth.uid()::text
             AND id::text = holidays.user_id
           )
         );`,

        `CREATE POLICY "Admins can manage all holidays" ON "holidays"
         FOR ALL USING (
           EXISTS (
             SELECT 1 FROM master_users
             WHERE auth_user_id = auth.uid()::text
             AND access_type = 'admin'
           )
         );`,

        `CREATE POLICY "Service role bypass" ON "holidays"
         FOR ALL USING (auth.role() = 'service_role');`
    ],

    // Training records - users can view their own, admins can see all
    training_records: [
        `CREATE POLICY "Users can view own training records" ON "training_records"
         FOR SELECT USING (
           user_id = auth.uid()::text OR
           EXISTS (
             SELECT 1 FROM master_users
             WHERE auth_user_id = auth.uid()::text
             AND (id::text = training_records.user_id OR access_type = 'admin')
           )
         );`,

        `CREATE POLICY "Admins can manage all training records" ON "training_records"
         FOR ALL USING (
           EXISTS (
             SELECT 1 FROM master_users
             WHERE auth_user_id = auth.uid()::text
             AND access_type = 'admin'
           )
         );`,

        `CREATE POLICY "Service role bypass" ON "training_records"
         FOR ALL USING (auth.role() = 'service_role');`
    ],

    // Training types - read-only for all authenticated users, admins can modify
    training_types: [
        `CREATE POLICY "All users can view training types" ON "training_types"
         FOR SELECT USING (auth.role() = 'authenticated');`,

        `CREATE POLICY "Admins can manage training types" ON "training_types"
         FOR ALL USING (
           EXISTS (
             SELECT 1 FROM master_users
             WHERE auth_user_id = auth.uid()::text
             AND access_type = 'admin'
           )
         );`,

        `CREATE POLICY "Service role bypass" ON "training_types"
         FOR ALL USING (auth.role() = 'service_role');`
    ],

    // Achievements - users can view their own, admins can see all
    achievements: [
        `CREATE POLICY "Users can view own achievements" ON "achievements"
         FOR SELECT USING (
           user_id = auth.uid()::text OR
           EXISTS (
             SELECT 1 FROM master_users
             WHERE auth_user_id = auth.uid()::text
             AND (id::text = achievements.user_id OR access_type = 'admin')
           )
         );`,

        `CREATE POLICY "Admins can manage all achievements" ON "achievements"
         FOR ALL USING (
           EXISTS (
             SELECT 1 FROM master_users
             WHERE auth_user_id = auth.uid()::text
             AND access_type = 'admin'
           )
         );`,

        `CREATE POLICY "Service role bypass" ON "achievements"
         FOR ALL USING (auth.role() = 'service_role');`
    ],

    // Quiz questions - read-only for all authenticated users, admins can modify
    quiz_questions: [
        `CREATE POLICY "All users can view quiz questions" ON "quiz_questions"
         FOR SELECT USING (auth.role() = 'authenticated');`,

        `CREATE POLICY "Admins can manage quiz questions" ON "quiz_questions"
         FOR ALL USING (
           EXISTS (
             SELECT 1 FROM master_users
             WHERE auth_user_id = auth.uid()::text
             AND access_type = 'admin'
           )
         );`,

        `CREATE POLICY "Service role bypass" ON "quiz_questions"
         FOR ALL USING (auth.role() = 'service_role');`
    ],

    // Quiz attempts - users can view/create their own, admins can see all
    quiz_attempts: [
        `CREATE POLICY "Users can view own quiz attempts" ON "quiz_attempts"
         FOR SELECT USING (
           user_id = auth.uid()::text OR
           EXISTS (
             SELECT 1 FROM master_users
             WHERE auth_user_id = auth.uid()::text
             AND (id::text = quiz_attempts.user_id OR access_type = 'admin')
           )
         );`,

        `CREATE POLICY "Users can create own quiz attempts" ON "quiz_attempts"
         FOR INSERT WITH CHECK (
           user_id = auth.uid()::text OR
           EXISTS (
             SELECT 1 FROM master_users
             WHERE auth_user_id = auth.uid()::text
             AND id::text = user_id
           )
         );`,

        `CREATE POLICY "Admins can manage all quiz attempts" ON "quiz_attempts"
         FOR ALL USING (
           EXISTS (
             SELECT 1 FROM master_users
             WHERE auth_user_id = auth.uid()::text
             AND access_type = 'admin'
           )
         );`,

        `CREATE POLICY "Service role bypass" ON "quiz_attempts"
         FOR ALL USING (auth.role() = 'service_role');`
    ],

    // Complaints - users can view/create their own, admins can see all
    complaints: [
        `CREATE POLICY "Users can view own complaints" ON "complaints"
         FOR SELECT USING (
           created_by = auth.uid()::text OR
           EXISTS (
             SELECT 1 FROM master_users
             WHERE auth_user_id = auth.uid()::text
             AND (id::text = complaints.created_by OR access_type = 'admin')
           )
         );`,

        `CREATE POLICY "Users can create complaints" ON "complaints"
         FOR INSERT WITH CHECK (
           created_by = auth.uid()::text OR
           EXISTS (
             SELECT 1 FROM master_users
             WHERE auth_user_id = auth.uid()::text
             AND id::text = created_by
           )
         );`,

        `CREATE POLICY "Admins can manage all complaints" ON "complaints"
         FOR ALL USING (
           EXISTS (
             SELECT 1 FROM master_users
             WHERE auth_user_id = auth.uid()::text
             AND access_type = 'admin'
           )
         );`,

        `CREATE POLICY "Service role bypass" ON "complaints"
         FOR ALL USING (auth.role() = 'service_role');`
    ],

    // Meetings - users can view meetings for their site, admins can see all
    meetings: [
        `CREATE POLICY "Users can view site meetings" ON "meetings"
         FOR SELECT USING (
           EXISTS (
             SELECT 1 FROM master_users
             WHERE auth_user_id = auth.uid()::text
             AND (site_id = meetings.site_id OR access_type = 'admin')
           )
         );`,

        `CREATE POLICY "Admins can manage all meetings" ON "meetings"
         FOR ALL USING (
           EXISTS (
             SELECT 1 FROM master_users
             WHERE auth_user_id = auth.uid()::text
             AND access_type = 'admin'
           )
         );`,

        `CREATE POLICY "Service role bypass" ON "meetings"
         FOR ALL USING (auth.role() = 'service_role');`
    ],

    // Teams - read-only for all authenticated users, admins can modify
    teams: [
        `CREATE POLICY "All users can view teams" ON "teams"
         FOR SELECT USING (auth.role() = 'authenticated');`,

        `CREATE POLICY "Admins can manage teams" ON "teams"
         FOR ALL USING (
           EXISTS (
             SELECT 1 FROM master_users
             WHERE auth_user_id = auth.uid()::text
             AND access_type = 'admin'
           )
         );`,

        `CREATE POLICY "Service role bypass" ON "teams"
         FOR ALL USING (auth.role() = 'service_role');`
    ],

    // Sites - read-only for all authenticated users, admins can modify
    sites: [
        `CREATE POLICY "All users can view sites" ON "sites"
         FOR SELECT USING (auth.role() = 'authenticated');`,

        `CREATE POLICY "Admins can manage sites" ON "sites"
         FOR ALL USING (
           EXISTS (
             SELECT 1 FROM master_users
             WHERE auth_user_id = auth.uid()::text
             AND access_type = 'admin'
           )
         );`,

        `CREATE POLICY "Service role bypass" ON "sites"
         FOR ALL USING (auth.role() = 'service_role');`
    ]
};

async function executeSQLCommand(sql, description) {
    try {
        console.log(`🔧 ${description}`);
        console.log(`   SQL: ${sql.substring(0, 80)}...`);

        const { data, error } = await supabase.rpc('exec_sql', { query: sql });

        if (error) {
            console.error(`   ❌ Error: ${error.message}`);
            return false;
        } else {
            console.log(`   ✅ Success`);
            return true;
        }
    } catch (e) {
        console.error(`   ❌ Exception: ${e.message}`);
        return false;
    }
}

async function implementRLSPolicies(dryRun = true) {
    console.log('🔒 Starting RLS Policy Implementation');
    console.log(`🔍 Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE (changes will be applied)'}\n`);

    const results = {
        rls_enabled: 0,
        policies_created: 0,
        errors: []
    };

    if (dryRun) {
        console.log('📋 DRY RUN - Here are the commands that would be executed:\n');

        console.log('1. ENABLE ROW LEVEL SECURITY:');
        rlsPolicies.enableRLS.forEach(sql => {
            console.log(`   ${sql}`);
        });

        console.log('\n2. CREATE POLICIES:');
        Object.entries(rlsPolicies).forEach(([tableName, policies]) => {
            if (tableName === 'enableRLS') return;

            console.log(`\n   ${tableName.toUpperCase()}:`);
            policies.forEach(policy => {
                console.log(`   ${policy}`);
            });
        });

        console.log('\n📝 To execute these changes, run with dryRun = false');
        return results;
    }

    // Step 1: Enable RLS on all tables
    console.log('1. 🔐 Enabling Row Level Security on all tables...\n');
    for (const sql of rlsPolicies.enableRLS) {
        const success = await executeSQLCommand(sql, 'Enabling RLS');
        if (success) {
            results.rls_enabled++;
        } else {
            results.errors.push(`Failed to enable RLS: ${sql}`);
        }
    }

    // Step 2: Create policies for each table
    console.log('\n2. 📝 Creating security policies...\n');
    for (const [tableName, policies] of Object.entries(rlsPolicies)) {
        if (tableName === 'enableRLS') continue;

        console.log(`\n📋 Creating policies for ${tableName}:`);
        for (const policy of policies) {
            const success = await executeSQLCommand(policy, `Creating policy for ${tableName}`);
            if (success) {
                results.policies_created++;
            } else {
                results.errors.push(`Failed to create policy for ${tableName}: ${policy}`);
            }
        }
    }

    // Summary
    console.log('\n📊 IMPLEMENTATION SUMMARY:');
    console.log(`   RLS enabled on ${results.rls_enabled} tables`);
    console.log(`   ${results.policies_created} policies created`);
    console.log(`   ${results.errors.length} errors encountered`);

    if (results.errors.length > 0) {
        console.log('\n❌ ERRORS:');
        results.errors.forEach(error => {
            console.log(`   - ${error}`);
        });
    }

    return results;
}

// Test function to verify policies work
async function testPolicies() {
    console.log('🧪 Testing RLS policies...\n');

    const tests = [
        {
            name: 'Anonymous access should be blocked',
            test: async () => {
                const anonClient = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.uSUfMFX2q3Q-O4WPeCZJ5DgFJCTlNm2XUQPVQzPdz8M');
                const { data, error } = await anonClient.from('profiles').select('*').limit(1);
                return error !== null; // Should have error
            }
        },
        {
            name: 'Service role should have full access',
            test: async () => {
                const { data, error } = await supabase.from('profiles').select('*').limit(1);
                return error === null; // Should work
            }
        }
    ];

    for (const test of tests) {
        try {
            const result = await test.test();
            console.log(`${result ? '✅' : '❌'} ${test.name}`);
        } catch (e) {
            console.log(`❌ ${test.name} - Exception: ${e.message}`);
        }
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    const dryRun = !args.includes('--apply');
    const testOnly = args.includes('--test');

    if (testOnly) {
        await testPolicies();
        return;
    }

    await implementRLSPolicies(dryRun);

    if (!dryRun) {
        console.log('\n🧪 Running post-implementation tests...');
        await testPolicies();
    }
}

// Export for use in other files
export { implementRLSPolicies, testPolicies };

// Run if called directly
main().catch(console.error);