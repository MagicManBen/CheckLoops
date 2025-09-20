import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseServiceKey = (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) || '';
if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY not set in environment');
}

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAvailableFunctions() {
    console.log('🔍 Checking available Supabase RPC functions...\n');

    // Test common RPC functions
    const functionsToTest = [
        'exec_sql',
        'get_schema_tables',
        'get_table_policies',
        'get_rls_status'
    ];

    for (const funcName of functionsToTest) {
        try {
            console.log(`Testing function: ${funcName}`);

            let testQuery;
            switch (funcName) {
                case 'exec_sql':
                    testQuery = { query: 'SELECT 1 as test;' };
                    break;
                case 'get_schema_tables':
                    testQuery = { schema_name: 'public' };
                    break;
                default:
                    testQuery = {};
            }

            const { data, error } = await supabase.rpc(funcName, testQuery);

            if (error) {
                console.log(`  ❌ ${funcName}: ${error.message}`);
            } else {
                console.log(`  ✅ ${funcName}: Available`);
                if (data) {
                    console.log(`     Sample response: ${JSON.stringify(data).substring(0, 100)}...`);
                }
            }
        } catch (e) {
            console.log(`  ❌ ${funcName}: Exception - ${e.message}`);
        }
    }

    // Test basic table access
    console.log('\n🗃️  Testing basic table access...');
    const tables = ['profiles', 'master_users', 'sites'];

    for (const table of tables) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(1);

            if (error) {
                console.log(`  ❌ ${table}: ${error.message}`);
            } else {
                console.log(`  ✅ ${table}: Accessible (${data.length} records)`);
            }
        } catch (e) {
            console.log(`  ❌ ${table}: Exception - ${e.message}`);
        }
    }

    // Test SQL execution capability
    console.log('\n🔧 Testing SQL execution capability...');
    try {
        const testSql = 'SELECT current_user, session_user, current_database();';
        const { data, error } = await supabase.rpc('exec_sql', { query: testSql });

        if (error) {
            console.log(`  ❌ SQL execution failed: ${error.message}`);
        } else {
            console.log(`  ✅ SQL execution works:`);
            console.log(`     Current user: ${data[0]?.current_user}`);
            console.log(`     Session user: ${data[0]?.session_user}`);
            console.log(`     Database: ${data[0]?.current_database}`);
        }
    } catch (e) {
        console.log(`  ❌ SQL execution exception: ${e.message}`);
    }
}

// Run the check
checkAvailableFunctions().catch(console.error);