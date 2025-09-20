import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://unveoqnlqnobufhublyw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc'
);

async function checkDatabaseStructure() {
  console.log('=== CHECKING DATABASE STRUCTURE ===\n');

  try {
    // Get all tables
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE')
      .order('table_name');

    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
      return;
    }

    console.log('TABLES FOUND IN DATABASE:');
    console.log('-------------------------');

    const tableList = tables.map(t => t.table_name);
    tableList.forEach(table => console.log(`✅ ${table}`));

    // Check for holiday-related tables
    console.log('\nHOLIDAY-RELATED TABLES:');
    console.log('----------------------');
    const holidayTables = tableList.filter(t =>
      t.includes('holiday') ||
      t.includes('leave') ||
      t.includes('vacation') ||
      t.includes('absence') ||
      t.includes('entitlement')
    );

    if (holidayTables.length > 0) {
      holidayTables.forEach(table => console.log(`📅 ${table}`));
    } else {
      console.log('❌ No holiday tables found');
    }

    // Check for training tables
    console.log('\nTRAINING-RELATED TABLES:');
    console.log('------------------------');
    const trainingTables = tableList.filter(t => t.includes('training'));
    trainingTables.forEach(table => console.log(`📚 ${table}`));

    // Check for quiz tables
    console.log('\nQUIZ-RELATED TABLES:');
    console.log('--------------------');
    const quizTables = tableList.filter(t => t.includes('quiz'));
    quizTables.forEach(table => console.log(`❓ ${table}`));

    // Check for meeting tables
    console.log('\nMEETING-RELATED TABLES:');
    console.log('-----------------------');
    const meetingTables = tableList.filter(t => t.includes('meeting'));
    meetingTables.forEach(table => console.log(`👥 ${table}`));

    // Check for complaint tables
    console.log('\nCOMPLAINT-RELATED TABLES:');
    console.log('-------------------------');
    const complaintTables = tableList.filter(t => t.includes('complaint') || t.includes('pir'));
    complaintTables.forEach(table => console.log(`📝 ${table}`));

    // Check critical tables
    console.log('\nCRITICAL TABLES STATUS:');
    console.log('-----------------------');
    const criticalTables = [
      'master_users',
      'sites',
      'teams',
      'training_types',
      'training_records',
      'achievements',
      'user_achievements'
    ];

    criticalTables.forEach(table => {
      if (tableList.includes(table)) {
        console.log(`✅ ${table} - EXISTS`);
      } else {
        console.log(`❌ ${table} - MISSING`);
      }
    });

    // Check for numbered tables (like 4_holiday_requests)
    console.log('\nNUMBERED TABLES:');
    console.log('----------------');
    const numberedTables = tableList.filter(t => /^\d+_/.test(t));
    if (numberedTables.length > 0) {
      numberedTables.forEach(table => console.log(`#️⃣  ${table}`));
    }

    // Return the full list for use in SQL generation
    return tableList;

  } catch (error) {
    console.error('Error:', error);
  }
}

checkDatabaseStructure().then(tables => {
  console.log('\n=== SUMMARY ===');
  console.log(`Total tables found: ${tables?.length || 0}`);
});