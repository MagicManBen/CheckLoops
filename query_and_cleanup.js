// Script to directly check and clean up the email from Supabase tables
// Save as query_and_cleanup.js

import { createClient } from '@supabase/supabase-js';

// Supabase credentials
const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SUPABASE_KEY = 'sb_secret_ylIhDtikpno4LTTUmpDJvw_Ov7BtIEp';
const EMAIL = 'ben.howard@stoke.nhs.uk';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Function to check if a table exists
async function tableExists(tableName) {
  try {
    // Using RLS bypass for admin operations
    const { data, error } = await supabase
      .from(tableName)
      .select('count(*)', { count: 'exact', head: true });
    
    if (error && error.code === '42P01') {
      console.log(`Table ${tableName} does not exist`);
      return false;
    }
    
    return true;
  } catch (err) {
    console.log(`Error checking if table ${tableName} exists:`, err.message);
    return false;
  }
}

// Function to check if email exists in a table
async function checkEmailInTable(tableName) {
  try {
    console.log(`Checking table ${tableName} for email ${EMAIL}...`);
    
    if (!(await tableExists(tableName))) {
      return null;
    }
    
    // First get column names to find email columns
    const { data: columns, error: columnsError } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (columnsError) {
      console.log(`Error getting columns for ${tableName}:`, columnsError.message);
      return null;
    }
    
    if (!columns || columns.length === 0) {
      console.log(`No data in ${tableName}`);
      return null;
    }
    
    // Look for email columns
    const columnNames = Object.keys(columns[0]);
    const emailColumns = columnNames.filter(col => 
      col.toLowerCase().includes('email') || 
      col.toLowerCase().includes('mail') ||
      col.toLowerCase().includes('user')
    );
    
    if (emailColumns.length === 0) {
      console.log(`No email-like columns found in ${tableName}`);
      return null;
    }
    
    // Build a query for each potential email column
    let results = [];
    for (const column of emailColumns) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .or(`${column}.eq.${EMAIL},${column}.ilike.%${EMAIL}%`);
      
      if (error) {
        console.log(`Error searching ${tableName}.${column}:`, error.message);
        continue;
      }
      
      if (data && data.length > 0) {
        console.log(`FOUND in ${tableName}.${column}:`, data);
        results.push({
          tableName,
          column,
          data
        });
      }
    }
    
    return results.length > 0 ? results : null;
  } catch (err) {
    console.log(`Error checking ${tableName}:`, err.message);
    return null;
  }
}

// Function to remove email from a table
async function removeFromTable(tableName, column, id) {
  try {
    console.log(`Removing ${EMAIL} from ${tableName} where id = ${id}...`);
    
    const { data, error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);
    
    if (error) {
      console.log(`Error removing from ${tableName}:`, error.message);
      return false;
    }
    
    console.log(`Successfully removed from ${tableName}`);
    return true;
  } catch (err) {
    console.log(`Exception removing from ${tableName}:`, err.message);
    return false;
  }
}

// Check view definition for site_invitess
async function checkViewDefinition(viewName) {
  try {
    // This is a workaround to get view definition since we can't query pg_views directly
    console.log(`Checking definition of view ${viewName}...`);
    
    // Query the view itself to see what tables it might reference
    const { data, error } = await supabase
      .from(viewName)
      .select('*')
      .limit(5);
    
    if (error) {
      console.log(`Error querying view ${viewName}:`, error.message);
      return;
    }
    
    console.log(`View ${viewName} returns data structure:`, 
      data && data.length > 0 ? Object.keys(data[0]) : 'No data');
    
    // Now check if this view has our email
    if (data && data.length > 0) {
      const records = data.filter(record => {
        return Object.values(record).some(val => 
          val && typeof val === 'string' && val.includes(EMAIL)
        );
      });
      
      if (records.length > 0) {
        console.log(`FOUND EMAIL in view ${viewName}:`, records);
      }
    }
    
  } catch (err) {
    console.log(`Exception checking view ${viewName}:`, err.message);
  }
}

async function main() {
  console.log(`Searching for email ${EMAIL} in Supabase tables...`);
  
  // First check site_invitess view
  await checkViewDefinition('site_invitess');
  
  // Common tables to check
  const tablesToCheck = [
    'site_invites',  // Most likely table based on view name
    'invites',
    'invitations',
    'profiles',
    'users',
    'members',
    'clients',
    'contacts',
    'staff',
    'employees'
  ];
  
  const foundInTables = [];
  
  for (const table of tablesToCheck) {
    const result = await checkEmailInTable(table);
    if (result) {
      foundInTables.push(...result);
    }
  }
  
  if (foundInTables.length === 0) {
    console.log(`Email ${EMAIL} not found in any checked tables.`);
    return;
  }
  
  console.log('\n--- SUMMARY OF FINDINGS ---');
  foundInTables.forEach(({ tableName, column, data }) => {
    console.log(`Found in ${tableName}.${column}, ${data.length} record(s)`);
  });
  
  console.log('\n--- SQL TO REMOVE USER ---');
  foundInTables.forEach(({ tableName, data }) => {
    data.forEach(record => {
      if (record.id) {
        console.log(`DELETE FROM "${tableName}" WHERE id = '${record.id}';`);
      }
    });
  });
  
  // Ask for confirmation before deleting
  console.log('\nTo delete these records automatically, uncomment the code in this script.');
  
  // Automated deletion (commented out for safety)
  /*
  console.log('\n--- REMOVING RECORDS ---');
  for (const { tableName, data } of foundInTables) {
    for (const record of data) {
      if (record.id) {
        await removeFromTable(tableName, 'id', record.id);
      }
    }
  }
  */
}

main().catch(err => console.error('Error in main execution:', err));