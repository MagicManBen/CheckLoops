// Fix script for the overlap warning issue in my-holidays.html
// This script fixes the issue where user names appear as "User a995b5..." in the overlap warnings

(async function() {
  try {
    const { createClient } = supabase;
    // Init Supabase client using the URL and key from localStorage
    const supabaseUrl = localStorage.getItem('supabase_url');
    const supabaseKey = localStorage.getItem('supabase_key');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials not found in localStorage');
      return;
    }
    
    const sb = createClient(supabaseUrl, supabaseKey);
    
    // Check authentication
    const { data: { session } } = await sb.auth.getSession();
    if (!session) {
      console.error('No active session');
      return;
    }
    
    console.log('Running overlap user name fix...');
    
    // 1. First check if the view exists
    const { data: viewCheck, error: viewError } = await sb.rpc('check_if_view_exists', { view_name: 'v_holiday_requests_with_user' });
    
    if (viewError) {
      console.error('Error checking view:', viewError);
      return;
    }
    
    if (!viewCheck) {
      console.log('Creating view for holiday requests with user details...');
      
      // Create the view that properly joins user information
      const createViewSQL = `
        CREATE OR REPLACE VIEW v_holiday_requests_with_user AS
        SELECT 
          hr.*,
          mu.full_name,
          mu.email,
          mu.avatar_url
        FROM 
          "4_holiday_requests" hr
        LEFT JOIN 
          "master_users" mu ON hr.user_id = mu.auth_user_id
      `;
      
      const { error: createError } = await sb.rpc('run_sql', { sql_query: createViewSQL });
      
      if (createError) {
        console.error('Error creating view:', createError);
        return;
      }
      
      console.log('View created successfully');
    } else {
      console.log('View already exists, checking for correctness...');
      
      // Verify the view has the correct join condition
      const checkViewSQL = `
        SELECT pg_get_viewdef('v_holiday_requests_with_user'::regclass)::text AS view_definition
      `;
      
      const { data: viewDef, error: defError } = await sb.rpc('run_sql', { sql_query: checkViewSQL });
      
      if (defError) {
        console.error('Error checking view definition:', defError);
        return;
      }
      
      const viewDefText = viewDef[0]?.view_definition || '';
      const hasCorrectJoin = viewDefText.includes('hr.user_id = mu.auth_user_id');
      
      if (!hasCorrectJoin) {
        console.log('View has incorrect join, updating...');
        
        // Update the view with the correct join
        const updateViewSQL = `
          CREATE OR REPLACE VIEW v_holiday_requests_with_user AS
          SELECT 
            hr.*,
            mu.full_name,
            mu.email,
            mu.avatar_url
          FROM 
            "4_holiday_requests" hr
          LEFT JOIN 
            "master_users" mu ON hr.user_id = mu.auth_user_id
        `;
        
        const { error: updateError } = await sb.rpc('run_sql', { sql_query: updateViewSQL });
        
        if (updateError) {
          console.error('Error updating view:', updateError);
          return;
        }
        
        console.log('View updated successfully');
      } else {
        console.log('View is correctly configured');
      }
    }
    
    // 2. Now let's check for any holiday requests with missing user names
    const { data: missingUsers, error: missingError } = await sb.from('4_holiday_requests')
      .select('id, user_id')
      .not('user_id', 'is', null);
    
    if (missingError) {
      console.error('Error checking for missing users:', missingError);
      return;
    }
    
    console.log(`Found ${missingUsers.length} holiday requests to check`);
    
    // Collect all user_ids
    const userIds = [...new Set(missingUsers.map(r => r.user_id))];
    
    // 3. Check which users exist in master_users
    const { data: existingUsers, error: existingError } = await sb
      .from('master_users')
      .select('auth_user_id, full_name, email')
      .in('auth_user_id', userIds);
    
    if (existingError) {
      console.error('Error checking existing users:', existingError);
      return;
    }
    
    const existingIds = existingUsers.map(u => u.auth_user_id);
    const missingIds = userIds.filter(id => !existingIds.includes(id));
    
    console.log(`Found ${existingUsers.length} users with profiles`);
    console.log(`Found ${missingIds.length} users without profiles`);
    
    // 4. For any missing users, check auth.users to get at least their email
    if (missingIds.length > 0) {
      console.log('Retrieving user details from auth.users for missing profiles...');
      
      try {
        // This requires admin access, might not work for all users
        const { data: authUsers, error: authError } = await sb.rpc('get_auth_users_by_ids', { 
          user_ids: missingIds 
        });
        
        if (authError) {
          console.error('Error getting auth users:', authError);
        } else if (authUsers && authUsers.length > 0) {
          console.log(`Found ${authUsers.length} users in auth.users`);
          
          // Create master_users entries for any missing users
          for (const authUser of authUsers) {
            const { email, id } = authUser;
            
            console.log(`Creating master_users entry for ${email} (${id})`);
            
            const { error: insertError } = await sb
              .from('master_users')
              .insert({
                auth_user_id: id,
                email: email,
                full_name: email.split('@')[0].split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' '),
                role: 'staff',
                access_type: 'staff'
              });
            
            if (insertError) {
              console.error(`Error creating profile for ${email}:`, insertError);
            }
          }
        }
      } catch (e) {
        console.error('Error accessing auth.users:', e);
      }
    }
    
    console.log('Overlap user name fix completed');
    console.log('Please refresh the page to see the changes');
    
  } catch (err) {
    console.error('Unexpected error in fix script:', err);
  }
})();