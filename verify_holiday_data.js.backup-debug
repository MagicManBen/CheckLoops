// apply_holiday_fix.js - Script to fix holiday display in admin dashboard
const { createClient } = require('@supabase/supabase-js');

// Supabase connection details
const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseKey = 'sb_secret_ylIhDtikpno4LTTUmpDJvw_Ov7BtIEp'; // Service key for direct DB access
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Starting holiday fix verification...');
  
  try {
    // 1. First check if the SQL update worked - check data in master_users
    const { data: users, error: usersError } = await supabase
      .from('master_users')
      .select('id, full_name, holiday_taken, approved_holidays_used')
      .order('full_name');
      
    if (usersError) throw usersError;
    
    console.log('\n=== Current master_users holiday values ===');
    users.forEach(user => {
      console.log(`${user.full_name}: holiday_taken=${user.holiday_taken}, approved_holidays_used=${user.approved_holidays_used}`);
    });
    
    // 2. Check the holiday requests data
    const { data: holidayRequests, error: requestsError } = await supabase
      .from('4_holiday_requests')
      .select('id, user_id, total_days, status')
      .eq('status', 'approved');
      
    if (requestsError) throw requestsError;
    
    console.log('\n=== Approved Holiday Requests ===');
    
    // Group requests by user_id and calculate totals
    const userTotals = {};
    holidayRequests.forEach(request => {
      if (!userTotals[request.user_id]) {
        userTotals[request.user_id] = {
          count: 0,
          total_days: 0
        };
      }
      userTotals[request.user_id].count += 1;
      userTotals[request.user_id].total_days += parseFloat(request.total_days) || 0;
    });
    
    // Output the totals
    Object.entries(userTotals).forEach(([userId, data]) => {
      console.log(`User ID ${userId}: ${data.count} requests, ${data.total_days} total days`);
    });
    
    // 3. Run the SQL fix again to ensure data is updated
    console.log('\n=== Running SQL fix to update holiday values ===');
    
    // First create a temp table with holiday totals
    const { error: createTempError } = await supabase.rpc('execute_sql', {
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
      `
    });
    
    if (createTempError) throw createTempError;
    console.log('SQL fix executed successfully.');
    
    // 4. Verify the update worked by checking the values again
    const { data: updatedUsers, error: updatedError } = await supabase
      .from('master_users')
      .select('id, full_name, holiday_taken, approved_holidays_used')
      .order('full_name');
      
    if (updatedError) throw updatedError;
    
    console.log('\n=== Updated master_users holiday values ===');
    updatedUsers.forEach(user => {
      console.log(`${user.full_name}: holiday_taken=${user.holiday_taken}, approved_holidays_used=${user.approved_holidays_used}`);
    });
    
    // 5. Check if any users still have 0 values despite having approved requests
    const problemUsers = updatedUsers.filter(user => {
      const userHolidays = userTotals[user.auth_user_id];
      return (user.holiday_taken === 0 || user.approved_holidays_used === 0) && 
             userHolidays && userHolidays.total_days > 0;
    });
    
    if (problemUsers.length > 0) {
      console.log('\n=== Problem Users (0 values but have approved requests) ===');
      problemUsers.forEach(user => {
        console.log(`${user.full_name}: holiday_taken=${user.holiday_taken}, approved_holidays_used=${user.approved_holidays_used}`);
      });
      
      // 6. Check if there's a mismatch between auth_user_id in master_users and user_id in holiday requests
      console.log('\n=== Checking for auth_user_id mismatches ===');
      
      // For each user with holiday requests, check if they have a matching master_users record
      for (const userId in userTotals) {
        const { data: matchingUsers } = await supabase
          .from('master_users')
          .select('id, full_name, auth_user_id')
          .eq('auth_user_id', userId);
          
        if (!matchingUsers || matchingUsers.length === 0) {
          console.log(`Warning: User ID ${userId} has ${userTotals[userId].total_days} holiday days but no matching master_users record!`);
        }
      }
    } else {
      console.log('\nNo problem users found - all users with approved holidays have correct values.');
    }
    
    console.log('\nHoliday fix verification complete.');
    
  } catch (error) {
    console.error('Error during holiday fix verification:', error);
  }
}

main();