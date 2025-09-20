// Emergency script to add holiday_approved column via Supabase API
// This is a backup method if you can't access the SQL Editor

import fetch from 'node-fetch';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SERVICE_ROLE_KEY = (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) || '';
if (!SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY not set in environment');
}

async function addHolidayApprovalColumn() {
    console.log('🔧 Attempting to add holiday_approved column...\n');

    const sql = `
        -- Add the column if it doesn't exist
        ALTER TABLE kiosk_users
        ADD COLUMN IF NOT EXISTS holiday_approved BOOLEAN DEFAULT false;

        -- Update existing users to have holiday_approved set to false by default
        UPDATE kiosk_users 
        SET holiday_approved = false 
        WHERE holiday_approved IS NULL;

        -- Add a comment to document the column
        COMMENT ON COLUMN kiosk_users.holiday_approved IS 'Indicates whether admin has approved this users holiday allowance';

        -- Create an index for better performance
        CREATE INDEX IF NOT EXISTS idx_kiosk_users_holiday_approved ON kiosk_users (holiday_approved);
    `;

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
                'apikey': SERVICE_ROLE_KEY
            },
            body: JSON.stringify({
                sql: sql
            })
        });

        if (response.ok) {
            console.log('✅ Successfully added holiday_approved column!');
            console.log('📝 All existing users set to holiday_approved = false');
            console.log('🚀 Holiday approval system is now ready to use!');
            
            // Test the column by checking existing users
            const testResponse = await fetch(`${SUPABASE_URL}/rest/v1/kiosk_users?select=user_id,holiday_approved&limit=3`, {
                headers: {
                    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                    'apikey': SERVICE_ROLE_KEY
                }
            });

            if (testResponse.ok) {
                const testData = await testResponse.json();
                console.log('\n📊 Sample of updated user data:');
                console.table(testData);
            }

        } else {
            const error = await response.text();
            console.error('❌ Failed to execute SQL:', error);
            
            // Try alternative approach - direct column addition via REST API
            console.log('\n🔄 Trying alternative approach...');
            
            // This won't work via REST API, but we can at least verify the issue
            const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/kiosk_users?select=holiday_approved&limit=1`, {
                headers: {
                    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                    'apikey': SERVICE_ROLE_KEY
                }
            });

            if (!checkResponse.ok) {
                console.log('✅ Confirmed: holiday_approved column does not exist');
                console.log('📋 Please run the SQL script in your Supabase SQL Editor:');
                console.log('   1. Go to Supabase Dashboard → SQL Editor');
                console.log('   2. Copy and paste the SQL from add_holiday_approval_column_final.sql');
                console.log('   3. Click "Run" to execute the script');
            }
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('\n📋 Manual steps required:');
        console.log('1. Open your Supabase dashboard');
        console.log('2. Go to SQL Editor');
        console.log('3. Run the SQL script from add_holiday_approval_column_final.sql');
    }
}

// Run the function
addHolidayApprovalColumn().catch(console.error);