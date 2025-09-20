// Debug script to test scan data loading
const { createClient } = require('@supabase/supabase-js');

// Mock window object for config loading
global.window = { location: { hostname: '127.0.0.1' } };
const fs = require('fs');
const configContent = fs.readFileSync('./config.js', 'utf-8');
eval(configContent);
const CONFIG = global.window.CONFIG;

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

// Test user ID from the screenshot (benhowardmagic@hotmail.com - admin user)
const testUserId = 'd45e5c50-232f-466c-85c8-b03271b16af4';

async function debugScanData() {
  console.log('🔍 Debugging scan data loading for user:', testUserId);
  console.log('📅 Current date:', new Date().toISOString());
  
  // Step 1: Check submissions table structure
  console.log('\n📊 Step 1: Checking submissions table structure...');
  try {
    const { data: tableStructure, error } = await supabase
      .from('submissions')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing submissions table:', error);
    } else if (tableStructure && tableStructure.length > 0) {
      console.log('✅ Submissions table accessible');
      console.log('📋 Available columns:', Object.keys(tableStructure[0]));
      console.log('📄 Sample record:', tableStructure[0]);
    } else {
      console.log('⚠️ Submissions table is empty');
    }
  } catch (e) {
    console.error('❌ Failed to access submissions table:', e.message);
  }

  // Step 2: Check for user submissions with submitted_by_user_id
  console.log('\n📊 Step 2: Checking user submissions (submitted_by_user_id)...');
  try {
    const { data: userSubs1, error: error1 } = await supabase
      .from('submissions')
      .select('id, submitted_at, staff_name, submitted_by_user_id')
      .eq('submitted_by_user_id', testUserId)
      .order('submitted_at', { ascending: false })
      .limit(10);
    
    if (error1) {
      console.error('❌ Error with submitted_by_user_id:', error1);
    } else {
      console.log(`✅ Found ${userSubs1?.length || 0} submissions with submitted_by_user_id`);
      if (userSubs1?.length > 0) {
        userSubs1.slice(0, 3).forEach((sub, i) => {
          console.log(`   ${i+1}. ${new Date(sub.submitted_at).toLocaleDateString()} - ${sub.staff_name || 'No name'}`);
        });
      }
    }
  } catch (e) {
    console.error('❌ Failed to query submitted_by_user_id:', e.message);
  }

  // Step 3: Check for user submissions with user_id (fallback)
  console.log('\n📊 Step 3: Checking user submissions (user_id fallback)...');
  try {
    const { data: userSubs2, error: error2 } = await supabase
      .from('submissions')
      .select('id, submitted_at, staff_name, user_id')
      .eq('user_id', testUserId)
      .order('submitted_at', { ascending: false })
      .limit(10);
    
    if (error2) {
      console.error('❌ Error with user_id:', error2);
    } else {
      console.log(`✅ Found ${userSubs2?.length || 0} submissions with user_id`);
      if (userSubs2?.length > 0) {
        userSubs2.slice(0, 3).forEach((sub, i) => {
          console.log(`   ${i+1}. ${new Date(sub.submitted_at).toLocaleDateString()} - ${sub.staff_name || 'No name'}`);
        });
      }
    }
  } catch (e) {
    console.error('❌ Failed to query user_id:', e.message);
  }

  // Step 4: Check all submissions to understand the data
  console.log('\n📊 Step 4: Checking all recent submissions...');
  try {
    const { data: allSubs, error: errorAll } = await supabase
      .from('submissions')
      .select('id, submitted_at, staff_name, submitted_by_user_id, user_id')
      .order('submitted_at', { ascending: false })
      .limit(5);
    
    if (errorAll) {
      console.error('❌ Error getting all submissions:', errorAll);
    } else {
      console.log(`✅ Found ${allSubs?.length || 0} total recent submissions`);
      if (allSubs?.length > 0) {
        console.log('📋 Recent submissions structure:');
        allSubs.forEach((sub, i) => {
          console.log(`   ${i+1}. ID: ${sub.id?.substr(-8)}... Date: ${new Date(sub.submitted_at).toLocaleDateString()} Staff: ${sub.staff_name || 'No name'}`);
          console.log(`       submitted_by_user_id: ${sub.submitted_by_user_id?.substr(-8) + '...' || 'null'}`);
          console.log(`       user_id: ${sub.user_id?.substr(-8) + '...' || 'null'}`);
        });
      }
    }
  } catch (e) {
    console.error('❌ Failed to query all submissions:', e.message);
  }

  console.log('\n🏁 Debug complete');
}

debugScanData().catch(console.error);