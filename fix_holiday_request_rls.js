// Function to update RLS permissions for admins on holiday requests
async function fixHolidayRequestRLS() {
  if (!window.supabase) {
    alert('Supabase client not initialized');
    return;
  }

  try {
    // First check if the current user is an admin
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) {
      alert('You must be logged in to run this fix');
      return;
    }

    // Check if user has admin role
    const { data: profile } = await window.supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      alert('You must be an admin to run this fix');
      return;
    }

    // Run the SQL to fix RLS policies
    // Note: This requires an admin user with Postgres policies permission
    // We'll do this in multiple steps to handle any errors individually

    console.log('Starting RLS policy fix for holiday requests...');

    // 1. Enable RLS if not already enabled
    await window.supabase.rpc('admin_enable_rls', { 
      table_name: '4_holiday_requests' 
    });
    
    // 2. Create admin update policy
    const { error: policyError } = await window.supabase.rpc('admin_create_policy', {
      policy_name: 'admin_update_holiday_requests',
      table_name: '4_holiday_requests',
      operation: 'UPDATE',
      policy_using: "EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')",
      policy_check: "EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')"
    });

    if (policyError) {
      console.error('Error creating admin policy:', policyError);
      alert(`Error creating admin policy: ${policyError.message}`);
      return;
    }

    alert('Holiday request permissions fixed successfully! Admins can now approve or reject holiday requests.');
    
    // Reload the page to apply changes
    window.location.reload();
  } catch (error) {
    console.error('Error fixing holiday request RLS:', error);
    alert(`Error fixing permissions: ${error.message}\n\nPlease contact your database administrator to fix the RLS policies manually.`);
  }
}