// Script to add holiday approval status to kiosk_users table

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function addHolidayApprovalColumn() {
  console.log('Adding holiday_approved column to kiosk_users table...');

  try {
    // Add the column using raw SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE kiosk_users
        ADD COLUMN IF NOT EXISTS holiday_approved BOOLEAN DEFAULT FALSE;
      `
    });

    if (error) {
      // Try direct approach if RPC doesn't exist
      console.log('RPC failed, trying direct approach...');

      // Check if column already exists by trying to query it
      const { data: testData, error: testError } = await supabase
        .from('kiosk_users')
        .select('holiday_approved')
        .limit(1);

      if (testError && testError.message.includes('column')) {
        console.log('Column does not exist, needs to be added manually through Supabase dashboard');
        console.log('Please add the following column to kiosk_users table:');
        console.log('- Column name: holiday_approved');
        console.log('- Type: boolean');
        console.log('- Default value: false');
      } else {
        console.log('Column already exists or was added successfully');
      }
    } else {
      console.log('Column added successfully!');
    }

    // Check current status
    const { data: users, error: usersError } = await supabase
      .from('kiosk_users')
      .select('user_id, full_name, holiday_approved')
      .order('full_name');

    if (!usersError) {
      console.log('\nCurrent holiday approval status:');
      users.forEach(user => {
        console.log(`- ${user.full_name}: ${user.holiday_approved ? 'Approved' : 'Not Approved'}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
addHolidayApprovalColumn();