const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseKey = (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) || '';
if (!supabaseKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY not set in environment');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_EMAIL = 'ben.howard@stoke.nhs.uk';

async function getAllTables() {
  console.log('🔍 Getting all database tables...');
  
  try {
    // Get all tables from information_schema
    const { data: tables, error } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT table_name, table_schema 
          FROM information_schema.tables 
          WHERE table_schema IN ('public', 'auth') 
          AND table_type = 'BASE TABLE'
          ORDER BY table_schema, table_name;
        `
      });
      
    if (error) {
      console.error('❌ Error getting tables:', error);
      
      // Fallback: try direct query
      const { data: publicTables } = await supabase
        .from('information_schema.tables')
        .select('table_name, table_schema')
        .in('table_schema', ['public', 'auth'])
        .eq('table_type', 'BASE TABLE');
        
      if (publicTables) {
        return publicTables;
      }
      
      // If that fails, try known tables from our codebase
      return [
        { table_name: 'master_users', table_schema: 'public' },
        { table_name: 'training_records', table_schema: 'public' },
        { table_name: 'training_types', table_schema: 'public' },
        { table_name: 'submissions', table_schema: 'public' },
        { table_name: 'holidays', table_schema: 'public' },
        { table_name: 'quiz_status', table_schema: 'public' },
        { table_name: 'achievements', table_schema: 'public' },
        { table_name: 'users', table_schema: 'auth' }
      ];
    }
    
    return tables || [];
  } catch (err) {
    console.error('❌ Exception getting tables:', err);
    return [];
  }
}

async function findUserInAuth() {
  console.log('🔍 Looking for user in auth.users...');
  
  try {
    const { data: authUser, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ Error getting auth users:', error);
      return null;
    }
    
    const targetUser = authUser.users.find(user => user.email === TARGET_EMAIL);
    
    if (targetUser) {
      console.log('✅ Found user in auth.users:');
      console.log(`   ID: ${targetUser.id}`);
      console.log(`   Email: ${targetUser.email}`);
      console.log(`   Created: ${targetUser.created_at}`);
      return targetUser;
    } else {
      console.log('⚠️  User not found in auth.users');
      return null;
    }
  } catch (err) {
    console.error('❌ Exception finding user in auth:', err);
    return null;
  }
}

async function searchTableForUser(tableName, schema, userId) {
  console.log(`🔍 Searching ${schema}.${tableName} for user references...`);
  
  try {
    // First, get column information for this table
    const { data: columns } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = '${tableName}' 
          AND table_schema = '${schema}'
          AND (column_name LIKE '%user%' OR column_name LIKE '%email%' OR column_name LIKE '%auth%');
        `
      });
    
    if (!columns || columns.length === 0) {
      console.log(`   📋 No user-related columns found in ${tableName}`);
      return { found: false, records: [] };
    }
    
    console.log(`   📋 Found user-related columns:`, columns.map(c => c.column_name).join(', '));
    
    // Check each user-related column
    const results = [];
    
    for (const column of columns) {
      let query;
      
      if (column.column_name.includes('email')) {
        // Search by email
        query = supabase
          .from(tableName)
          .select('*')
          .eq(column.column_name, TARGET_EMAIL);
      } else if (column.column_name.includes('user') && userId) {
        // Search by user ID
        query = supabase
          .from(tableName)
          .select('*')
          .eq(column.column_name, userId);
      } else {
        continue;
      }
      
      const { data: records, error } = await query;
      
      if (!error && records && records.length > 0) {
        console.log(`   ✅ Found ${records.length} record(s) in column ${column.column_name}`);
        results.push(...records);
      }
    }
    
    return {
      found: results.length > 0,
      records: results,
      columns: columns.map(c => c.column_name)
    };
    
  } catch (err) {
    console.error(`❌ Error searching ${tableName}:`, err);
    return { found: false, records: [], error: err.message };
  }
}

async function investigateDatabase() {
  console.log(`🚀 Starting investigation for user: ${TARGET_EMAIL}`);
  console.log('=' * 60);
  
  // Step 1: Get all tables
  const tables = await getAllTables();
  console.log(`📊 Found ${tables.length} tables to check`);
  console.log('');
  
  // Step 2: Find user in auth system
  const authUser = await findUserInAuth();
  const userId = authUser ? authUser.id : null;
  console.log('');
  
  // Step 3: Search each table
  const findings = {};
  
  for (const table of tables) {
    const result = await searchTableForUser(table.table_name, table.table_schema, userId);
    
    if (result.found) {
      findings[`${table.table_schema}.${table.table_name}`] = result;
      console.log(`   🎯 FOUND DATA: ${result.records.length} records`);
    }
    
    console.log('');
  }
  
  // Summary
  console.log('📋 INVESTIGATION SUMMARY');
  console.log('=' * 40);
  console.log(`Target Email: ${TARGET_EMAIL}`);
  console.log(`User ID: ${userId || 'NOT FOUND'}`);
  console.log(`Tables with data: ${Object.keys(findings).length}`);
  
  if (Object.keys(findings).length > 0) {
    console.log('\n🎯 Tables containing user data:');
    for (const [tableName, data] of Object.entries(findings)) {
      console.log(`   - ${tableName}: ${data.records.length} records`);
      console.log(`     Columns: ${data.columns.join(', ')}`);
    }
  } else {
    console.log('\n✅ No user data found in any tables');
  }
  
  return { authUser, findings, tables };
}

// Run the investigation
investigateDatabase()
  .then(results => {
    console.log('\n🏁 Investigation complete!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n💥 Investigation failed:', err);
    process.exit(1);
  });