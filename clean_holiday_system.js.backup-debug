import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oajszsjpluislmvfkmzi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hanN6c2pwbHVpc2xtdmZrbXppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjA0NTIzNzYsImV4cCI6MjAzNjAyODM3Nn0.w5F-LgXevgFfRKjCdNiLOe7lbXEp3dPXNe_rnoyT7xQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function cleanHolidaySystem() {
  console.log('🧹 Starting Holiday System Cleanup...\n');
  
  try {
    // Step 1: Clear all data from the CORRECT tables we're keeping
    console.log('📦 Clearing data from active holiday tables...');
    
    // Clear the numbered tables (these are the ones we'll use)
    const tablesToClear = [
      '5_staff_profile_user_links',
      '4_holiday_bookings', 
      '3_staff_working_patterns',
      '2_staff_entitlements',
      '1_staff_holiday_profiles'
    ];
    
    for (const table of tablesToClear) {
      const { error } = await supabase
        .from(table)
        .delete()
        .neq('id', 0); // Delete all rows (neq ensures we delete everything)
      
      if (error) {
        console.log(`  ⚠️ Error clearing ${table}:`, error.message);
      } else {
        console.log(`  ✅ Cleared ${table}`);
      }
    }
    
    // Step 2: Clear the OLD/UNUSED tables before removal
    console.log('\n📦 Clearing old/unused holiday tables...');
    
    const oldTablesToClear = [
      'holiday_request_days',
      'holiday_requests',
      'holiday_entitlements', 
      'holiday_bookings',
      'staff_holiday_profiles'
    ];
    
    for (const table of oldTablesToClear) {
      const { error } = await supabase
        .from(table)
        .delete()
        .neq('id', 0);
      
      if (error) {
        console.log(`  ⚠️ Error clearing ${table}:`, error.message);
      } else {
        console.log(`  ✅ Cleared ${table}`);
      }
    }
    
    console.log('\n🎉 Data cleanup complete!');
    console.log('\n⚠️ IMPORTANT: The unused tables need to be dropped via Supabase SQL Editor:');
    console.log('Please run the following SQL commands in Supabase:');
    console.log(`
-- Drop unused/duplicate holiday tables
DROP TABLE IF EXISTS holiday_request_days CASCADE;
DROP TABLE IF EXISTS holiday_requests CASCADE;
DROP TABLE IF EXISTS holiday_entitlements CASCADE;
DROP TABLE IF EXISTS holiday_bookings CASCADE;
DROP TABLE IF EXISTS staff_holiday_profiles CASCADE;

-- Drop views that depend on old tables
DROP VIEW IF EXISTS holiday_data_summary CASCADE;
DROP VIEW IF EXISTS staff_holiday_summary CASCADE;

-- Verify only the numbered tables remain
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%holiday%' OR table_name LIKE '%staff%')
ORDER BY table_name;
    `);
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

// Run the cleanup
cleanHolidaySystem();