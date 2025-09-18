import fetch from 'node-fetch';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

async function runSQLQuery(sql) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'apikey': SERVICE_KEY
        },
        body: JSON.stringify({ sql })
    });

    if (response.ok) {
        const result = await response.json();
        return result;
    } else {
        const error = await response.text();
        console.log('SQL Error:', error);
        return null;
    }
}

async function debugRLSIssue() {
    console.log('🔍 DEBUGGING MASTER_USERS RLS ISSUE');
    console.log('=====================================\n');

    // Check if master_users table exists
    console.log('1. Checking if master_users table exists...');
    try {
        const tableCheck = await fetch(`${SUPABASE_URL}/rest/v1/master_users?limit=1`, {
            headers: {
                'Authorization': `Bearer ${SERVICE_KEY}`,
                'apikey': SERVICE_KEY
            }
        });
        
        if (tableCheck.ok) {
            console.log('✅ master_users table exists');
            const data = await tableCheck.json();
            console.log(`   Found ${data.length} records (limited to 1)`);
        } else {
            console.log('❌ master_users table does not exist or is not accessible');
            console.log('   Error:', await tableCheck.text());
        }
    } catch (error) {
        console.log('❌ Error checking master_users table:', error.message);
    }

    console.log('\n2. Checking master_users table structure...');
    try {
        const structure = await runSQLQuery(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'master_users' 
            AND table_schema = 'public'
            ORDER BY ordinal_position;
        `);
        
        if (structure && structure.length > 0) {
            console.log('✅ master_users table structure:');
            structure.forEach(col => {
                console.log(`   ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
            });
        } else {
            console.log('❌ Could not retrieve table structure');
        }
    } catch (error) {
        console.log('❌ Error getting table structure:', error.message);
    }

    console.log('\n3. Checking RLS policies on master_users...');
    try {
        const policies = await runSQLQuery(`
            SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
            FROM pg_policies 
            WHERE schemaname = 'public' AND tablename = 'master_users';
        `);
        
        if (policies && policies.length > 0) {
            console.log('✅ Found RLS policies:');
            policies.forEach(policy => {
                console.log(`\nPolicy: ${policy.policyname}`);
                console.log(`  Command: ${policy.cmd}`);
                console.log(`  Roles: ${policy.roles}`);
                console.log(`  Condition: ${policy.qual || 'none'}`);
                console.log(`  With Check: ${policy.with_check || 'none'}`);
            });
        } else {
            console.log('ℹ️  No RLS policies found on master_users table');
        }
    } catch (error) {
        console.log('❌ Error checking RLS policies:', error.message);
    }

    console.log('\n4. Checking if RLS is enabled on master_users...');
    try {
        const rlsStatus = await runSQLQuery(`
            SELECT schemaname, tablename, rowsecurity, forcerowsecurity
            FROM pg_tables 
            WHERE schemaname = 'public' AND tablename = 'master_users';
        `);
        
        if (rlsStatus && rlsStatus.length > 0) {
            const status = rlsStatus[0];
            console.log('✅ RLS Status:');
            console.log(`   Row Security Enabled: ${status.rowsecurity}`);
            console.log(`   Force Row Security: ${status.forcerowsecurity}`);
        }
    } catch (error) {
        console.log('❌ Error checking RLS status:', error.message);
    }

    console.log('\n5. Checking triggers on master_users...');
    try {
        const triggers = await runSQLQuery(`
            SELECT trigger_name, event_manipulation, action_statement, action_timing
            FROM information_schema.triggers 
            WHERE event_object_table = 'master_users'
            AND event_object_schema = 'public';
        `);
        
        if (triggers && triggers.length > 0) {
            console.log('✅ Found triggers:');
            triggers.forEach(trigger => {
                console.log(`\nTrigger: ${trigger.trigger_name}`);
                console.log(`  Event: ${trigger.event_manipulation}`);
                console.log(`  Timing: ${trigger.action_timing}`);
                console.log(`  Action: ${trigger.action_statement}`);
            });
        } else {
            console.log('ℹ️  No triggers found on master_users table');
        }
    } catch (error) {
        console.log('❌ Error checking triggers:', error.message);
    }

    console.log('\n6. Checking auth triggers that might affect master_users...');
    try {
        const authTriggers = await runSQLQuery(`
            SELECT trigger_name, event_object_table, event_manipulation, action_statement
            FROM information_schema.triggers 
            WHERE event_object_schema = 'auth'
            OR action_statement ILIKE '%master_users%';
        `);
        
        if (authTriggers && authTriggers.length > 0) {
            console.log('✅ Found auth-related triggers:');
            authTriggers.forEach(trigger => {
                console.log(`\nTrigger: ${trigger.trigger_name} on ${trigger.event_object_table}`);
                console.log(`  Event: ${trigger.event_manipulation}`);
                console.log(`  Action: ${trigger.action_statement}`);
            });
        } else {
            console.log('ℹ️  No auth triggers found that reference master_users');
        }
    } catch (error) {
        console.log('❌ Error checking auth triggers:', error.message);
    }

    console.log('\n7. Testing a simple insert into master_users...');
    try {
        const testEmail = 'test-' + Date.now() + '@example.com';
        const insertTest = await fetch(`${SUPABASE_URL}/rest/v1/master_users`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SERVICE_KEY}`,
                'Content-Type': 'application/json',
                'apikey': SERVICE_KEY,
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                email: testEmail,
                full_name: 'Test User',
                site_id: 2,
                access_type: 'staff'
            })
        });

        if (insertTest.ok) {
            console.log('✅ Test insert successful');
            // Clean up the test record
            await fetch(`${SUPABASE_URL}/rest/v1/master_users?email=eq.${testEmail}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${SERVICE_KEY}`,
                    'apikey': SERVICE_KEY
                }
            });
        } else {
            console.log('❌ Test insert failed:', await insertTest.text());
        }
    } catch (error) {
        console.log('❌ Error testing insert:', error.message);
    }

    console.log('\n8. Checking current user permissions...');
    try {
        const userInfo = await runSQLQuery(`
            SELECT current_user, current_setting('role'), session_user;
        `);
        
        if (userInfo && userInfo.length > 0) {
            console.log('✅ Current user info:', userInfo[0]);
        }
    } catch (error) {
        console.log('❌ Error checking user permissions:', error.message);
    }

    console.log('\n🏁 DEBUGGING COMPLETE');
}

debugRLSIssue().catch(console.error);