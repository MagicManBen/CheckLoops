// Script to add holiday_approved column using Supabase RPC

import fetch from 'node-fetch';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SERVICE_ROLE_KEY = (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) || '';
if (!SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY not set in environment');
}

async function addHolidayApprovalColumn() {
  try {
    console.log('Adding holiday_approved column to kiosk_users table...\n');

    // First, let's fetch the current table structure to check if column exists
    const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/kiosk_users?select=*&limit=1`, {
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });

    const userData = await checkResponse.json();

    if (checkResponse.ok && userData.length > 0) {
      // Check if the holiday_approved field exists in the response
      if ('holiday_approved' in userData[0]) {
        console.log('✅ Column "holiday_approved" already exists!');

        // Get all users to show current status
        const usersResponse = await fetch(`${SUPABASE_URL}/rest/v1/kiosk_users?select=user_id,name,holiday_approved`, {
          headers: {
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        const users = await usersResponse.json();
        console.log('\nCurrent Holiday Approval Status:');
        console.log('================================');
        users.forEach(user => {
          console.log(`${user.name || 'Unknown'}: ${user.holiday_approved ? '✓ Approved' : '✗ Not Approved'}`);
        });

        return;
      }
    }

    console.log('Column does not exist. Adding it now...');

    // Since we can't execute raw SQL via REST API, we'll need to:
    // 1. Get all existing user data
    // 2. Add the holiday_approved field with default value
    // 3. Update each record

    // Get all existing users
    const allUsersResponse = await fetch(`${SUPABASE_URL}/rest/v1/kiosk_users?select=*`, {
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!allUsersResponse.ok) {
      throw new Error(`Failed to fetch users: ${await allUsersResponse.text()}`);
    }

    const allUsers = await allUsersResponse.json();
    console.log(`Found ${allUsers.length} users to update...`);

    // Update each user with holiday_approved = false
    for (const user of allUsers) {
      const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/kiosk_users?user_id=eq.${user.user_id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ holiday_approved: false })
      });

      if (!updateResponse.ok) {
        // This might fail if the column doesn't exist
        const error = await updateResponse.text();
        if (error.includes('column "holiday_approved" of relation "kiosk_users" does not exist')) {
          console.log('\n❌ Cannot add column via REST API.');
          console.log('\n📋 Please run this SQL directly in your Supabase SQL Editor:');
          console.log('================================================\n');
          console.log(`ALTER TABLE kiosk_users
ADD COLUMN holiday_approved BOOLEAN DEFAULT false;

-- Set all existing users to not approved by default
UPDATE kiosk_users
SET holiday_approved = false
WHERE holiday_approved IS NULL;`);
          console.log('\n================================================');
          console.log('\nAfter running the SQL above, the holiday approval system will be ready.');
          return;
        }
        throw new Error(`Failed to update user ${user.user_id}: ${error}`);
      }
    }

    console.log('\n✅ Successfully added holiday_approved column to all users!');
    console.log('All users are set to "not approved" by default.');
    console.log('Admins can now approve holidays from the admin dashboard.');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

addHolidayApprovalColumn();