// Create a proper database function to check for missing users
// and sync them between auth.users and master_users

// This file should be run once to set up the RPC function
// in Supabase, which can then be used by other scripts

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
    
    console.log('Creating sync_users_from_auth function...');
    
    // Create the database function
    const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION sync_users_from_auth()
    RETURNS TABLE (
      user_id UUID,
      email TEXT,
      full_name TEXT,
      status TEXT
    ) 
    SECURITY DEFINER
    AS $$
    DECLARE
      auth_user RECORD;
      master_user RECORD;
      action_taken TEXT;
      normalized_name TEXT;
    BEGIN
      -- Loop through all users in auth.users
      FOR auth_user IN 
        SELECT id, email, raw_user_meta_data
        FROM auth.users
      LOOP
        -- Check if user exists in master_users
        SELECT * INTO master_user 
        FROM master_users 
        WHERE auth_user_id = auth_user.id;
        
        -- Default action
        action_taken := 'no_action';
        
        -- Extract name from email if no better source
        normalized_name := REGEXP_REPLACE(
          INITCAP(REPLACE(SPLIT_PART(auth_user.email, '@', 1), '.', ' ')),
          '([a-z])([A-Z])', '\\1 \\2'
        );
        
        -- If user doesn't exist in master_users, create entry
        IF master_user IS NULL THEN
          INSERT INTO master_users (
            auth_user_id,
            email,
            full_name,
            role,
            access_type
          ) VALUES (
            auth_user.id,
            auth_user.email,
            normalized_name,
            'staff',
            'staff'
          );
          action_taken := 'created';
        -- If user exists but missing name, update
        ELSIF master_user.full_name IS NULL OR master_user.full_name = '' THEN
          UPDATE master_users
          SET full_name = normalized_name
          WHERE auth_user_id = auth_user.id;
          action_taken := 'updated_name';
        -- If email doesn't match, update
        ELSIF master_user.email != auth_user.email THEN
          UPDATE master_users
          SET email = auth_user.email
          WHERE auth_user_id = auth_user.id;
          action_taken := 'updated_email';
        END IF;
        
        -- Return result for this user
        user_id := auth_user.id;
        email := auth_user.email;
        full_name := COALESCE(master_user.full_name, normalized_name);
        status := action_taken;
        RETURN NEXT;
      END LOOP;
      
      RETURN;
    END;
    $$ LANGUAGE plpgsql;
    `;
    
    const { error: createError } = await sb.rpc('run_sql', { sql_query: createFunctionSQL });
    
    if (createError) {
      console.error('Error creating function:', createError);
      return;
    }
    
    console.log('Function created successfully');
    console.log('Running sync_users_from_auth to fix missing user entries...');
    
    // Execute the function to sync users
    const { data: syncResult, error: syncError } = await sb.rpc('sync_users_from_auth');
    
    if (syncError) {
      console.error('Error running sync:', syncError);
      return;
    }
    
    console.log('Sync completed successfully');
    console.log('Result:', syncResult);
    
    // Log stats
    const created = syncResult.filter(r => r.status === 'created').length;
    const updatedName = syncResult.filter(r => r.status === 'updated_name').length;
    const updatedEmail = syncResult.filter(r => r.status === 'updated_email').length;
    
    console.log(`Created ${created} new user entries`);
    console.log(`Updated ${updatedName} names`);
    console.log(`Updated ${updatedEmail} emails`);
    
  } catch (err) {
    console.error('Unexpected error in script:', err);
  }
})();