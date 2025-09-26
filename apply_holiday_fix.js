import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Initialize the Supabase client
const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseKey = 'sb_secret_ylIhDtikpno4LTTUmpDJvw_Ov7BtIEp';
const supabase = createClient(supabaseUrl, supabaseKey);

async function applyHolidayFix() {
  try {
    console.log('Starting holiday_taken fix application...');
    
    // Step 1: First get a before snapshot
    console.log('\nBEFORE: Checking current state of holiday_taken values...');
    const { data: beforeUsers, error: beforeError } = await supabase
      .from('master_users')
      .select('id, auth_user_id, full_name, holiday_taken, approved_holidays_used')
      .order('full_name');
      
    if (beforeError) {
      console.error('Error fetching users before update:', beforeError);
      return;
    }
    
    console.log('Before update - Current holiday_taken values:');
    beforeUsers.forEach(user => {
      console.log(`${user.full_name}: holiday_taken=${user.holiday_taken}, approved_holidays_used=${user.approved_holidays_used}`);
    });
    
    // Step 2: Calculate totals from holiday requests
    console.log('\nCalculating holiday totals from 4_holiday_requests...');
    const { data: holidayCounts, error: countError } = await supabase
      .from('4_holiday_requests')
      .select('user_id, status')
      .eq('status', 'approved');
      
    if (countError) {
      console.error('Error calculating holiday counts:', countError);
      return;
    }
    
    // Group by user_id
    const holidaysByUser = {};
    holidayCounts.forEach(h => {
      const userId = h.user_id;
      if (!userId) return;
      
      holidaysByUser[userId] = (holidaysByUser[userId] || 0) + 1;
    });
    
    console.log('Approved holiday counts by user:');
    Object.entries(holidaysByUser).forEach(([userId, count]) => {
      const user = beforeUsers.find(u => u.auth_user_id === userId);
      console.log(`${user?.full_name || userId}: ${count} approved holidays`);
    });
    
    // Step 3: Apply the SQL fix
    console.log('\nApplying SQL fix to update holiday_taken and approved_holidays_used...');
    
    // First SQL: Calculate totals
    const { data: totals, error: totalsError } = await supabase.rpc('run_sql', {
      sql_query: `
        SELECT 
          hr.user_id,
          SUM(hr.total_days) as total_days
        FROM 
          "4_holiday_requests" hr
        WHERE 
          hr.status = 'approved'
        GROUP BY 
          hr.user_id
      `
    });
    
    if (totalsError) {
      console.error('Error calculating holiday totals:', totalsError);
      return;
    }
    
    console.log('Calculated holiday totals:');
    console.log(totals);
    
    // Second SQL: Update master_users
    console.log('\nUpdating master_users table...');
    const { data: updateResult, error: updateError } = await supabase.rpc('run_sql', {
      sql_query: `
        WITH holiday_totals AS (
          SELECT 
            hr.user_id,
            SUM(hr.total_days) as total_days
          FROM 
            "4_holiday_requests" hr
          WHERE 
            hr.status = 'approved'
          GROUP BY 
            hr.user_id
        )
        UPDATE 
          master_users mu
        SET 
          holiday_taken = COALESCE(ht.total_days, 0),
          approved_holidays_used = COALESCE(ht.total_days, 0)
        FROM 
          holiday_totals ht
        WHERE 
          mu.auth_user_id = ht.user_id
        RETURNING 
          mu.id, mu.full_name, mu.holiday_taken, mu.approved_holidays_used
      `
    });
    
    if (updateError) {
      console.error('Error updating master_users:', updateError);
      return;
    }
    
    console.log('Update result:');
    console.log(updateResult);
    
    // Step 4: Verify the changes
    console.log('\nAFTER: Checking updated holiday_taken values...');
    const { data: afterUsers, error: afterError } = await supabase
      .from('master_users')
      .select('id, auth_user_id, full_name, holiday_taken, approved_holidays_used')
      .order('full_name');
      
    if (afterError) {
      console.error('Error fetching users after update:', afterError);
      return;
    }
    
    console.log('After update - Updated holiday_taken values:');
    afterUsers.forEach(user => {
      const beforeUser = beforeUsers.find(u => u.id === user.id);
      const changed = beforeUser && 
        (beforeUser.holiday_taken !== user.holiday_taken || 
         beforeUser.approved_holidays_used !== user.approved_holidays_used);
         
      console.log(
        `${user.full_name}: holiday_taken=${user.holiday_taken}, approved_holidays_used=${user.approved_holidays_used}` + 
        (changed ? ' (UPDATED)' : '')
      );
    });
    
    console.log('\nFix completed successfully!');
    
  } catch (error) {
    console.error('Error during holiday fix application:', error);
  }
}

// Run the fix
applyHolidayFix();