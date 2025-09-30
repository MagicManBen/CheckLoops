import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseKey = 'sb_secret_ylIhDtikpno4LTTUmpDJvw_Ov7BtIEp';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixHolidayTaken() {
  try {
    console.log('Starting holiday_taken fix...');
    
    // First, get all users with their holiday_taken and approved_holidays_used values
    const { data: users, error: userError } = await supabase
      .from('master_users')
      .select('id, auth_user_id, full_name, is_gp, holiday_taken, approved_holidays_used');
      
    if (userError) {
      console.error('Error fetching users:', userError);
      return;
    }
    
    console.log(`Found ${users.length} users`);
    
    // Get all approved holiday requests
    const { data: holidays, error: holidayError } = await supabase
      .from('4_holiday_requests')
      .select('*')
      .eq('status', 'approved');
      
    if (holidayError) {
      console.error('Error fetching holidays:', holidayError);
      return;
    }
    
    console.log(`Found ${holidays.length} approved holiday requests`);
    
    // Group holidays by user_id
    const holidaysByUser = {};
    holidays.forEach(holiday => {
      const userId = holiday.user_id;
      if (!userId) return;
      
      if (!holidaysByUser[userId]) {
        holidaysByUser[userId] = [];
      }
      
      holidaysByUser[userId].push(holiday);
    });
    
    // Calculate total days for each user
    let updateCount = 0;
    for (const user of users) {
      const userId = user.auth_user_id || user.id;
      const userHolidays = holidaysByUser[userId] || [];
      
      if (userHolidays.length > 0) {
        // Calculate total days
        let totalDays = 0;
        userHolidays.forEach(holiday => {
          totalDays += holiday.total_days || 0;
        });
        
        console.log(`${user.full_name}: ${userHolidays.length} approved holidays, ${totalDays} total days`);
        
        // If holiday_taken is 0 but we have holidays, update it
        if ((user.holiday_taken === 0 || user.holiday_taken === null) && totalDays > 0) {
          console.log(`${user.full_name} needs updating: holiday_taken: ${user.holiday_taken}, calculated: ${totalDays}`);
          updateCount++;
        }
      }
    }
    
    console.log(`\nFound ${updateCount} users that need holiday_taken updates`);
    
    // Test update SQL
    console.log('\nSQL to update holiday_taken:');
    console.log(`
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
        AND (mu.holiday_taken = 0 OR mu.holiday_taken IS NULL)
        AND ht.total_days > 0
    `);
  } catch (error) {
    console.error('Error:', error);
  }
}

fixHolidayTaken();