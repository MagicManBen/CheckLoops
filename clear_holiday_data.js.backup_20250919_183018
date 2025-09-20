import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function clearAllHolidayData() {
  console.log('🗑️  Starting to clear all holiday data...\n');
  
  try {
    // 1. Clear holiday_requests table
    console.log('Clearing holiday_requests table...');
    const { error: requestsError, count: requestsCount } = await supabase
      .from('holiday_requests')
      .delete()
      .neq('id', 0); // This will delete all records since id is never 0
    
    if (requestsError) {
      console.error('❌ Error clearing holiday_requests:', requestsError);
    } else {
      console.log(`✅ Cleared holiday_requests table (${requestsCount || 'all'} records)`);
    }

    // 2. Clear holiday_entitlements table
    console.log('Clearing holiday_entitlements table...');
    const { error: entitlementsError, count: entitlementsCount } = await supabase
      .from('holiday_entitlements')
      .delete()
      .neq('id', 0); // This will delete all records since id is never 0
    
    if (entitlementsError) {
      console.error('❌ Error clearing holiday_entitlements:', entitlementsError);
    } else {
      console.log(`✅ Cleared holiday_entitlements table (${entitlementsCount || 'all'} records)`);
    }

    // 3. Clear working_patterns table (optional - contains work schedule data)
    console.log('Clearing working_patterns table...');
    const { error: patternsError, count: patternsCount } = await supabase
      .from('working_patterns')
      .delete()
      .neq('id', 0); // This will delete all records since id is never 0
    
    if (patternsError) {
      console.error('❌ Error clearing working_patterns:', patternsError);
    } else {
      console.log(`✅ Cleared working_patterns table (${patternsCount || 'all'} records)`);
    }

    // 4. Clear any staff_app_welcome entries that might have been created for holiday purposes
    console.log('Clearing staff_app_welcome entries with placeholder user_ids...');
    const { error: welcomeError, count: welcomeCount } = await supabase
      .from('staff_app_welcome')
      .delete()
      .like('user_id', 'placeholder-%');
    
    if (welcomeError) {
      console.error('❌ Error clearing placeholder staff_app_welcome entries:', welcomeError);
    } else {
      console.log(`✅ Cleared placeholder staff_app_welcome entries (${welcomeCount || '0'} records)`);
    }

    console.log('\n🎉 All holiday data has been cleared successfully!');
    console.log('\nTables cleared:');
    console.log('- holiday_requests');
    console.log('- holiday_entitlements'); 
    console.log('- working_patterns');
    console.log('- placeholder staff_app_welcome entries');
    console.log('\nYou can now start fresh with new holiday data.');

  } catch (error) {
    console.error('❌ Unexpected error during cleanup:', error);
  }
}

// Verify tables are empty
async function verifyTablesEmpty() {
  console.log('\n📊 Verifying tables are empty...');
  
  try {
    const { count: requestsCount } = await supabase
      .from('holiday_requests')
      .select('*', { count: 'exact', head: true });
    
    const { count: entitlementsCount } = await supabase
      .from('holiday_entitlements')
      .select('*', { count: 'exact', head: true });
    
    const { count: patternsCount } = await supabase
      .from('working_patterns')
      .select('*', { count: 'exact', head: true });

    console.log(`holiday_requests: ${requestsCount || 0} records`);
    console.log(`holiday_entitlements: ${entitlementsCount || 0} records`);
    console.log(`working_patterns: ${patternsCount || 0} records`);

    if ((requestsCount || 0) === 0 && (entitlementsCount || 0) === 0 && (patternsCount || 0) === 0) {
      console.log('✅ All holiday tables are now empty!');
    } else {
      console.log('⚠️  Some records may remain in the tables.');
    }

  } catch (error) {
    console.error('❌ Error verifying tables:', error);
  }
}

// Run the cleanup
console.log('⚠️  WARNING: This will delete ALL holiday data from the database!');
console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');

setTimeout(async () => {
  await clearAllHolidayData();
  await verifyTablesEmpty();
}, 3000);