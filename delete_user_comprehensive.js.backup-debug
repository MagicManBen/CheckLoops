// Script to delete user data from Supabase respecting foreign key relationships
import { createClient } from '@supabase/supabase-js';

// Supabase credentials
const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_ylIhDtikpno4LTTUmpDJvw_Ov7BtIEp'; 
const EMAIL_TO_DELETE = 'ben.howard@stoke.nhs.uk';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  try {
    console.log(`Starting deletion process for user: ${EMAIL_TO_DELETE}`);
    
    // Step 1: Find user ID from auth.users or profiles table
    let userId = null;
    
    // Try profiles table first as it's likely to exist in most Supabase setups
    console.log('Checking profiles table...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_id')
      .eq('email', EMAIL_TO_DELETE)
      .maybeSingle();
      
    if (profileError && !profileError.message.includes('does not exist')) {
      console.error('Error checking profiles table:', profileError);
    } else if (profileData) {
      userId = profileData.user_id || profileData.id;
      console.log(`Found user with ID: ${userId} in profiles table`);
    } else {
      console.log('User not found in profiles table or table does not exist');
    }
    
    // Try auth.users table as fallback
    if (!userId) {
      console.log('Attempting to find user in auth.users table...');
      try {
        const { data, error } = await supabase.rpc('get_user_id_by_email', { user_email: EMAIL_TO_DELETE });
        
        if (error) throw error;
        if (data) {
          userId = data;
          console.log(`Found user with ID: ${userId} in auth.users table`);
        }
      } catch (e) {
        console.log('Custom RPC not available, trying direct query...');
        
        // Direct query as fallback (may not work depending on permissions)
        const { data: authData, error: authError } = await supabase.auth.admin.getUserByEmail(EMAIL_TO_DELETE);
        
        if (authError) {
          console.error('Error finding user in auth tables:', authError);
        } else if (authData) {
          userId = authData.id;
          console.log(`Found user with ID: ${userId} using auth API`);
        }
      }
    }
    
    if (!userId) {
      console.log(`No user ID found. Will only delete rows with email: ${EMAIL_TO_DELETE}`);
    }
    
    // Step 2: Get database schema information for foreign key analysis
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_schema, table_name')
      .neq('table_schema', 'pg_catalog')
      .neq('table_schema', 'information_schema');
    
    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
      return;
    }
    
    console.log(`Found ${tables.length} tables to check`);
    
    // Get foreign key constraints to determine deletion order
    const { data: fkConstraints, error: fkError } = await supabase
      .from('information_schema.table_constraints')
      .select(`
        constraint_name,
        table_schema,
        table_name,
        constraint_type
      `)
      .eq('constraint_type', 'FOREIGN KEY');
    
    if (fkError) {
      console.error('Error fetching foreign key constraints:', fkError);
    } else {
      console.log(`Found ${fkConstraints.length} foreign key constraints`);
    }
    
    // Step 3: Process tables in reverse topological order (child tables first)
    // This is a simplified approach - for complex schemas, we'd need a proper topological sort
    
    // First pass: Process tables that are likely to be leaf nodes (no dependencies)
    console.log('First pass: Processing likely leaf tables...');
    
    for (const table of tables) {
      const tableName = table.table_name;
      const schema = table.table_schema;
      
      // Skip system schemas
      if (['pg_catalog', 'information_schema', 'auth', 'storage'].includes(schema)) {
        continue;
      }
      
      // Check if this table has foreign keys pointing to it
      const isReferenced = fkConstraints && fkConstraints.some(fk => 
        fk.table_schema === schema && fk.table_name === tableName
      );
      
      // If it's not referenced, it's safer to process first
      if (!isReferenced) {
        await deleteUserDataFromTable(schema, tableName, userId, EMAIL_TO_DELETE);
      }
    }
    
    // Second pass: Process all remaining tables
    console.log('Second pass: Processing all remaining tables...');
    
    for (const table of tables) {
      const tableName = table.table_name;
      const schema = table.table_schema;
      
      // Skip system schemas and auth schema
      if (['pg_catalog', 'information_schema'].includes(schema)) {
        continue;
      }
      
      // Process auth schema at the end
      if (schema !== 'auth') {
        await deleteUserDataFromTable(schema, tableName, userId, EMAIL_TO_DELETE);
      }
    }
    
    // Final pass: Try to clean up auth tables if possible
    if (userId) {
      console.log('Final pass: Attempting to clean up auth tables...');
      
      // Try to delete from auth.users using RPC if available
      try {
        const { error: rpcError } = await supabase.rpc('delete_user_by_id', { user_id: userId });
        
        if (rpcError) {
          console.log('Custom RPC not available or failed:', rpcError);
          
          // Direct attempt to auth tables as fallback
          console.log('Attempting direct deletion from auth tables...');
          
          // Try auth.users
          await deleteUserDataFromTable('auth', 'users', userId, EMAIL_TO_DELETE);
          
          // Try other potential auth tables
          await deleteUserDataFromTable('auth', 'identities', userId, EMAIL_TO_DELETE);
          await deleteUserDataFromTable('auth', 'sessions', userId, EMAIL_TO_DELETE);
          await deleteUserDataFromTable('auth', 'refresh_tokens', userId, EMAIL_TO_DELETE);
        } else {
          console.log('Successfully deleted user using custom RPC');
        }
      } catch (e) {
        console.error('Error during auth cleanup:', e);
      }
    }
    
    console.log('Deletion process complete');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

async function deleteUserDataFromTable(schema, tableName, userId, email) {
  try {
    // Check if table exists and get columns
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_schema', schema)
      .eq('table_name', tableName);
    
    if (columnsError) {
      console.error(`Error getting columns for ${schema}.${tableName}:`, columnsError);
      return;
    }
    
    // Skip if no columns found
    if (!columns || columns.length === 0) {
      return;
    }
    
    // Find relevant columns
    const emailColumns = columns.filter(col => 
      ['email', 'user_email', 'mail', 'e_mail'].includes(col.column_name.toLowerCase()) ||
      col.column_name.toLowerCase().includes('email')
    );
    
    const userIdColumns = columns.filter(col => 
      ['user_id', 'userid', 'id', 'uuid'].includes(col.column_name.toLowerCase()) ||
      col.column_name.toLowerCase().includes('user_id') ||
      col.column_name.toLowerCase().includes('userid')
    );
    
    // Delete based on found columns
    let deletedAny = false;
    
    // Try to delete by email
    if (emailColumns.length > 0) {
      for (const col of emailColumns) {
        console.log(`Deleting from ${schema}.${tableName} where ${col.column_name} = '${email}'`);
        
        try {
          // Using RPC for more flexibility with schemas
          const { data, error } = await supabase.rpc('delete_rows_by_email', {
            p_schema: schema,
            p_table: tableName,
            p_column: col.column_name,
            p_email: email
          });
          
          if (error) {
            console.log(`RPC not available, trying direct method for ${schema}.${tableName}`);
            
            // Fall back to direct method
            const { error: directError } = await supabase
              .from(`${tableName}`)
              .delete()
              .eq(col.column_name, email);
            
            if (directError) {
              console.error(`Error deleting from ${schema}.${tableName} by email:`, directError);
            } else {
              console.log(`Successfully deleted from ${schema}.${tableName} by email`);
              deletedAny = true;
            }
          } else {
            console.log(`Successfully deleted from ${schema}.${tableName} by email using RPC`);
            deletedAny = true;
          }
        } catch (e) {
          console.error(`Error during deletion from ${schema}.${tableName}:`, e);
        }
      }
    }
    
    // Try to delete by user ID if available
    if (userId && userIdColumns.length > 0) {
      for (const col of userIdColumns) {
        console.log(`Deleting from ${schema}.${tableName} where ${col.column_name} = '${userId}'`);
        
        try {
          // Using RPC for more flexibility with schemas
          const { data, error } = await supabase.rpc('delete_rows_by_user_id', {
            p_schema: schema,
            p_table: tableName,
            p_column: col.column_name,
            p_user_id: userId
          });
          
          if (error) {
            console.log(`RPC not available, trying direct method for ${schema}.${tableName}`);
            
            // Fall back to direct method
            const { error: directError } = await supabase
              .from(`${tableName}`)
              .delete()
              .eq(col.column_name, userId);
            
            if (directError) {
              console.error(`Error deleting from ${schema}.${tableName} by user ID:`, directError);
            } else {
              console.log(`Successfully deleted from ${schema}.${tableName} by user ID`);
              deletedAny = true;
            }
          } else {
            console.log(`Successfully deleted from ${schema}.${tableName} by user ID using RPC`);
            deletedAny = true;
          }
        } catch (e) {
          console.error(`Error during deletion from ${schema}.${tableName}:`, e);
        }
      }
    }
    
    if (!deletedAny) {
      console.log(`No relevant columns found in ${schema}.${tableName} or deletion failed`);
    }
  } catch (error) {
    console.error(`Error processing table ${schema}.${tableName}:`, error);
  }
}

// Create the necessary RPCs for cross-schema operations
async function createHelperFunctions() {
  try {
    // Create RPC to find user by email
    const findUserRpc = `
    CREATE OR REPLACE FUNCTION get_user_id_by_email(user_email TEXT) 
    RETURNS UUID AS $$
    DECLARE
      user_id UUID;
    BEGIN
      SELECT id INTO user_id FROM auth.users WHERE email = user_email LIMIT 1;
      RETURN user_id;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    // Create RPC to delete rows by email
    const deleteByEmailRpc = `
    CREATE OR REPLACE FUNCTION delete_rows_by_email(
      p_schema TEXT,
      p_table TEXT,
      p_column TEXT,
      p_email TEXT
    ) RETURNS VOID AS $$
    DECLARE
      stmt TEXT;
    BEGIN
      stmt := format('DELETE FROM %I.%I WHERE %I = %L', 
                     p_schema, p_table, p_column, p_email);
      EXECUTE stmt;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    // Create RPC to delete rows by user ID
    const deleteByUserIdRpc = `
    CREATE OR REPLACE FUNCTION delete_rows_by_user_id(
      p_schema TEXT,
      p_table TEXT,
      p_column TEXT,
      p_user_id UUID
    ) RETURNS VOID AS $$
    DECLARE
      stmt TEXT;
    BEGIN
      stmt := format('DELETE FROM %I.%I WHERE %I = %L', 
                     p_schema, p_table, p_column, p_user_id);
      EXECUTE stmt;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    // Create RPC to delete user
    const deleteUserRpc = `
    CREATE OR REPLACE FUNCTION delete_user_by_id(user_id UUID) 
    RETURNS VOID AS $$
    BEGIN
      -- Delete from auth tables
      DELETE FROM auth.refresh_tokens WHERE user_id = $1;
      DELETE FROM auth.sessions WHERE user_id = $1;
      DELETE FROM auth.identities WHERE user_id = $1;
      DELETE FROM auth.users WHERE id = $1;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    // Try to create the RPCs
    console.log('Setting up helper functions...');
    
    // Using direct SQL query since supabase.rpc doesn't support DDL
    const { error: error1 } = await supabase.rpc('exec_sql', { sql: findUserRpc });
    const { error: error2 } = await supabase.rpc('exec_sql', { sql: deleteByEmailRpc });
    const { error: error3 } = await supabase.rpc('exec_sql', { sql: deleteByUserIdRpc });
    const { error: error4 } = await supabase.rpc('exec_sql', { sql: deleteUserRpc });
    
    if (error1 || error2 || error3 || error4) {
      console.log('Could not create all helper functions. Will use fallback methods.');
      console.log('Errors:', error1, error2, error3, error4);
    } else {
      console.log('Helper functions created successfully');
    }
  } catch (error) {
    console.error('Error creating helper functions:', error);
    console.log('Will use fallback methods for deletion');
  }
}

// First create helper functions, then run main
createHelperFunctions()
  .then(() => main())
  .catch(err => console.error('Fatal error:', err));