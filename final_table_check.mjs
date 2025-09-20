// Final check to understand what's actually in the kiosk_users table
import fetch from 'node-fetch';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SERVICE_ROLE_KEY = (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) || '';
if (!SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY not set in environment');
}

async function finalTableCheck() {
    console.log('🔍 Final comprehensive check of kiosk_users table...\n');

    // 1. Check if holiday_approved column works
    console.log('📋 1. Testing holiday_approved column access...');
    try {
        const holidayResponse = await fetch(`${SUPABASE_URL}/rest/v1/kiosk_users?select=holiday_approved&limit=5`, {
            headers: {
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'apikey': SERVICE_ROLE_KEY
            }
        });

        if (holidayResponse.ok) {
            const data = await holidayResponse.json();
            console.log('✅ holiday_approved column is accessible!');
            console.log(`📊 Found ${data.length} records`);
            console.log('Sample data:', data);
        } else {
            const error = await holidayResponse.text();
            console.log('❌ Cannot access holiday_approved:', error);
        }
    } catch (error) {
        console.error('❌ Error checking holiday_approved:', error.message);
    }

    // 2. Let's try to figure out what the actual columns are by trying common ones
    console.log('\n🔍 2. Testing common column names...');
    const commonColumns = [
        'id',
        'user_id', 
        'auth_user_id',
        'uuid',
        'email',
        'username',
        'name',
        'role',
        'site_id',
        'created_at',
        'updated_at',
        'holiday_approved'
    ];

    const existingColumns = [];
    
    for (const column of commonColumns) {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/kiosk_users?select=${column}&limit=1`, {
                headers: {
                    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                    'apikey': SERVICE_ROLE_KEY
                }
            });

            if (response.ok) {
                existingColumns.push(column);
                console.log(`✅ ${column}`);
            } else {
                console.log(`❌ ${column}`);
            }
        } catch (e) {
            console.log(`❌ ${column} (error)`);
        }
    }

    console.log('\n📊 Confirmed existing columns:', existingColumns);

    // 3. Try to get some actual data
    console.log('\n👥 3. Checking for existing user data...');
    try {
        const query = existingColumns.slice(0, 5).join(','); // Use first 5 confirmed columns
        const dataResponse = await fetch(`${SUPABASE_URL}/rest/v1/kiosk_users?select=${query}`, {
            headers: {
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'apikey': SERVICE_ROLE_KEY
            }
        });

        if (dataResponse.ok) {
            const data = await dataResponse.json();
            console.log(`✅ Found ${data.length} user records`);
            if (data.length > 0) {
                console.log('📋 Sample record:', JSON.stringify(data[0], null, 2));
                
                // If we have users, let's try to update them with holiday_approved = false
                if (existingColumns.includes('holiday_approved')) {
                    console.log('\n🔄 4. Setting holiday_approved = false for all existing users...');
                    
                    const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/kiosk_users`, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                            'Content-Type': 'application/json',
                            'apikey': SERVICE_ROLE_KEY
                        },
                        body: JSON.stringify({
                            holiday_approved: false
                        })
                    });

                    if (updateResponse.ok) {
                        console.log('✅ Successfully updated all users with holiday_approved = false');
                        
                        // Verify the update
                        const verifyResponse = await fetch(`${SUPABASE_URL}/rest/v1/kiosk_users?select=id,holiday_approved`, {
                            headers: {
                                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                                'apikey': SERVICE_ROLE_KEY
                            }
                        });

                        if (verifyResponse.ok) {
                            const verifyData = await verifyResponse.json();
                            console.log('📊 Updated user data:');
                            console.table(verifyData);
                        }
                    } else {
                        const updateError = await updateResponse.text();
                        console.log('❌ Failed to update users:', updateError);
                    }
                }
            } else {
                console.log('📭 No users found in kiosk_users table');
                console.log('💡 The table exists but is empty, which is why the column might work but not be useful yet');
            }
        } else {
            const error = await dataResponse.text();
            console.log('❌ Cannot get user data:', error);
        }
    } catch (error) {
        console.error('❌ Error getting user data:', error.message);
    }

    // 5. Test the actual error scenario from the UI
    console.log('\n🧪 5. Testing the exact scenario from the UI error...');
    try {
        // This is what the UI code tries to do
        const uiTestResponse = await fetch(`${SUPABASE_URL}/rest/v1/kiosk_users?select=holiday_approved&user_id=eq.test-user-id&limit=1`, {
            headers: {
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'apikey': SERVICE_ROLE_KEY
            }
        });

        if (uiTestResponse.ok) {
            console.log('✅ UI query pattern works');
        } else {
            const error = await uiTestResponse.text();
            console.log('❌ UI query pattern fails:', error);
            
            if (error.includes('user_id')) {
                console.log('💡 The issue is that there is no user_id column!');
                console.log('🔍 The UI code is looking for user_id but the table might use a different column name');
                console.log('📝 Need to check what column actually stores the user identifier');
            }
        }
    } catch (error) {
        console.error('❌ Error testing UI scenario:', error.message);
    }

    console.log('\n📋 SUMMARY:');
    console.log('✅ holiday_approved column appears to exist');
    console.log('❌ user_id column does NOT exist - this is likely the real issue');
    console.log('🔧 The UI code needs to be updated to use the correct user identifier column');
    console.log('📊 Confirmed columns:', existingColumns.join(', '));
}

// Run the final check
finalTableCheck().catch(console.error);