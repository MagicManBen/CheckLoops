// Investigate the actual structure of kiosk_users table
import fetch from 'node-fetch';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

async function investigateTableStructure() {
    console.log('🔍 Investigating kiosk_users table structure...\n');

    try {
        // Let's try to get all data without specifying columns to see what exists
        console.log('📋 1. Getting raw table data to see actual columns...');
        
        const rawResponse = await fetch(`${SUPABASE_URL}/rest/v1/kiosk_users`, {
            headers: {
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'apikey': SERVICE_ROLE_KEY
            }
        });

        if (rawResponse.ok) {
            const data = await rawResponse.json();
            console.log(`✅ Found ${data.length} records in kiosk_users table`);
            
            if (data.length > 0) {
                console.log('\n📊 Actual table columns:');
                const columns = Object.keys(data[0]);
                console.log(columns);
                
                console.log('\n📋 Sample record:');
                console.log(JSON.stringify(data[0], null, 2));
                
                // Check if holiday_approved exists
                if (columns.includes('holiday_approved')) {
                    console.log('✅ holiday_approved column EXISTS!');
                } else {
                    console.log('❌ holiday_approved column does NOT exist');
                    console.log('🔧 Available columns that could be user ID:');
                    const possibleUserColumns = columns.filter(col => 
                        col.toLowerCase().includes('user') || 
                        col.toLowerCase().includes('id') ||
                        col.toLowerCase().includes('email')
                    );
                    console.log(possibleUserColumns);
                }
            } else {
                console.log('📭 Table is empty');
                
                // Let's try to add some test data to see what columns are expected
                console.log('\n🧪 Let\'s check what columns are required by trying a minimal insert...');
                
                const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/kiosk_users`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                        'Content-Type': 'application/json',
                        'apikey': SERVICE_ROLE_KEY,
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({})
                });

                if (!insertResponse.ok) {
                    const error = await insertResponse.text();
                    console.log('📋 Insert error reveals required columns:', error);
                }
            }
        } else {
            console.error('❌ Cannot access kiosk_users table:', await rawResponse.text());
        }

    } catch (error) {
        console.error('❌ Error investigating table:', error.message);
    }

    // Let's also try to get table schema information from PostgreSQL system tables
    console.log('\n🔍 2. Trying to get schema information...');
    
    try {
        // Try querying information_schema directly
        const schemaResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_schema_info`, {
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

        if (!schemaResponse.ok) {
            console.log('❌ No custom RPC function for schema info');
            
            // Let's create a simple test to understand the table better
            console.log('\n🧪 3. Testing different approaches...');
            
            // Test if we can query with different potential column names
            const testColumns = ['id', 'user_id', 'email', 'username', 'auth_id'];
            
            for (const col of testColumns) {
                try {
                    const testResponse = await fetch(`${SUPABASE_URL}/rest/v1/kiosk_users?select=${col}&limit=1`, {
                        headers: {
                            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                            'apikey': SERVICE_ROLE_KEY
                        }
                    });

                    if (testResponse.ok) {
                        console.log(`✅ Column '${col}' exists`);
                    } else {
                        const error = await testResponse.text();
                        if (!error.includes('does not exist')) {
                            console.log(`❓ Column '${col}': ${error}`);
                        }
                    }
                } catch (e) {
                    // Silent fail for each test
                }
            }
            
        } else {
            const schemaData = await schemaResponse.json();
            console.log('✅ Schema information:', schemaData);
        }

    } catch (error) {
        console.log('❌ Schema query error:', error.message);
    }

    // Try to add the holiday_approved column regardless
    console.log('\n🔧 4. Attempting to add holiday_approved column...');
    
    try {
        // Use direct SQL approach via REST API
        const addColumnSQL = `
            ALTER TABLE kiosk_users 
            ADD COLUMN IF NOT EXISTS holiday_approved BOOLEAN DEFAULT false;
        `;

        // Try different endpoints for SQL execution
        const endpoints = [
            '/rest/v1/rpc/exec_sql',
            '/sql',
            '/rest/v1/rpc/execute_sql',
            '/rpc/exec'
        ];

        for (const endpoint of endpoints) {
            try {
                const response = await fetch(`${SUPABASE_URL}${endpoint}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                        'Content-Type': 'application/json',
                        'apikey': SERVICE_ROLE_KEY
                    },
                    body: JSON.stringify({ sql: addColumnSQL })
                });

                if (response.ok) {
                    console.log(`✅ Successfully executed SQL via ${endpoint}`);
                    const result = await response.text();
                    console.log('📋 Result:', result);
                    break;
                } else {
                    const error = await response.text();
                    console.log(`❌ Failed via ${endpoint}:`, error);
                }
            } catch (e) {
                console.log(`❌ Error with ${endpoint}:`, e.message);
            }
        }

    } catch (error) {
        console.error('❌ Error adding column:', error.message);
    }
}

// Run the investigation
investigateTableStructure().catch(console.error);