import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://unveoqnlqnobufhublyw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME'
);

async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(0);

    if (error) {
      if (error.message.includes('does not exist')) {
        return false;
      }
      // If it's an RLS error, the table exists
      if (error.message.includes('Row Level Security') || error.message.includes('policy')) {
        return true;
      }
    }
    return true;
  } catch (e) {
    return false;
  }
}

async function checkAllTables() {
  console.log('=== CHECKING TABLES DIRECTLY ===\n');

  // List of possible table names to check
  const tablesToCheck = [
    // Core tables
    'master_users',
    'sites',
    'teams',

    // Training tables
    'training_types',
    'training_records',
    'training_categories',

    // Holiday tables (various possible names)
    'holiday_bookings',
    'holiday_requests',
    'staff_holidays',
    'leave_requests',
    'annual_leave',
    'staff_entitlements',
    'holiday_summary',
    '4_holiday_requests',  // Numbered version

    // Meeting tables
    'meetings',
    'meeting_records',
    'staff_meetings',

    // Complaint tables
    'complaints',
    'complaint_records',
    'pir_complaints',

    // Quiz tables
    'quiz_attempts',
    'quiz_practices',
    'quiz_questions',
    'practice_quizzes',

    // Achievement tables
    'achievements',
    'user_achievements',
    'achievement_progress',

    // Other possible tables
    'kiosk_roles',
    'site_invites',
    'staff_profile_user_links',
    'profiles',
    'user_profiles',
    'shift_data',
    'staff_shifts'
  ];

  const existingTables = [];
  const missingTables = [];

  console.log('Checking tables...\n');

  for (const table of tablesToCheck) {
    const exists = await checkTableExists(table);
    if (exists) {
      existingTables.push(table);
      console.log(`✅ ${table}`);
    } else {
      missingTables.push(table);
    }
  }

  console.log('\n=== EXISTING TABLES ===');
  existingTables.forEach(t => console.log(`✅ ${t}`));

  console.log('\n=== CATEGORIZED ===');

  console.log('\nHOLIDAY TABLES:');
  existingTables.filter(t =>
    t.includes('holiday') ||
    t.includes('leave') ||
    t.includes('entitlement')
  ).forEach(t => console.log(`📅 ${t}`));

  console.log('\nTRAINING TABLES:');
  existingTables.filter(t => t.includes('training')).forEach(t => console.log(`📚 ${t}`));

  console.log('\nQUIZ TABLES:');
  existingTables.filter(t => t.includes('quiz')).forEach(t => console.log(`❓ ${t}`));

  console.log('\nMEETING TABLES:');
  existingTables.filter(t => t.includes('meeting')).forEach(t => console.log(`👥 ${t}`));

  console.log('\nCOMPLAINT TABLES:');
  existingTables.filter(t => t.includes('complaint') || t.includes('pir')).forEach(t => console.log(`📝 ${t}`));

  return existingTables;
}

checkAllTables().then(tables => {
  console.log('\n=== SUMMARY ===');
  console.log(`Total existing tables found: ${tables.length}`);
});