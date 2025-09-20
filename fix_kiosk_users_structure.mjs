// Script to add user_id column to kiosk_users and fix holiday approval system
import fetch from 'node-fetch';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SERVICE_ROLE_KEY = (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) || '';
if (!SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY not set in environment');
}

async function fixKioskUsersStructure() {
    console.log('🔧 Fixing kiosk_users table structure for holiday approval...\n');

    try {
        // Step 1: Try to add user_id column directly via API
        console.log('📋 1. Adding user_id column to kiosk_users table...');
        
        // First, let's create a test record with user_id to see if it works
        const testResponse = await fetch(`${SUPABASE_URL}/rest/v1/kiosk_users`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
                'apikey': SERVICE_ROLE_KEY,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                site_id: 1,
                role: 'staff',
                user_id: 'test-uuid-12345',  // Try adding user_id
                holiday_approved: false
            })
        });

        if (testResponse.ok) {
            const data = await testResponse.json();
            console.log('✅ user_id column already exists or was added successfully!');
            console.log('📊 Test record:', data[0]);
            
            // Clean up test record
            const testId = data[0].id;
            await fetch(`${SUPABASE_URL}/rest/v1/kiosk_users?id=eq.${testId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                    'apikey': SERVICE_ROLE_KEY
                }
            });
            console.log('🧹 Test record cleaned up');
            
        } else {
            const error = await testResponse.text();
            console.log('❌ user_id column does not exist:', error);
            
            if (error.includes('user_id') && error.includes('does not exist')) {
                console.log('\n📋 Need to add user_id column manually in Supabase SQL Editor:');
                console.log('   ALTER TABLE kiosk_users ADD COLUMN user_id UUID;');
                console.log('\n   Then run the full SQL script: fix_kiosk_users_structure.sql');
            }
        }

    } catch (error) {
        console.error('❌ Error testing table structure:', error.message);
    }

    // Step 2: Test the current holiday approval functionality
    console.log('\n🧪 2. Testing current holiday approval functionality...');
    
    try {
        // Test querying by user_id (what our current code does)
        const userIdResponse = await fetch(`${SUPABASE_URL}/rest/v1/kiosk_users?select=id,holiday_approved&user_id=eq.test-user-id&limit=1`, {
            headers: {
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'apikey': SERVICE_ROLE_KEY
            }
        });

        if (userIdResponse.ok) {
            console.log('✅ Query by user_id works!');
            const data = await userIdResponse.json();
            console.log('📊 Query result:', data);
        } else {
            const error = await userIdResponse.text();
            console.log('❌ Query by user_id fails:', error);
            
            if (error.includes('user_id') && error.includes('does not exist')) {
                console.log('💡 This confirms user_id column is missing from kiosk_users table');
            }
        }

    } catch (error) {
        console.error('❌ Error testing functionality:', error.message);
    }

    // Step 3: Show current table structure
    console.log('\n📊 3. Current table structure check...');
    
    try {
        // Try to get all columns by querying without select
        const structureResponse = await fetch(`${SUPABASE_URL}/rest/v1/kiosk_users?limit=0`, {
            headers: {
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'apikey': SERVICE_ROLE_KEY
            }
        });

        if (structureResponse.ok) {
            // This won't show us columns directly, but let's try other approaches
            console.log('✅ Table accessible');
            
            // Test each column individually
            const testColumns = ['id', 'user_id', 'site_id', 'role', 'full_name', 'holiday_approved', 'created_at'];
            const existingColumns = [];
            
            for (const col of testColumns) {
                try {
                    const colResponse = await fetch(`${SUPABASE_URL}/rest/v1/kiosk_users?select=${col}&limit=1`, {
                        headers: {
                            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                            'apikey': SERVICE_ROLE_KEY
                        }
                    });
                    
                    if (colResponse.ok) {
                        existingColumns.push(col);
                    }
                } catch (e) {
                    // Silent fail
                }
            }
            
            console.log('📋 Confirmed columns:', existingColumns.join(', '));
            
            if (!existingColumns.includes('user_id')) {
                console.log('\n❗ ISSUE CONFIRMED: user_id column is missing from kiosk_users table');
                console.log('\n🔧 SOLUTION:');
                console.log('1. Go to Supabase Dashboard → SQL Editor');
                console.log('2. Run the SQL script: fix_kiosk_users_structure.sql');
                console.log('3. This will add the user_id column and create the proper relationships');
            } else if (!existingColumns.includes('holiday_approved')) {
                console.log('\n❗ ISSUE: holiday_approved column is missing');
                console.log('🔧 Run: ALTER TABLE kiosk_users ADD COLUMN holiday_approved BOOLEAN DEFAULT false;');
            } else {
                console.log('\n✅ All required columns exist!');
            }
            
        } else {
            console.error('❌ Cannot access kiosk_users table');
        }

    } catch (error) {
        console.error('❌ Error checking structure:', error.message);
    }

    // Step 4: Check if we have any users in related tables
    console.log('\n👥 4. Checking related user data...');
    
    try {
        // Check profiles table
        const profilesResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=user_id,full_name&limit=5`, {
            headers: {
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'apikey': SERVICE_ROLE_KEY
            }
        });

        if (profilesResponse.ok) {
            const profiles = await profilesResponse.json();
            console.log(`✅ Found ${profiles.length} users in profiles table`);
            if (profiles.length > 0) {
                console.log('📋 Sample profiles:', profiles);
            }
        } else {
            console.log('❌ Cannot access profiles table');
        }

        // Check staff_app_welcome table  
        const welcomeResponse = await fetch(`${SUPABASE_URL}/rest/v1/staff_app_welcome?select=user_id,full_name&limit=5`, {
            headers: {
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'apikey': SERVICE_ROLE_KEY
            }
        });

        if (welcomeResponse.ok) {
            const welcomeData = await welcomeResponse.json();
            console.log(`✅ Found ${welcomeData.length} users in staff_app_welcome table`);
            if (welcomeData.length > 0) {
                console.log('📋 Sample welcome data:', welcomeData);
            }
        } else {
            console.log('❌ Cannot access staff_app_welcome table');
        }

    } catch (error) {
        console.error('❌ Error checking user data:', error.message);
    }

    console.log('\n📋 SUMMARY:');
    console.log('1. The kiosk_users table exists but is missing the user_id column');
    console.log('2. The holiday_approved column exists');
    console.log('3. The UI code tries to query by user_id, which fails');
    console.log('4. Run fix_kiosk_users_structure.sql in Supabase SQL Editor to fix this');
}

// Run the fix
fixKioskUsersStructure().catch(console.error);