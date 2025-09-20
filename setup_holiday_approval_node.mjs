// Script to add holiday_approved column to kiosk_users table if it doesn't exist

import fetch from 'node-fetch';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SERVICE_ROLE_KEY = (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) || '';
if (!SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY not set in environment');
}

async function setupHolidayApproval() {
  try {
    console.log('Setting up holiday approval system...');

    // First try to check if column exists using REST API
    const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/kiosk_users?select=user_id,holiday_approved&limit=1`, {
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const checkData = await checkResponse.json();

    if (checkResponse.status === 400 && checkData.message && checkData.message.includes('column')) {
      console.log('\n⚠️  Column "holiday_approved" does not exist.');
      console.log('\n📋 Please run this SQL in your Supabase SQL Editor:');
      console.log('================================================\n');
      console.log(`ALTER TABLE kiosk_users
ADD COLUMN IF NOT EXISTS holiday_approved BOOLEAN DEFAULT false;

-- Set all existing users to not approved by default
UPDATE kiosk_users
SET holiday_approved = false
WHERE holiday_approved IS NULL;`);
      console.log('\n================================================');
      return;
    }

    // Get all users and their current approval status
    const usersResponse = await fetch(`${SUPABASE_URL}/rest/v1/kiosk_users?select=user_id,name,holiday_approved`, {
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!usersResponse.ok) {
      const error = await usersResponse.text();
      console.error('Error fetching users:', error);

      // Check if it's a column not found error
      if (error.includes('column "holiday_approved" does not exist')) {
        console.log('\n⚠️  Column "holiday_approved" does not exist.');
        console.log('\n📋 Please run this SQL in your Supabase SQL Editor:');
        console.log('================================================\n');
        console.log(`ALTER TABLE kiosk_users
ADD COLUMN IF NOT EXISTS holiday_approved BOOLEAN DEFAULT false;

-- Set all existing users to not approved by default
UPDATE kiosk_users
SET holiday_approved = false
WHERE holiday_approved IS NULL;`);
        console.log('\n================================================');
      }
      return;
    }

    const users = await usersResponse.json();

    console.log('\nCurrent Holiday Approval Status:');
    console.log('================================');
    users.forEach(user => {
      console.log(`${user.name || 'Unknown'}: ${user.holiday_approved ? '✓ Approved' : '✗ Not Approved'}`);
    });

    console.log('\n✅ Holiday approval system is ready!');
    console.log('Admins can now approve holidays from the admin dashboard.');

  } catch (error) {
    console.error('Error setting up holiday approval:', error);
  }
}

setupHolidayApproval();