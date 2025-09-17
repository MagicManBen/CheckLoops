import { createClient } from '@supabase/supabase-js';

async function checkAllTables() {
  const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
  const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';
  
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  console.log('=== ALL TABLES CHECK ===\n');

  try {
    // Query all tables using raw SQL
    const { data: tables, error } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            table_schema, 
            table_name,
            table_type
          FROM information_schema.tables 
          WHERE table_type = 'BASE TABLE' 
            AND table_schema IN ('public', 'auth')
          ORDER BY table_schema, table_name;
        `
      });

    if (error) {
      console.error('Error getting tables:', error);
    } else {
      console.log('Found tables:');
      tables.forEach(table => {
        console.log(`- ${table.table_schema}.${table.table_name}`);
      });
    }

    // Now let's check specific tables that might contain user data
    const userRelatedTables = [
      'profiles',
      'site_invites',
      'staff_app_welcome',
      '1_staff_holiday_profiles', 
      '2_staff_entitlements',
      '3_staff_working_patterns',
      'task_assignments',
      'tasks_completed',
      'quiz_responses',
      'meetings',
      'meeting_notes',
      'items_audited',
      'complaints',
      'user_sessions',
      'notifications',
      'training_records'
    ];

    console.log('\n=== CHECKING USER-RELATED TABLES ===');
    
    for (const tableName of userRelatedTables) {
      console.log(`\nChecking ${tableName}:`);
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (error) {
          if (error.code === '42P01') {
            console.log(`   ❌ Table ${tableName} does not exist`);
          } else {
            console.log(`   ⚠️ Error: ${error.message}`);
          }
        } else {
          console.log(`   ✅ Table ${tableName} exists`);
          if (data && data[0]) {
            const columns = Object.keys(data[0]);
            console.log(`   Columns (${columns.length}):`, columns.join(', '));
            
            // Check for user_id columns
            const userIdCols = columns.filter(col => 
              col.includes('user_id') || col.includes('auth_user') || col.includes('email')
            );
            if (userIdCols.length > 0) {
              console.log(`   👤 User reference columns: ${userIdCols.join(', ')}`);
            }
          }
        }
      } catch (e) {
        console.log(`   💥 Exception: ${e.message}`);
      }
    }

  } catch (err) {
    console.error('Error:', err.message);
  }

  console.log('\n=== CHECK COMPLETE ===');
}

checkAllTables().catch(console.error);