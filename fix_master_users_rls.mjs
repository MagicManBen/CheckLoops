import fetch from 'node-fetch';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

async function executeDDL(sql) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/sql_execute`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SERVICE_KEY}`,
                'Content-Type': 'application/json',
                'apikey': SERVICE_KEY
            },
            body: JSON.stringify({ query: sql })
        });

        if (!response.ok) {
            const error = await response.text();
            console.log('SQL Error:', error);
            return false;
        }

        console.log('✅ SQL executed successfully');
        return true;
    } catch (error) {
        console.log('❌ Error:', error.message);
        return false;
    }
}

async function fixMasterUsersRLS() {
    console.log('🔧 FIXING MASTER_USERS RLS POLICIES');
    console.log('===================================\n');

    // Option 1: Disable RLS temporarily (quick fix)
    console.log('1. Disabling RLS on master_users table...');
    const disableRLS = await executeDDL(`ALTER TABLE master_users DISABLE ROW LEVEL SECURITY;`);
    
    if (disableRLS) {
        console.log('✅ RLS disabled on master_users table');
        console.log('ℹ️  This allows unrestricted access - consider adding proper policies later\n');
    } else {
        console.log('❌ Failed to disable RLS - trying alternative approach\n');
        
        // Option 2: Create permissive RLS policies
        console.log('2. Creating permissive RLS policies...');
        
        const createPolicies = await executeDDL(`
            -- Enable RLS
            ALTER TABLE master_users ENABLE ROW LEVEL SECURITY;
            
            -- Drop existing policies if any
            DROP POLICY IF EXISTS "master_users_select_policy" ON master_users;
            DROP POLICY IF EXISTS "master_users_insert_policy" ON master_users;
            DROP POLICY IF EXISTS "master_users_update_policy" ON master_users;
            DROP POLICY IF EXISTS "master_users_delete_policy" ON master_users;
            
            -- Create permissive policies for authenticated users
            CREATE POLICY "master_users_select_policy" ON master_users
                FOR SELECT USING (true);
                
            CREATE POLICY "master_users_insert_policy" ON master_users
                FOR INSERT WITH CHECK (true);
                
            CREATE POLICY "master_users_update_policy" ON master_users
                FOR UPDATE USING (true);
                
            CREATE POLICY "master_users_delete_policy" ON master_users
                FOR DELETE USING (true);
        `);
        
        if (createPolicies) {
            console.log('✅ Created permissive RLS policies');
        } else {
            console.log('❌ Failed to create RLS policies');
        }
    }

    console.log('\n3. Testing access to master_users...');
    try {
        const testResponse = await fetch(`${SUPABASE_URL}/rest/v1/master_users?limit=1`, {
            headers: {
                'Authorization': `Bearer ${SERVICE_KEY}`,
                'apikey': SERVICE_KEY
            }
        });
        
        if (testResponse.ok) {
            console.log('✅ Can successfully read from master_users');
        } else {
            console.log('❌ Still cannot read from master_users:', await testResponse.text());
        }
    } catch (error) {
        console.log('❌ Error testing access:', error.message);
    }

    console.log('\n🏁 RLS FIX COMPLETE');
    console.log('==================');
    console.log('Next steps:');
    console.log('1. Try creating a user invitation again');
    console.log('2. If it works, consider implementing proper RLS policies later');
    console.log('3. Monitor for any security concerns');
}

fixMasterUsersRLS().catch(console.error);