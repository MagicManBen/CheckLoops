// fix_holiday_data.mjs - Direct Fix Script - Connects to Supabase and fixes the holiday data issue
import { createClient } from '@supabase/supabase-js';

// Supabase connection details from your input
const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseKey = 'sb_secret_ylIhDtikpno4LTTUmpDJvw_Ov7BtIEp';

async function fixHolidayData() {
  console.log('🔄 Starting holiday data fix process...');
  
  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Step 1: Verify connection and check current data
    console.log('✅ Connected to Supabase');
    console.log('📊 Checking current holiday data...');
    
    // Get current holiday data from master_users
    const { data: users, error: usersError } = await supabase
      .from('master_users')
      .select('id, auth_user_id, full_name, holiday_taken, approved_holidays_used')
      .order('full_name');
    
    if (usersError) throw usersError;
    
    console.log(`Found ${users.length} users in master_users table`);
    
    // Get approved holiday requests
    const { data: requests, error: requestsError } = await supabase
      .from('4_holiday_requests')
      .select('id, user_id, total_days, status')
      .eq('status', 'approved');
    
    if (requestsError) throw requestsError;
    
    console.log(`Found ${requests.length} approved holiday requests`);
    
    // Calculate holiday totals for each user
    const userHolidays = {};
    requests.forEach(req => {
      if (!userHolidays[req.user_id]) {
        userHolidays[req.user_id] = 0;
      }
      userHolidays[req.user_id] += parseFloat(req.total_days) || 0;
    });
    
    // Step 2: Fix the data with a direct SQL update
    console.log('🔧 Running SQL fix to update holiday values...');
    
    const { error: updateError } = await supabase.rpc('execute_sql', {
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
        mu.auth_user_id = ht.user_id;
      `
    });
    
    if (updateError) {
      console.error('Error running SQL update:', updateError);
      
      // Fallback approach: Update each user individually
      console.log('⚠️ SQL update failed, trying alternative approach...');
      
      let successCount = 0;
      for (const userId in userHolidays) {
        const totalDays = userHolidays[userId];
        
        // Find matching user in master_users
        const matchingUser = users.find(u => u.auth_user_id === userId);
        if (!matchingUser) {
          console.warn(`⚠️ No master_users entry found for user_id ${userId}`);
          continue;
        }
        
        // Update the user's holiday values
        const { error: userUpdateError } = await supabase
          .from('master_users')
          .update({
            holiday_taken: totalDays,
            approved_holidays_used: totalDays
          })
          .eq('id', matchingUser.id);
        
        if (userUpdateError) {
          console.error(`Error updating user ${matchingUser.full_name}:`, userUpdateError);
        } else {
          successCount++;
        }
      }
      
      console.log(`✅ Updated ${successCount} users with individual updates`);
    } else {
      console.log('✅ SQL update completed successfully');
    }
    
    // Step 3: Verify the update worked
    const { data: updatedUsers, error: verifyError } = await supabase
      .from('master_users')
      .select('id, auth_user_id, full_name, holiday_taken, approved_holidays_used')
      .order('full_name');
    
    if (verifyError) throw verifyError;
    
    // Check for any remaining issues
    let hasIssues = false;
    console.log('\n📊 Final holiday values:');
    
    updatedUsers.forEach(user => {
      const userRequests = requests.filter(req => req.user_id === user.auth_user_id);
      const calculatedTotal = userRequests.reduce((sum, req) => sum + (parseFloat(req.total_days) || 0), 0);
      
      const holidayMatch = Math.abs((user.holiday_taken || 0) - calculatedTotal) < 0.01;
      const approvedMatch = Math.abs((user.approved_holidays_used || 0) - calculatedTotal) < 0.01;
      
      if (userRequests.length > 0) {
        const status = holidayMatch && approvedMatch ? '✅' : '❌';
        console.log(`${status} ${user.full_name}: holiday_taken=${user.holiday_taken}, approved_holidays_used=${user.approved_holidays_used}, calculated=${calculatedTotal}`);
        
        if (!holidayMatch || !approvedMatch) {
          hasIssues = true;
        }
      }
    });
    
    if (hasIssues) {
      console.log('\n⚠️ Some users still have issues with their holiday data.');
      console.log('Please run the admin dashboard fix to refresh the UI display.');
    } else {
      console.log('\n✅ All holiday data has been fixed successfully!');
      console.log('Please refresh your admin dashboard to see the updated values.');
    }
    
  } catch (error) {
    console.error('❌ Error fixing holiday data:', error);
  }
}

fixHolidayData();