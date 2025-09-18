import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeTables() {
  try {
    // First, let's get all table names from the information_schema
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');
    
    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
      return;
    }

    console.log('=== AVAILABLE TABLES ===');
    tables.forEach(table => {
      console.log(`- ${table.table_name}`);
    });

    // Now let's analyze each table's columns and structure
    console.log('\n=== TABLE ANALYSIS ===');
    
    for (const table of tables) {
      const tableName = table.table_name;
      console.log(`\n--- ${tableName.toUpperCase()} ---`);
      
      // Get column information
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .order('ordinal_position');
      
      if (columnsError) {
        console.error(`Error fetching columns for ${tableName}:`, columnsError);
        continue;
      }

      console.log('Columns:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });

      // Get sample data to understand usage patterns
      const { data: sampleData, error: sampleError } = await supabase
        .from(tableName)
        .select('*')
        .limit(3);
      
      if (!sampleError && sampleData && sampleData.length > 0) {
        console.log('Sample data:');
        sampleData.forEach((row, index) => {
          console.log(`  Row ${index + 1}:`, JSON.stringify(row, null, 2));
        });
      }

      // Get record count
      const { count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (!countError) {
        console.log(`Record count: ${count}`);
      }
    }

    // Now let's specifically look for user-related settings patterns
    console.log('\n=== MASTER TABLE CANDIDATES ===');
    console.log('Looking for tables that might benefit from master table approach...\n');

    // Check for tables with user_id and single-value settings
    await analyzeForMasterTablePattern('user_preferences');
    await analyzeForMasterTablePattern('user_settings'); 
    await analyzeForMasterTablePattern('notification_settings');
    await analyzeForMasterTablePattern('working_hours');
    await analyzeForMasterTablePattern('holiday_balance');
    await analyzeForMasterTablePattern('training_preferences');
    await analyzeForMasterTablePattern('dashboard_settings');

  } catch (error) {
    console.error('Error analyzing tables:', error);
  }
}

async function analyzeForMasterTablePattern(tableName) {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(5);
  
  if (error) {
    console.log(`❌ ${tableName}: Table doesn't exist`);
    return;
  }

  if (data && data.length > 0) {
    console.log(`✅ ${tableName}: Found ${data.length} records`);
    console.log('   Sample structure:', Object.keys(data[0]).join(', '));
    
    // Check if it has user_id pattern
    const hasUserId = Object.keys(data[0]).some(key => 
      key.includes('user_id') || key.includes('user') || key.includes('staff_id')
    );
    
    if (hasUserId) {
      console.log('   💡 HAS USER REFERENCE - Good candidate for master table approach');
    }
  } else {
    console.log(`⚪ ${tableName}: Table exists but empty`);
  }
}

analyzeTables();