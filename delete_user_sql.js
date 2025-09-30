// Script to delete user data using direct SQL queries
import pkg from 'pg';
const { Pool } = pkg;

// Database connection from Supabase connection string
// Format: postgres://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres
const connectionString = 'postgres://postgres:sb_secret_ylIhDtikpno4LTTUmpDJvw_Ov7BtIEp@db.unveoqnlqnobufhublyw.supabase.co:5432/postgres';
const EMAIL_TO_DELETE = 'ben.howard@stoke.nhs.uk';

const pool = new Pool({ connectionString });

async function main() {
  const client = await pool.connect();
  
  try {
    console.log(`Starting deletion process for user: ${EMAIL_TO_DELETE}`);
    
    // Start a transaction
    await client.query('BEGIN');
    
    // Step 1: Find user ID from auth.users
    console.log('Finding user ID...');
    const userResult = await client.query(
      `SELECT id FROM auth.users WHERE email = $1`,
      [EMAIL_TO_DELETE]
    );
    
    let userId = null;
    if (userResult.rows.length > 0) {
      userId = userResult.rows[0].id;
      console.log(`Found user with ID: ${userId}`);
    } else {
      console.log(`No user found with email: ${EMAIL_TO_DELETE}`);
    }
    
    // Step 2: Get all tables excluding system schemas
    console.log('Getting list of tables...');
    const tablesResult = await client.query(`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY table_schema, table_name
    `);
    
    // Step 3: Get foreign key constraints to understand dependencies
    const fkResult = await client.query(`
      SELECT
        tc.constraint_name,
        tc.table_schema,
        tc.table_name,
        kcu.column_name,
        ccu.table_schema AS foreign_table_schema,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
    `);
    
    // Build dependency graph
    const dependencies = {};
    for (const fk of fkResult.rows) {
      const childTable = `${fk.table_schema}.${fk.table_name}`;
      const parentTable = `${fk.foreign_table_schema}.${fk.foreign_table_name}`;
      
      if (!dependencies[childTable]) {
        dependencies[childTable] = new Set();
      }
      dependencies[childTable].add(parentTable);
    }
    
    // Create a list of tables to process, placing dependent tables earlier
    const processOrder = [];
    const visited = new Set();
    
    function visitTable(table) {
      if (visited.has(table)) return;
      
      visited.add(table);
      
      // Process dependencies first
      if (dependencies[table]) {
        for (const dep of dependencies[table]) {
          visitTable(dep);
        }
      }
      
      processOrder.push(table);
    }
    
    // Visit all tables to create process order
    for (const table of tablesResult.rows) {
      const tableName = `${table.table_schema}.${table.table_name}`;
      visitTable(tableName);
    }
    
    // Now process tables in order
    console.log(`Processing ${processOrder.length} tables...`);
    
    for (const fullTableName of processOrder) {
      const [schema, table] = fullTableName.split('.');
      
      // Skip the auth schema tables for now
      if (schema === 'auth') {
        continue;
      }
      
      // Get columns for this table
      const columnsResult = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = $2
      `, [schema, table]);
      
      // Check for user-related columns
      const emailColumn = columnsResult.rows.find(col => 
        col.column_name.toLowerCase().includes('email') || 
        col.column_name.toLowerCase() === 'email'
      );
      
      const userIdColumn = columnsResult.rows.find(col =>
        col.column_name.toLowerCase().includes('user_id') || 
        col.column_name.toLowerCase() === 'user_id' ||
        col.column_name.toLowerCase() === 'userid'
      );
      
      // If we found relevant columns, delete matching rows
      if (emailColumn) {
        const column = emailColumn.column_name;
        console.log(`Deleting from ${schema}.${table} where ${column} = '${EMAIL_TO_DELETE}'`);
        
        try {
          const result = await client.query(`
            DELETE FROM "${schema}"."${table}"
            WHERE "${column}" = $1
          `, [EMAIL_TO_DELETE]);
          
          console.log(`Deleted ${result.rowCount} rows from ${schema}.${table} by email`);
        } catch (error) {
          console.error(`Error deleting from ${schema}.${table} by email:`, error.message);
        }
      }
      
      if (userId && userIdColumn) {
        const column = userIdColumn.column_name;
        console.log(`Deleting from ${schema}.${table} where ${column} = '${userId}'`);
        
        try {
          const result = await client.query(`
            DELETE FROM "${schema}"."${table}"
            WHERE "${column}" = $1
          `, [userId]);
          
          console.log(`Deleted ${result.rowCount} rows from ${schema}.${table} by user ID`);
        } catch (error) {
          console.error(`Error deleting from ${schema}.${table} by user ID:`, error.message);
        }
      }
    }
    
    // Finally, handle auth tables if user ID was found
    if (userId) {
      console.log('Cleaning up auth tables...');
      
      try {
        // Delete from auth tables in proper order
        await client.query(`DELETE FROM auth.refresh_tokens WHERE user_id = $1`, [userId]);
        console.log('Deleted from auth.refresh_tokens');
        
        await client.query(`DELETE FROM auth.sessions WHERE user_id = $1`, [userId]);
        console.log('Deleted from auth.sessions');
        
        await client.query(`DELETE FROM auth.identities WHERE user_id = $1`, [userId]);
        console.log('Deleted from auth.identities');
        
        await client.query(`DELETE FROM auth.users WHERE id = $1`, [userId]);
        console.log('Deleted from auth.users');
      } catch (error) {
        console.error('Error cleaning up auth tables:', error.message);
      }
    }
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('Deletion process completed successfully');
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error during deletion process:', error);
    console.error('Transaction rolled back');
  } finally {
    client.release();
    pool.end();
  }
}

main().catch(err => console.error('Fatal error:', err));