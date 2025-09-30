// Script to identify tables with user data and analyze dependencies
import { createClient } from '@supabase/supabase-js';

// Supabase credentials
const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_ylIhDtikpno4LTTUmpDJvw_Ov7BtIEp'; 
const EMAIL_TO_DELETE = 'ben.howard@stoke.nhs.uk';

// Initialize Supabase client with service key for admin privileges
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  try {
    console.log('Analyzing database schema for user data...');
    
    // Step 1: Find the user in the auth.users table
    console.log(`Looking for user: ${EMAIL_TO_DELETE}`);
    const { data: userData, error: userError } = await supabase
      .rpc('find_user_by_email', { email: EMAIL_TO_DELETE });

    if (userError) {
      console.error('Error finding user:', userError);
      // Try direct query if RPC doesn't work
      const { data: directUserData, error: directUserError } = await supabase
        .from('auth.users')
        .select('id, email')
        .eq('email', EMAIL_TO_DELETE)
        .single();
        
      if (directUserError) {
        console.error('Error with direct user query:', directUserError);
      } else if (directUserData) {
        console.log(`Found user with ID: ${directUserData.id}`);
      }
    } else if (userData) {
      console.log(`Found user with ID: ${userData.id}`);
    }

    // Step 2: List all tables in the database
    console.log('Listing all tables in the database...');
    const { data: tables, error: tablesError } = await supabase
      .rpc('list_tables');
    
    if (tablesError) {
      console.error('Error listing tables:', tablesError);
      // Try alternate approach
      const { data: altTables, error: altTablesError } = await supabase
        .from('information_schema.tables')
        .select('table_schema, table_name')
        .neq('table_schema', 'pg_catalog')
        .neq('table_schema', 'information_schema');
        
      if (altTablesError) {
        console.error('Error with alternate table listing:', altTablesError);
        return;
      } else {
        console.log(`Found ${altTables.length} tables using alternate method`);
      }
    } else {
      console.log(`Found ${tables.length} tables`);
    }
    
    // Step 3: Map potential user-related tables
    console.log('Identifying tables that might contain user data...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('table_schema, table_name, column_name, data_type')
      .or('column_name.ilike.%email%,column_name.ilike.%user%,column_name.eq.email,column_name.eq.user_id');
    
    if (columnsError) {
      console.error('Error getting columns:', columnsError);
      return;
    }
    
    // Group by table and show which tables have user-related columns
    const tableMap = {};
    columns.forEach(col => {
      const tableKey = `${col.table_schema}.${col.table_name}`;
      if (!tableMap[tableKey]) {
        tableMap[tableKey] = [];
      }
      tableMap[tableKey].push({
        column: col.column_name,
        type: col.data_type
      });
    });
    
    console.log('Tables potentially containing user data:');
    Object.entries(tableMap).forEach(([table, columns]) => {
      console.log(`- ${table}`);
      columns.forEach(col => {
        console.log(`  - ${col.column}: ${col.type}`);
      });
    });
    
    // Step 4: Analyze foreign key relationships
    console.log('Analyzing foreign key relationships...');
    const { data: foreignKeys, error: fkError } = await supabase
      .from('information_schema.key_column_usage')
      .select(`
        constraint_name,
        table_schema,
        table_name,
        column_name,
        referenced_table_schema,
        referenced_table_name,
        referenced_column_name
      `)
      .not('referenced_table_name', 'is', null);
    
    if (fkError) {
      console.error('Error getting foreign keys:', fkError);
    } else {
      console.log('Foreign key relationships:');
      foreignKeys.forEach(fk => {
        console.log(`- ${fk.table_schema}.${fk.table_name}.${fk.column_name} references ${fk.referenced_table_schema}.${fk.referenced_table_name}.${fk.referenced_column_name}`);
      });
    }
    
    console.log('Schema analysis complete.');
    
  } catch (error) {
    console.error('Unexpected error during analysis:', error);
  }
}

main();