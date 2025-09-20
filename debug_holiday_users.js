// Debug script to help diagnose holiday user name issues
// This can be pasted into the browser console on the admin dashboard or my-holidays page

(async function() {
  if (!window.supabase) {
    console.error('Error: Supabase not initialized');
    return;
  }
  
  console.group('Holiday User Name Debug Tool');
  console.log('Checking holiday request user names...');
  
  // 1. Check view definition is correct
  try {
    const { data: holidayView } = await supabase.rpc('admin_get_view_definition', {
      view_name: 'v_holiday_requests_with_user'
    });
    
    console.log('View definition:', holidayView);
  } catch (err) {
    console.warn('Could not check view definition:', err);
  }
  
  // 2. Check a sample of holiday requests
  const { data: requests } = await supabase
    .from('4_holiday_requests')
    .select('*')
    .limit(5);
    
  console.log('Sample requests:', requests);
  
  // 3. Get user info for these requests
  if (requests && requests.length > 0) {
    const userIds = requests.map(r => r.user_id);
    
    const { data: users } = await supabase
      .from('master_users')
      .select('id, auth_user_id, full_name, email')
      .in('auth_user_id', userIds);
      
    console.log('Associated users:', users);
    
    // 4. Check for mismatches
    for (const req of requests) {
      const user = users.find(u => u.auth_user_id === req.user_id);
      console.log(`Request ${req.id} (${req.start_date} - ${req.end_date}):`);
      console.log(`  User ID: ${req.user_id}`);
      console.log(`  Found matching user: ${user ? 'Yes' : 'NO'}`);
      if (user) {
        console.log(`  Name: ${user.full_name}, Email: ${user.email}`);
      } else {
        console.log('  MISSING USER INFORMATION');
      }
    }
  }
  
  // 5. Check the view output directly
  const { data: viewData } = await supabase
    .from('v_holiday_requests_with_user')
    .select('id, user_id, start_date, end_date, full_name, email')
    .limit(5);
    
  console.log('View data (should include names):', viewData);
  
  console.groupEnd();
})();
