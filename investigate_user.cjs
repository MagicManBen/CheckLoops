const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseKey = (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) || '';
if (!supabaseKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY not set in environment');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_EMAIL = 'ben.howard@stoke.nhs.uk';

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

async function searchKnownTables(userId) {
  console.log('🔍 Searching known tables for user data...');
  
  const knownTables = [
    { name: 'master_users', userColumns: ['auth_user_id', 'email'] },
    { name: 'training_records', userColumns: ['user_id'] },
    { name: 'submissions', userColumns: ['submitted_by_user_id', 'user_id'] },
    { name: 'holidays', userColumns: ['user_id'] },
    { name: 'quiz_status', userColumns: ['user_id'] },
    { name: 'achievements', userColumns: ['user_id'] }
  ];
  
  const findings = {};
  
  for (const table of knownTables) {
    console.log(`\n📋 Checking table: ${table.name}`);
    
    const tableResults = [];
    
    for (const column of table.userColumns) {
      try {
        let query;
        
        if (column === 'email') {
          query = supabase
            .from(table.name)
            .select('*')
            .eq(column, TARGET_EMAIL);
        } else if (userId) {
          query = supabase
            .from(table.name)
            .select('*')
            .eq(column, userId);
        } else {
          continue;
        }
        
        const { data: records, error } = await query;
        
        if (!error && records && records.length > 0) {
          console.log(`   ✅ Found ${records.length} record(s) in column ${column}`);
          tableResults.push(...records.map(r => ({ ...r, _found_in_column: column })));
        } else if (!error) {
          console.log(`   📭 No records found in column ${column}`);
        } else {
          console.log(`   ❌ Error querying column ${column}:`, error.message);
        }
      } catch (err) {
        console.log(`   ❌ Exception querying ${table.name}.${column}:`, err.message);
      }
    }
    
    if (tableResults.length > 0) {
      findings[table.name] = {
        records: tableResults,
        columns: table.userColumns
      };
    }
  }
  
  return findings;
}

async function investigateDatabase() {
  console.log(`🚀 Starting investigation for user: ${TARGET_EMAIL}`);
  console.log('='.repeat(60));
  
  // Step 1: Find user in auth system
  const authUser = await findUserInAuth();
  const userId = authUser ? authUser.id : null;
  console.log('');
  
  // Step 2: Search known tables
  const findings = await searchKnownTables(userId);
  
  // Summary
  console.log('\n📋 INVESTIGATION SUMMARY');
  console.log('='.repeat(40));
  console.log(`Target Email: ${TARGET_EMAIL}`);
  console.log(`User ID: ${userId || 'NOT FOUND'}`);
  console.log(`Tables with data: ${Object.keys(findings).length}`);
  
  if (Object.keys(findings).length > 0) {
    console.log('\n🎯 Tables containing user data:');
    for (const [tableName, data] of Object.entries(findings)) {
      console.log(`   - ${tableName}: ${data.records.length} records`);
      console.log(`     Columns: ${data.columns.join(', ')}`);
      
      // Show first record as sample
      if (data.records.length > 0) {
        console.log(`     Sample: ${JSON.stringify(data.records[0], null, 2).slice(0, 200)}...`);
      }
    }
  } else {
    console.log('\n✅ No user data found in any tables');
  }
  
  return { authUser, findings };
}

// Run the investigation
investigateDatabase()
  .then(results => {
    console.log('\n🏁 Investigation complete!');
    console.log('Next: Create deletion script based on findings...');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n💥 Investigation failed:', err);
    process.exit(1);
  });