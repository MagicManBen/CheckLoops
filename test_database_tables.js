import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  'https://unveoqnlqnobufhublyw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME'
);

async function checkDatabaseTables() {
  console.log('\n=== Checking Holiday System Database Tables ===\n');
  
  try {
    // Test each holiday table
    const tables = [
      'holiday_requests',
      'holiday_entitlements',
      'working_patterns',
      'holiday_settings',
      'holiday_alerts',
      'holiday_request_days'
    ];
    
    for (const table of tables) {
      console.log(`Checking table: ${table}`);
      
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        if (error.code === '42P01') {
          console.log(`  ❌ Table '${table}' does not exist`);
        } else {
          console.log(`  ⚠️ Error accessing '${table}': ${error.message}`);
        }
      } else {
        console.log(`  ✅ Table '${table}' exists (${count || 0} rows)`);
      }
    }
    
    console.log('\n=== Checking if migration needs to be applied ===\n');
    
    // Check if any holiday tables exist
    const { error: testError } = await supabase
      .from('holiday_requests')
      .select('id')
      .limit(1);
    
    if (testError && testError.code === '42P01') {
      console.log('❌ Holiday tables do not exist. Migration needs to be applied.');
      console.log('\nTo apply the migration:');
      console.log('1. Go to Supabase Dashboard: https://app.supabase.com/project/unveoqnlqnobufhublyw');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy and paste the migration from: supabase/migrations/*_holiday_system.sql');
      console.log('4. Run the migration');
    } else if (!testError) {
      console.log('✅ Holiday tables exist and are accessible');
    }
    
  } catch (error) {
    console.error('Error checking tables:', error);
  }
}

checkDatabaseTables().catch(console.error);