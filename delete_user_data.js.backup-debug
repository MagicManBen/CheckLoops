// Script to delete all data for a specific user from Supabase
import { createClient } from '@supabase/supabase-js';

// Supabase credentials
const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_ylIhDtikpno4LTTUmpDJvw_Ov7BtIEp'; 
const EMAIL_TO_DELETE = 'ben.howard@stoke.nhs.uk';

// Initialize Supabase client with service key for admin privileges
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  try {
    console.log(`Starting deletion process for user: ${EMAIL_TO_DELETE}`);
    
    // Step 1: Find the user's ID from the auth.users table
    const { data: userData, error: userError } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', EMAIL_TO_DELETE)
      .single();

    if (userError) {
      console.error('Error finding user:', userError);
      console.log('Continuing with other tables that might use email directly...');
    } else if (userData) {
      console.log(`Found user with ID: ${userData.id}`);
    }

    // Step 2: List all tables in the database
    const { data: tables, error: tablesError } = await supabase
      .rpc('list_tables');

    if (tablesError) {
      console.error('Error listing tables:', tablesError);
      return;
    }

    console.log(`Found ${tables.length} tables to check`);

    // Step 3: For each table, check if it has user-related columns and delete matching rows
    for (const table of tables) {
      const tableName = table.table_name;
      const schema = table.table_schema;
      
      // Skip system tables
      if (schema === 'pg_catalog' || schema === 'information_schema') {
        continue;
      }

      try {
        // Get table columns to check for user-related fields
        const { data: columns, error: columnsError } = await supabase
          .rpc('list_columns', { table_name: tableName, table_schema: schema });
          
        if (columnsError) {
          console.error(`Error getting columns for ${schema}.${tableName}:`, columnsError);
          continue;
        }

        // Check for email column
        const emailColumn = columns.find(col => 
          col.column_name.toLowerCase().includes('email') || 
          col.column_name.toLowerCase() === 'email'
        );

        // Check for user_id column
        const userIdColumn = columns.find(col => 
          col.column_name.toLowerCase().includes('user_id') || 
          col.column_name.toLowerCase() === 'user_id' ||
          col.column_name.toLowerCase() === 'userid'
        );

        // Delete by email if that column exists
        if (emailColumn) {
          console.log(`Deleting from ${schema}.${tableName} where ${emailColumn.column_name} = '${EMAIL_TO_DELETE}'`);
          
          const { error: deleteError } = await supabase
            .from(`${schema}.${tableName}`)
            .delete()
            .eq(emailColumn.column_name, EMAIL_TO_DELETE);
            
          if (deleteError) {
            console.error(`Error deleting from ${schema}.${tableName} by email:`, deleteError);
          } else {
            console.log(`Successfully deleted matching rows from ${schema}.${tableName} by email`);
          }
        }
        
        // Delete by user ID if we found the user and that column exists
        if (userIdColumn && userData) {
          console.log(`Deleting from ${schema}.${tableName} where ${userIdColumn.column_name} = '${userData.id}'`);
          
          const { error: deleteError } = await supabase
            .from(`${schema}.${tableName}`)
            .delete()
            .eq(userIdColumn.column_name, userData.id);
            
          if (deleteError) {
            console.error(`Error deleting from ${schema}.${tableName} by user ID:`, deleteError);
          } else {
            console.log(`Successfully deleted matching rows from ${schema}.${tableName} by user ID`);
          }
        }
        
        // If neither column exists, log that we're skipping the table
        if (!emailColumn && !userIdColumn) {
          console.log(`Skipping ${schema}.${tableName} - no user-related columns found`);
        }
      } catch (error) {
        console.error(`Error processing table ${schema}.${tableName}:`, error);
      }
    }
    
    // Final step: Attempt to delete from auth.users table if the user was found
    if (userData) {
      console.log(`Attempting to delete user from auth.users with ID: ${userData.id}`);
      
      // Using raw SQL via RPC for auth tables which might not be accessible via the standard API
      const { error: authDeleteError } = await supabase.rpc('delete_auth_user', { user_id: userData.id });
      
      if (authDeleteError) {
        console.error('Error deleting from auth.users:', authDeleteError);
      } else {
        console.log('Successfully deleted user from auth.users');
      }
    }

    console.log('Data deletion process completed');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

main();