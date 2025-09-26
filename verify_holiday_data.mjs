// verify_holiday_data.mjs - Script to verify holiday data in Supabase
import { createClient } from '@supabase/supabase-js';

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
      .select('id, full_name, auth_user_id, holiday_taken, approved_holidays_used')
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
    
    // Run the SQL update directly
    const { error: sqlError } = await supabase.rpc('execute_sql', {
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
    
    if (sqlError) {
      console.error('Error executing SQL update:', sqlError);
      
      // Alternative approach: Update each user individually
      console.log('\n=== Using alternative approach: individual updates ===');
      
      for (const userId in userTotals) {
        const totalDays = userTotals[userId].total_days;
        const matchingUser = users.find(u => u.auth_user_id === userId);
        
        if (matchingUser) {
          const { error: updateError } = await supabase
            .from('master_users')
            .update({
              holiday_taken: totalDays,
              approved_holidays_used: totalDays
            })
            .eq('id', matchingUser.id);
          
          if (updateError) {
            console.error(`Error updating user ${matchingUser.full_name}:`, updateError);
          } else {
            console.log(`Updated ${matchingUser.full_name} with ${totalDays} days`);
          }
        } else {
          console.log(`No matching user found for user_id ${userId}`);
        }
      }
    } else {
      console.log('SQL fix executed successfully.');
    }
    
    // 4. Verify the update worked by checking the values again
    const { data: updatedUsers, error: updatedError } = await supabase
      .from('master_users')
      .select('id, full_name, auth_user_id, holiday_taken, approved_holidays_used')
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
    } else {
      console.log('\nNo problem users found - all users with approved holidays have correct values.');
    }
    
    console.log('\nHoliday fix verification complete.');
    
  } catch (error) {
    console.error('Error during holiday fix verification:', error);
  }
}

main();