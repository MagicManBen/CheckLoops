// Explore Supabase database to understand the holiday_approved column issue
import fetch from 'node-fetch';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SERVICE_ROLE_KEY = (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) || '';
if (!SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY not set in environment');
}

async function exploreDatabase() {
    console.log('🔍 Exploring Supabase database structure...\n');

    // 1. First, let's see what columns exist in kiosk_users table
    console.log('📋 1. Checking kiosk_users table structure...');
    try {
        // Try to get the table schema information
        const schemaResponse = await fetch(`${SUPABASE_URL}/rest/v1/?select=*`, {
            method: 'OPTIONS',
            headers: {
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'apikey': SERVICE_ROLE_KEY
            }
        });

        // Let's try a different approach - query the information_schema
        const columnsResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_table_columns`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
                'apikey': SERVICE_ROLE_KEY
            },
            body: JSON.stringify({
                table_name: 'kiosk_users'
            })
        });

        if (!columnsResponse.ok) {
            // Try direct query approach
            console.log('📊 Trying direct table query to see current structure...');
            
            const directResponse = await fetch(`${SUPABASE_URL}/rest/v1/kiosk_users?limit=1`, {
                headers: {
                    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                    'apikey': SERVICE_ROLE_KEY
                }
            });

            if (directResponse.ok) {
                const data = await directResponse.json();
                console.log('✅ kiosk_users table exists and is accessible');
                console.log('📋 Sample record structure:');
                if (data.length > 0) {
                    console.log('Columns found:', Object.keys(data[0]));
                    console.log('Sample data:', data[0]);
                    
                    if (data[0].hasOwnProperty('holiday_approved')) {
                        console.log('✅ holiday_approved column EXISTS in the table!');
                        console.log('🔍 Current value:', data[0].holiday_approved);
                    } else {
                        console.log('❌ holiday_approved column does NOT exist in the table');
                    }
                } else {
                    console.log('📭 Table is empty, cannot determine structure');
                }
            } else {
                console.error('❌ Cannot access kiosk_users table:', await directResponse.text());
            }
        }

    } catch (error) {
        console.error('❌ Error checking table structure:', error.message);
    }

    // 2. Let's try to query specifically for holiday_approved column
    console.log('\n🔍 2. Testing holiday_approved column access...');
    try {
        const holidayResponse = await fetch(`${SUPABASE_URL}/rest/v1/kiosk_users?select=user_id,holiday_approved&limit=3`, {
            headers: {
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'apikey': SERVICE_ROLE_KEY
            }
        });

        if (holidayResponse.ok) {
            const data = await holidayResponse.json();
            console.log('✅ holiday_approved column is accessible!');
            console.log('📊 Current holiday approval status:');
            console.table(data);
        } else {
            const error = await holidayResponse.text();
            console.log('❌ Cannot query holiday_approved column:', error);
            
            if (error.includes('column') && error.includes('does not exist')) {
                console.log('🔧 Attempting to add the column now...');
                await attemptColumnAddition();
            }
        }
    } catch (error) {
        console.error('❌ Error testing holiday_approved access:', error.message);
    }

    // 3. Let's check all users to see their current state
    console.log('\n👥 3. Checking all kiosk_users...');
    try {
        const usersResponse = await fetch(`${SUPABASE_URL}/rest/v1/kiosk_users?select=user_id,email,role`, {
            headers: {
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'apikey': SERVICE_ROLE_KEY
            }
        });

        if (usersResponse.ok) {
            const users = await usersResponse.json();
            console.log(`✅ Found ${users.length} users in kiosk_users table:`);
            console.table(users);
        } else {
            console.error('❌ Cannot fetch users:', await usersResponse.text());
        }
    } catch (error) {
        console.error('❌ Error fetching users:', error.message);
    }

    // 4. Let's try using RPC to add the column
    console.log('\n⚡ 4. Attempting to add column via SQL RPC...');
    await attemptColumnAddition();
}

async function attemptColumnAddition() {
    try {
        // First, let's try to see what RPC functions are available
        const rpcResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
                'apikey': SERVICE_ROLE_KEY
            },
            body: JSON.stringify({
                sql: `
                    DO $$
                    BEGIN
                        IF NOT EXISTS (
                            SELECT column_name 
                            FROM information_schema.columns 
                            WHERE table_name = 'kiosk_users' 
                            AND column_name = 'holiday_approved'
                        ) THEN
                            ALTER TABLE kiosk_users 
                            ADD COLUMN holiday_approved BOOLEAN DEFAULT false;
                            
                            UPDATE kiosk_users 
                            SET holiday_approved = false 
                            WHERE holiday_approved IS NULL;
                            
                            RAISE NOTICE 'Column holiday_approved added successfully';
                        ELSE
                            RAISE NOTICE 'Column holiday_approved already exists';
                        END IF;
                    END $$;
                `
            })
        });

        if (rpcResponse.ok) {
            console.log('✅ SQL execution successful!');
            const result = await rpcResponse.text();
            console.log('📋 Result:', result);
            
            // Verify the column was added
            const verifyResponse = await fetch(`${SUPABASE_URL}/rest/v1/kiosk_users?select=user_id,holiday_approved&limit=1`, {
                headers: {
                    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                    'apikey': SERVICE_ROLE_KEY
                }
            });

            if (verifyResponse.ok) {
                const data = await verifyResponse.json();
                console.log('✅ Verification successful! Column added and accessible.');
                console.log('📊 Sample data:', data);
            } else {
                console.log('❌ Verification failed:', await verifyResponse.text());
            }
        } else {
            const error = await rpcResponse.text();
            console.log('❌ SQL execution failed:', error);
            
            // Try a simpler approach - direct ALTER TABLE
            console.log('\n🔄 Trying simpler ALTER TABLE approach...');
            const simpleResponse = await fetch(`${SUPABASE_URL}/sql`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                    'Content-Type': 'application/sql',
                    'apikey': SERVICE_ROLE_KEY
                },
                body: 'ALTER TABLE kiosk_users ADD COLUMN IF NOT EXISTS holiday_approved BOOLEAN DEFAULT false;'
            });

            if (simpleResponse.ok) {
                console.log('✅ Simple ALTER TABLE successful!');
            } else {
                console.log('❌ Simple ALTER TABLE failed:', await simpleResponse.text());
            }
        }
    } catch (error) {
        console.error('❌ Error in attemptColumnAddition:', error.message);
    }
}

// Run the exploration
exploreDatabase().catch(console.error);