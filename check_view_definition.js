// Script to check Supabase view definition
const { createClient } = require('@supabase/supabase-js');

// Supabase URL and key from your provided information
const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseServiceKey = 'sb_secret_ylIhDtikpno4LTTUmpDJvw_Ov7BtIEp';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getViewDefinition(viewName) {
  console.log(`Fetching definition for view: ${viewName}`);
  
  try {
    // Query to get the view definition from pg_views
    const { data, error } = await supabase
      .from('pg_views')
      .select('*')
      .eq('viewname', viewName)
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching view definition:', error);
      
      // Try alternative approach with RPC call
      console.log('Trying alternative approach...');
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_view_definition', { view_name: viewName });
      
      if (rpcError) {
        console.error('RPC Error:', rpcError);
        
        // Try raw SQL as a final approach
        console.log('Trying raw SQL approach...');
        const { data: sqlData, error: sqlError } = await supabase
          .rpc('execute_sql', { 
            query: `SELECT definition FROM pg_views WHERE viewname = '${viewName}'` 
          });
          
        if (sqlError) {
          console.error('SQL Error:', sqlError);
          return null;
        }
        
        return sqlData;
      }
      
      return rpcData;
    }

    return data;
  } catch (err) {
    console.error('Exception:', err);
    return null;
  }
}

async function listAllTables() {
  console.log('Listing all tables in the database...');
  
  try {
    // Query to get all tables from the information schema
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('*')
      .eq('table_schema', 'public');

    if (error) {
      console.error('Error listing tables:', error);
      
      // Try alternative approach
      console.log('Trying alternative approach to list tables...');
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('list_all_tables');
        
      if (rpcError) {
        console.error('RPC Error:', rpcError);
        
        // Try raw SQL
        const { data: sqlData, error: sqlError } = await supabase
          .rpc('execute_sql', {
            query: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
          });
          
        if (sqlError) {
          console.error('SQL Error:', sqlError);
          return null;
        }
        
        return sqlData;
      }
      
      return rpcData;
    }

    return data;
  } catch (err) {
    console.error('Exception:', err);
    return null;
  }
}

// Main execution
async function main() {
  // Get the view definition
  const viewDef = await getViewDefinition('site_invitess');
  console.log('View definition:', viewDef);
  
  // List all tables as a reference
  const tables = await listAllTables();
  console.log('Available tables:', tables);
}

main().catch(err => console.error('Main execution error:', err));