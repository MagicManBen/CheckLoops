import { createClient } from '@supabase/supabase-js';

async function identifyAllUserTables() {
  const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
  const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';
  
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  console.log('=== COMPREHENSIVE USER TABLE ANALYSIS ===\n');

  const tablesFoundInCode = [
    'profiles',
    'site_invites', 
    'staff_app_welcome',
    '1_staff_holiday_profiles',
    '2_staff_entitlements', 
    '3_staff_working_patterns',
    'training_records',
    'training_types',
    'training_certificates',
    'complaints',
    'meetings',
    'meeting_notes',
    'quiz_questions',
    'quiz_options',
    'quiz_responses',
    'holiday_requests',
    'holiday_request_days',
    'teams',
    'sites',
    'user_profiles_complete',
    'tasks',
    'task_assignments',
    'items',
    'items_audited',
    'audit_sessions',
    'notifications'
  ];

  const userRelatedTables = [];

  for (const tableName of tablesFoundInCode) {
    console.log(`\nChecking ${tableName}:`);
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        if (error.code === '42P01' || error.message.includes('not find the table')) {
          console.log(`   ❌ Table ${tableName} does not exist`);
        } else {
          console.log(`   ⚠️ Error: ${error.message}`);
        }
      } else {
        console.log(`   ✅ Table ${tableName} exists`);
        if (data && data[0]) {
          const columns = Object.keys(data[0]);
          
          // Check for user_id columns  
          const userIdCols = columns.filter(col => 
            col.includes('user_id') || 
            col.includes('auth_user') || 
            col.includes('email') ||
            col.includes('created_by') ||
            col.includes('updated_by') ||
            col.includes('staff_id')
          );
          
          if (userIdCols.length > 0) {
            console.log(`   👤 User reference columns: ${userIdCols.join(', ')}`);
            userRelatedTables.push({
              table: tableName,
              userColumns: userIdCols,
              allColumns: columns
            });
          } else {
            console.log(`   ℹ️ No obvious user reference columns found`);
          }
        }
      }
    } catch (e) {
      console.log(`   💥 Exception: ${e.message}`);
    }
  }

  console.log('\n=== SUMMARY OF USER-RELATED TABLES ===');
  console.log(`Found ${userRelatedTables.length} tables with user references:`);
  
  userRelatedTables.forEach(({ table, userColumns }) => {
    console.log(`\n${table}:`);
    console.log(`  - User columns: ${userColumns.join(', ')}`);
  });

  console.log('\n=== RECOMMENDED DELETE ORDER ===');
  console.log('Based on foreign key dependencies, delete in this order:');
  
  // Order by likely dependency chain (child tables first)
  const deleteOrder = [
    'holiday_request_days',    // depends on holiday_requests
    'holiday_requests',        // depends on user
    'quiz_responses',          // depends on quiz_questions and user  
    'training_records',        // depends on user
    'complaints',              // depends on user (created_by)
    'meeting_notes',           // depends on meetings and user
    'meetings',                // depends on user (created_by)
    'items_audited',           // depends on user
    'task_assignments',        // depends on user
    '2_staff_entitlements',    // depends on 1_staff_holiday_profiles
    '3_staff_working_patterns', // depends on user
    '1_staff_holiday_profiles', // depends on user
    'staff_app_welcome',       // depends on user
    'site_invites',            // independent
    'profiles',                // core user profile
    // auth.users would be last via Edge function
  ];
  
  deleteOrder.forEach((table, index) => {
    const found = userRelatedTables.find(t => t.table === table);
    if (found) {
      console.log(`${index + 1}. ${table} (${found.userColumns.join(', ')})`);
    } else {
      console.log(`${index + 1}. ${table} (not confirmed to exist)`);
    }
  });

  console.log('\n=== CHECK COMPLETE ===');
}

identifyAllUserTables().catch(console.error);