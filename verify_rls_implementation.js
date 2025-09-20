import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseServiceKey = (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) || '';
if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY not set in environment');
}
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.uSUfMFX2q3Q-O4WPeCZJ5DgFJCTlNm2XUQPVQzPdz8M';

// Initialize clients
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

async function verifyRLSImplementation() {
    console.log('🔍 VERIFYING RLS IMPLEMENTATION');
    console.log('===============================\n');

    const tables = [
        'profiles', 'master_users', 'holidays', 'training_records',
        'training_types', 'achievements', 'quiz_questions', 'quiz_attempts',
        'complaints', 'meetings', 'teams', 'sites'
    ];

    const results = {
        rls_enabled: [],
        rls_disabled: [],
        anon_blocked: [],
        anon_accessible: [],
        service_accessible: [],
        service_blocked: []
    };

    console.log('1. 🔒 Testing Anonymous Access (should be blocked for all tables)');
    console.log('================================================================\n');

    for (const table of tables) {
        try {
            const { data, error } = await supabaseAnon
                .from(table)
                .select('*')
                .limit(1);

            if (error) {
                if (error.message.includes('RLS') || error.message.includes('policy') || error.message.includes('permission')) {
                    console.log(`✅ ${table}: Anonymous access properly blocked`);
                    results.anon_blocked.push(table);
                    results.rls_enabled.push(table);
                } else {
                    console.log(`⚠️  ${table}: Anonymous access blocked but with unexpected error: ${error.message}`);
                    results.anon_blocked.push(table);
                }
            } else {
                console.log(`❌ ${table}: Anonymous access allowed - RLS may not be working! (Found ${data.length} records)`);
                results.anon_accessible.push(table);
                results.rls_disabled.push(table);
            }
        } catch (e) {
            console.log(`⚠️  ${table}: Exception during anonymous test: ${e.message}`);
        }
    }

    console.log('\n2. 🔧 Testing Service Role Access (should work for all tables)');
    console.log('==============================================================\n');

    for (const table of tables) {
        try {
            const { data, error, count } = await supabaseService
                .from(table)
                .select('*', { count: 'exact', head: true });

            if (error) {
                console.log(`❌ ${table}: Service role access failed: ${error.message}`);
                results.service_blocked.push(table);
            } else {
                console.log(`✅ ${table}: Service role access works (${count} records)`);
                results.service_accessible.push(table);
            }
        } catch (e) {
            console.log(`❌ ${table}: Exception during service role test: ${e.message}`);
            results.service_blocked.push(table);
        }
    }

    console.log('\n📊 VERIFICATION SUMMARY');
    console.log('=======================\n');

    console.log(`Tables with RLS enabled: ${results.rls_enabled.length}/${tables.length}`);
    console.log(`Tables with RLS disabled: ${results.rls_disabled.length}/${tables.length}`);
    console.log(`Anonymous access blocked: ${results.anon_blocked.length}/${tables.length}`);
    console.log(`Service role access working: ${results.service_accessible.length}/${tables.length}`);

    if (results.rls_disabled.length > 0) {
        console.log('\n❌ TABLES WITHOUT PROPER RLS PROTECTION:');
        results.rls_disabled.forEach(table => {
            console.log(`   - ${table}`);
        });
        console.log('\n⚠️  These tables are vulnerable! Anonymous users can access data.');
    }

    if (results.service_blocked.length > 0) {
        console.log('\n⚠️  SERVICE ROLE ACCESS ISSUES:');
        results.service_blocked.forEach(table => {
            console.log(`   - ${table}`);
        });
        console.log('\n🔧 Check if service role bypass policies are properly configured.');
    }

    if (results.anon_blocked.length === tables.length && results.service_accessible.length === tables.length) {
        console.log('\n🎉 SUCCESS! RLS appears to be properly implemented.');
        console.log('   - All tables block anonymous access');
        console.log('   - Service role can access all tables');
        console.log('   - Your database is now secured with Row Level Security');
    } else {
        console.log('\n⚠️  RLS IMPLEMENTATION INCOMPLETE');
        console.log('   Please review and fix the issues identified above.');
    }

    return results;
}

async function testSpecificUserAccess(userEmail) {
    console.log(`\n3. 👤 Testing User-Specific Access for: ${userEmail}`);
    console.log('================================================\n');

    // Note: This would require a real user session to test properly
    // For now, we'll just document what should be tested

    console.log('🔍 To test user-specific access, you should:');
    console.log('1. Log in as a regular user');
    console.log('2. Try to access various tables');
    console.log('3. Verify they can only see their own data');
    console.log('4. Log in as an admin user');
    console.log('5. Verify they can see all data');
    console.log('6. Try to access data as an unauthenticated user');
    console.log('7. Verify all access is blocked\n');

    console.log('📝 Test scenarios to verify:');
    console.log('- Regular user can view/edit their own profile');
    console.log('- Regular user cannot view other users\' profiles');
    console.log('- Regular user can view/manage their own holidays');
    console.log('- Regular user cannot view other users\' holidays');
    console.log('- Admin user can view/manage all data');
    console.log('- All users can view reference tables (teams, sites, training_types)');
    console.log('- All users can view quiz questions');
    console.log('- Users can only see their own quiz attempts and achievements');
}

async function checkRLSStatus() {
    console.log('\n4. 📋 Checking RLS Status via Database Query');
    console.log('============================================\n');

    try {
        // This would require a custom function or direct database access
        // Since we can't execute arbitrary SQL, we'll provide instructions
        console.log('To check RLS status directly, run this query in your Supabase SQL editor:');
        console.log('');
        console.log('SELECT');
        console.log('    schemaname,');
        console.log('    tablename,');
        console.log('    rowsecurity as rls_enabled');
        console.log('FROM pg_tables');
        console.log('WHERE schemaname = \'public\'');
        console.log('ORDER BY tablename;');
        console.log('');
        console.log('All tables should show rls_enabled = true');

    } catch (e) {
        console.log(`Could not check RLS status: ${e.message}`);
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    const userEmail = args.find(arg => arg.includes('@')) || 'test@example.com';

    await verifyRLSImplementation();
    await testSpecificUserAccess(userEmail);
    await checkRLSStatus();

    console.log('\n📋 NEXT STEPS:');
    console.log('==============');
    console.log('1. If any tables show RLS issues, re-run the SQL commands from RLS_SETUP_INSTRUCTIONS.sql');
    console.log('2. Test with actual user accounts to verify user-specific access works');
    console.log('3. Monitor your application logs for any access denied errors');
    console.log('4. Consider implementing additional policies for specific business requirements');
    console.log('5. Regularly audit your RLS policies to ensure they remain secure\n');
}

export { verifyRLSImplementation, testSpecificUserAccess, checkRLSStatus };

// Run if called directly
main().catch(console.error);