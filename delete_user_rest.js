// Script to delete user data from Supabase using REST API
import fetch from 'node-fetch';

// Supabase credentials (read from environment for security)
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://unveoqnlqnobufhublyw.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const EMAIL_TO_DELETE = process.env.EMAIL_TO_DELETE || 'ben.howard@stoke.nhs.uk';

async function main() {
  if (!SUPABASE_SERVICE_KEY) {
    console.error('Missing Supabase service key. Set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY in the environment.');
    process.exit(1);
  }

  console.log(`Starting deletion process for user: ${EMAIL_TO_DELETE}`);
  
  // Step 1: Find user ID from auth.users
  console.log('Finding user ID...');
  let userId = null;
  
  try {
    const authUserResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/get_user_by_email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        },
        body: JSON.stringify({ email: EMAIL_TO_DELETE })
      }
    );
    
    if (authUserResponse.ok) {
      const userData = await authUserResponse.json();
      if (userData && userData.id) {
        userId = userData.id;
        console.log(`Found user with ID: ${userId}`);
      }
    } else {
      console.log('RPC not available, trying alternative method...');
      
      // Try to find user in profiles table as fallback
      const profilesResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(EMAIL_TO_DELETE)}`,
        {
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
          }
        }
      );
      
      if (profilesResponse.ok) {
        const profiles = await profilesResponse.json();
        if (profiles && profiles.length > 0) {
          userId = profiles[0].user_id || profiles[0].id;
          console.log(`Found user with ID: ${userId} in profiles table`);
        }
      }
    }
    
    if (!userId) {
      console.log(`No user ID found. Will only delete rows with email: ${EMAIL_TO_DELETE}`);
    }
    
    // Step 2: Get list of tables
    console.log('Getting list of tables...');
    const tablesResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/list_all_tables`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        },
        body: JSON.stringify({})
      }
    );
    
    let tables = [];
    if (tablesResponse.ok) {
      tables = await tablesResponse.json();
      console.log(`Found ${tables.length} tables`);
    } else {
      // Fallback: Try some common table names
      console.log('Could not get table list. Will try common tables...');
      tables = [
        { schema: 'public', name: 'profiles' },
        { schema: 'public', name: 'users' },
        { schema: 'public', name: 'user_profiles' },
        { schema: 'public', name: 'auth_users' },
        { schema: 'public', name: 'staff' },
        { schema: 'public', name: 'employees' },
        { schema: 'auth', name: 'users' }
      ];
    }
    
    // Step 3: Process each table
    for (const table of tables) {
      const schema = table.schema || 'public';
      const tableName = table.name || table.table_name;
      
      // Skip system schemas
      if (['pg_catalog', 'information_schema'].includes(schema)) {
        continue;
      }
      
      console.log(`Processing ${schema}.${tableName}...`);
      
      // Try to delete by email
      try {
        const emailDeleteResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/${tableName}?email=eq.${encodeURIComponent(EMAIL_TO_DELETE)}`,
          {
            method: 'DELETE',
            headers: {
              'apikey': SUPABASE_SERVICE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
            }
          }
        );
        
        if (emailDeleteResponse.ok) {
          console.log(`Deleted rows from ${schema}.${tableName} by email`);
        }
      } catch (error) {
        console.log(`No email column in ${schema}.${tableName} or other error: ${error.message}`);
      }
      
      // Try email variations
      const emailVariations = ['user_email', 'userEmail', 'email_address'];
      for (const emailCol of emailVariations) {
        try {
          const emailVarDeleteResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/${tableName}?${emailCol}=eq.${encodeURIComponent(EMAIL_TO_DELETE)}`,
            {
              method: 'DELETE',
              headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
              }
            }
          );
          
          if (emailVarDeleteResponse.ok) {
            console.log(`Deleted rows from ${schema}.${tableName} by ${emailCol}`);
          }
        } catch (error) {
          // Silently continue if this variation doesn't exist
        }
      }
      
      // If we found a user ID, try to delete by user_id
      if (userId) {
        try {
          const userIdDeleteResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/${tableName}?user_id=eq.${encodeURIComponent(userId)}`,
            {
              method: 'DELETE',
              headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
              }
            }
          );
          
          if (userIdDeleteResponse.ok) {
            console.log(`Deleted rows from ${schema}.${tableName} by user_id`);
          }
        } catch (error) {
          console.log(`No user_id column in ${schema}.${tableName} or other error: ${error.message}`);
        }
        
        // Try ID variations
        const idVariations = ['userId', 'userid', 'user'];
        for (const idCol of idVariations) {
          try {
            const idVarDeleteResponse = await fetch(
              `${SUPABASE_URL}/rest/v1/${tableName}?${idCol}=eq.${encodeURIComponent(userId)}`,
              {
                method: 'DELETE',
                headers: {
                  'apikey': SUPABASE_SERVICE_KEY,
                  'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
                }
              }
            );
            
            if (idVarDeleteResponse.ok) {
              console.log(`Deleted rows from ${schema}.${tableName} by ${idCol}`);
            }
          } catch (error) {
            // Silently continue if this variation doesn't exist
          }
        }
      }
    }
    
    // Step 4: If userId found, try to delete from auth tables using special RPC
    if (userId) {
      console.log('Attempting to delete user from auth tables...');
      
      try {
        const deleteAuthResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/rpc/delete_user`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_SERVICE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
            },
            body: JSON.stringify({ user_id: userId })
          }
        );
        
        if (deleteAuthResponse.ok) {
          console.log('Successfully deleted user from auth tables');
        } else {
          console.log('Could not delete from auth tables directly - may require additional permissions');
        }
      } catch (error) {
        console.error('Error deleting from auth tables:', error.message);
      }
    }
    
    console.log('Deletion process completed');
  } catch (error) {
    console.error('Error during deletion process:', error);
  }
}

main().catch(err => console.error('Fatal error:', err));