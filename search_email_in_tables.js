// Script to find email in all Supabase tables
const { createClient } = require('@supabase/supabase-js');

// Supabase URL and key 
const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseServiceKey = 'sb_secret_ylIhDtikpno4LTTUmpDJvw_Ov7BtIEp';

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const emailToSearch = 'ben.howard@stoke.nhs.uk';

async function listAllTables() {
  console.log('Listing all tables in the database...');
  
  try {
    // Using RPC to execute custom SQL to list tables
    const { data, error } = await supabase.rpc('execute_sql', {
      query: `SELECT table_name 
              FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_type = 'BASE TABLE'`
    });

    if (error) {
      console.error('Error listing tables:', error);
      return [];
    }

    return data.map(row => row.table_name);
  } catch (err) {
    console.error('Exception listing tables:', err);
    return [];
  }
}

async function findEmailInTable(tableName) {
  console.log(`Searching for ${emailToSearch} in table: ${tableName}`);
  
  try {
    // Get column names first
    const { data: columns, error: columnsError } = await supabase.rpc('execute_sql', {
      query: `SELECT column_name 
              FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = '${tableName}'`
    });

    if (columnsError) {
      console.error(`Error getting columns for ${tableName}:`, columnsError);
      return null;
    }

    // Filter for text-like columns that might contain email addresses
    const textColumns = columns.filter(col => {
      const colName = col.column_name.toLowerCase();
      return colName.includes('email') || 
             colName.includes('mail') || 
             colName.includes('user') || 
             colName.includes('contact') ||
             colName.includes('address');
    }).map(col => col.column_name);

    if (textColumns.length === 0) {
      return null; // No suitable columns to search
    }

    // Search each column for the email
    const results = [];
    for (const column of textColumns) {
      const { data, error } = await supabase.rpc('execute_sql', {
        query: `SELECT id, ${column} FROM "${tableName}" 
                WHERE ${column} = '${emailToSearch}' 
                OR ${column} ILIKE '%${emailToSearch}%'`
      });

      if (error) {
        console.error(`Error searching ${tableName}.${column}:`, error);
        continue;
      }

      if (data && data.length > 0) {
        results.push({ 
          table: tableName, 
          column, 
          matches: data 
        });
      }
    }

    return results.length > 0 ? results : null;
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