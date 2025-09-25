// Script to debug the structure of the 4_holiday_requests table
console.log("DEBUG: Holiday Requests Structure - Running...");

async function debugHolidayRequests() {
  if (!window.supabase) {
    console.error("Supabase client not initialized");
    return;
  }
  
  try {
    console.log("Checking for Ben Howard's user ID in master_users...");
    const { data: users, error: usersError } = await window.supabase
      .from('master_users')
      .select('id, auth_user_id, full_name')
      .ilike('full_name', '%Ben Howard%');
      
    if (usersError) {
      console.error("Error fetching users:", usersError);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log("No users found with name Ben Howard");
      return;
    }
    
    console.log("Found users:", users);
    
    // For each user that could be Ben Howard
    for (const user of users) {
      console.log(`Checking holiday requests for user ${user.full_name} (auth_user_id: ${user.auth_user_id})`);
      
      // Check holiday requests
      const { data: requests, error: requestsError } = await window.supabase
        .from('4_holiday_requests')
        .select('*')
        .eq('user_id', user.auth_user_id);
        
      if (requestsError) {
        console.error(`Error fetching requests for ${user.full_name}:`, requestsError);
        continue;
      }
      
      console.log(`Found ${requests?.length || 0} holiday requests for ${user.full_name}`);
      console.log("Sample request data:", requests && requests.length > 0 ? requests[0] : "No requests");
      
      if (requests && requests.length > 0) {
        // Calculate total hours/sessions
        let totalHours = 0;
        let totalSessions = 0;
        
        requests.forEach(req => {
          const startDate = new Date(req.start_date);
          const endDate = new Date(req.end_date);
          const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
          
          if (req.hours_per_day) {
            totalHours += parseFloat(req.hours_per_day) * days;
          }
          
          if (req.sessions_per_day) {
            totalSessions += parseFloat(req.sessions_per_day) * days;
          }
        });
        
        console.log(`Total calculated: ${totalHours} hours, ${totalSessions} sessions`);
        
        // Check if these values match what's in master_users
        const { data: updatedUser, error: updateError } = await window.supabase
          .from('master_users')
          .select('holidays_used_hours, holidays_used_sessions')
          .eq('auth_user_id', user.auth_user_id)
          .single();
          
        if (updateError) {
          console.error("Error checking user holiday data:", updateError);
        } else {
          console.log("Current user holiday data:", updatedUser);
          
          const needsUpdate = (updatedUser.holidays_used_hours !== totalHours || 
                              updatedUser.holidays_used_sessions !== totalSessions);
                              
          console.log(`User needs update: ${needsUpdate}`);
        }
      }
    }
  } catch (error) {
    console.error("Error in debug script:", error);
  }
}

// Run the debug function
debugHolidayRequests();

// Also check if the holiday_used fields exist in master_users
async function checkTableColumns() {
  try {
    // Check if the holidays_used fields exist in the master_users table
    const { data, error } = await window.supabase.rpc('admin_check_column_exists', {
      p_table_name: 'master_users',
      p_column_name: 'holidays_used_hours'
    });
    
    if (error) {
      console.error("Error checking column existence:", error);
      return;
    }
    
    console.log(`holidays_used_hours column exists: ${data || false}`);
    
    // Also check for sessions column
    const { data: sessionsData, error: sessionsError } = await window.supabase.rpc('admin_check_column_exists', {
      p_table_name: 'master_users',
      p_column_name: 'holidays_used_sessions'
    });
    
    if (sessionsError) {
      console.error("Error checking column existence:", sessionsError);
      return;
    }
    
    console.log(`holidays_used_sessions column exists: ${sessionsData || false}`);
    
  } catch (error) {
    console.error("Error checking table columns:", error);
  }
}

// Run the column check
setTimeout(() => {
  console.log("Checking database columns...");
  checkTableColumns();
}, 500);