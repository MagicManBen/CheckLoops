// Get the exact table structure and add the holiday_approved column
import fetch from 'node-fetch';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SERVICE_ROLE_KEY = (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) || '';
if (!SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY not set in environment');
}

async function getTableStructureAndAddColumn() {
    console.log('🔍 Getting exact kiosk_users table structure...\n');

    try {
        // Create a test record to see what columns exist
        console.log('📋 1. Creating a minimal test record to reveal table structure...');
        
        const testResponse = await fetch(`${SUPABASE_URL}/rest/v1/kiosk_users`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
                'apikey': SERVICE_ROLE_KEY,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                site_id: 1,  // This was mentioned in the error as required
                email: 'test@example.com',
                role: 'staff'
            })
        });

        if (testResponse.ok) {
            const data = await testResponse.json();
            console.log('✅ Test record created successfully!');
            console.log('📊 Table structure revealed:');
            
            if (data && data.length > 0) {
                const columns = Object.keys(data[0]);
                console.log('Columns:', columns);
                console.log('\nSample record:');
                console.log(JSON.stringify(data[0], null, 2));
                
                // Check if holiday_approved exists
                if (columns.includes('holiday_approved')) {
                    console.log('✅ holiday_approved column already EXISTS!');
                } else {
                    console.log('❌ holiday_approved column does NOT exist');
                    console.log('📝 Columns found:', columns.length);
                    
                    // Now let's find the correct user ID column
                    const userColumns = columns.filter(col => 
                        col.includes('user') || 
                        col === 'id' ||
                        col.includes('auth')
                    );
                    console.log('🔍 Potential user ID columns:', userColumns);
                }
                
                // Clean up - delete the test record
                const recordId = data[0].id;
                const deleteResponse = await fetch(`${SUPABASE_URL}/rest/v1/kiosk_users?id=eq.${recordId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                        'apikey': SERVICE_ROLE_KEY
                    }
                });
                
                if (deleteResponse.ok) {
                    console.log('🧹 Test record deleted');
                }
            }
        } else {
            const error = await testResponse.text();
            console.log('❌ Failed to create test record:', error);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    // Now try to add the column using a more direct approach
    console.log('\n🔧 2. Attempting to add holiday_approved column using edge function approach...');
    
    try {
        // Let's try using Supabase Edge Functions endpoint if available
        const edgeFunctionResponse = await fetch(`${SUPABASE_URL}/functions/v1/execute-sql`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sql: 'ALTER TABLE kiosk_users ADD COLUMN IF NOT EXISTS holiday_approved BOOLEAN DEFAULT false;'
            })
        });

        if (!edgeFunctionResponse.ok) {
            console.log('❌ Edge function not available');
            
            // Try creating our own function to handle this
            console.log('\n🛠️ 3. Creating a custom RPC function to add the column...');
            
            // First, let's see if we can create an RPC function
            const createFunctionResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/create_holiday_column`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                    'Content-Type': 'application/json',
                    'apikey': SERVICE_ROLE_KEY
                }
            });

            if (!createFunctionResponse.ok) {
                console.log('❌ Cannot create custom RPC function');
                
                // Final attempt: try to update existing records to force column creation
                console.log('\n💡 4. Alternative approach: Update existing records...');
                
                // First, let's add a record with holiday_approved included
                const addRecordResponse = await fetch(`${SUPABASE_URL}/rest/v1/kiosk_users`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                        'Content-Type': 'application/json',
                        'apikey': SERVICE_ROLE_KEY,
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        site_id: 1,
                        email: 'test2@example.com',
                        role: 'staff',
                        holiday_approved: false
                    })
                });

                if (addRecordResponse.ok) {
                    console.log('✅ Successfully added record with holiday_approved field!');
                    const data = await addRecordResponse.json();
                    console.log('📊 New record:', data[0]);
                    
                    // Clean up
                    const recordId = data[0].id;
                    await fetch(`${SUPABASE_URL}/rest/v1/kiosk_users?id=eq.${recordId}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                            'apikey': SERVICE_ROLE_KEY
                        }
                    });
                } else {
                    const error = await addRecordResponse.text();
                    console.log('❌ Failed to add record with holiday_approved:', error);
                    
                    if (error.includes('column') && error.includes('does not exist')) {
                        console.log('\n❗ CONFIRMED: holiday_approved column does not exist');
                        console.log('📋 Manual intervention required:');
                        console.log('   1. Go to Supabase Dashboard');
                        console.log('   2. Navigate to Table Editor');
                        console.log('   3. Open kiosk_users table');
                        console.log('   4. Add a new column: holiday_approved (boolean, default false)');
                        console.log('   5. Or use SQL Editor with the provided SQL script');
                    } else if (error.includes('holiday_approved')) {
                        console.log('✅ holiday_approved column exists but there might be another issue');
                    }
                }
            }
        } else {
            console.log('✅ Edge function successful!');
            const result = await edgeFunctionResponse.text();
            console.log('📋 Result:', result);
        }

    } catch (error) {
        console.error('❌ Error in column addition:', error.message);
    }

    // Final verification
    console.log('\n🔍 5. Final verification - testing holiday_approved access...');
    try {
        const verifyResponse = await fetch(`${SUPABASE_URL}/rest/v1/kiosk_users?select=id,holiday_approved&limit=1`, {
            headers: {
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'apikey': SERVICE_ROLE_KEY
            }
        });

        if (verifyResponse.ok) {
            console.log('✅ holiday_approved column is now accessible!');
            const data = await verifyResponse.json();
            console.log('📊 Verification data:', data);
        } else {
            const error = await verifyResponse.text();
            console.log('❌ holiday_approved column still not accessible:', error);
        }
    } catch (error) {
        console.error('❌ Verification error:', error.message);
    }
}

// Run the function
getTableStructureAndAddColumn().catch(console.error);