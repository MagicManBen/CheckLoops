// Script to find email in all Supabase tables
const { createClient } = require('@supabase/supabase-js');

// Supabase URL and ANON key (do not store service keys in source)
const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, SUPABASE_ANON_KEY);
const emailToSearch = process.env.SEARCH_EMAIL || 'ben.howard@stoke.nhs.uk';

async function listAllTables() {
  console.log('Listing all tables in the database...');
  
  try {
    // Delegate to server-side edge function which has the service key
    const { data, error } = await supabase.functions.invoke('search-email', { body: { email: emailToSearch, listOnly: true } });
    if (error) {
      console.error('Edge function error listing tables:', error);
      return [];
    }
    // Edge function returns { tables } when listOnly is true
    return (data?.tables || []).map(row => row.table_name || row);
  } catch (err) {
    console.error('Exception listing tables:', err);
    return [];
  }
}

async function findEmailInTable(tableName) {
  console.log(`Searching for ${emailToSearch} in table: ${tableName}`);
  
  try {
    // Delegate the search to the edge function which will perform the privileged query
    const { data, error } = await supabase.functions.invoke('search-email', { body: { email: emailToSearch, table: tableName } });
    if (error) {
      console.error('Edge function error searching table:', error);
      return null;
    }
    return data?.results || null;
  } catch (err) {
    console.error(`Exception searching ${tableName}:`, err);
    return null;
  }
}

async function generateDeleteStatements(results) {
  console.log('\nGenerated SQL DELETE statements:');
  console.log('--------------------------------');
  
  for (const result of results) {
    for (const match of result.matches) {
      if (match.id) {
        console.log(`DELETE FROM "${result.table}" WHERE id = '${match.id}';`);
      } else {
        console.log(`DELETE FROM "${result.table}" WHERE ${result.column} = '${emailToSearch}';`);
      }
    }
  }
}

async function main() {
  const tables = await listAllTables();
  console.log(`Found ${tables.length} tables to search.`);
  
  const foundInTables = [];
  
  for (const table of tables) {
    const result = await findEmailInTable(table);
    if (result) {
      foundInTables.push(...result);
    }
  }
  
  console.log('\nResults:');
  console.log('--------');
  if (foundInTables.length === 0) {
    console.log(`Email ${emailToSearch} not found in any tables.`);
  } else {
    console.log(`Email ${emailToSearch} found in the following tables:`);
    foundInTables.forEach(result => {
      console.log(`Table: ${result.table}, Column: ${result.column}`);
      console.log('Matching records:', result.matches);
      console.log('---');
    });
    
    // Generate DELETE statements
    await generateDeleteStatements(foundInTables);
  }
}

main().catch(err => console.error('Main execution error:', err));