#!/usr/bin/env node

// Script to investigate Supabase schema and verify our fixes
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function investigateSchema() {
  console.log('🔍 Investigating Supabase database schema...\n');

  try {
    // 1. Check master_users table structure
    console.log('📋 1. Checking master_users table structure...');
    const { data: masterUsersInfo, error: masterError } = await supabase
      .rpc('get_table_info', { table_name: 'master_users' })
      .catch(() => null);

    if (masterError) {
      console.log('   ❌ master_users table not found or error:', masterError.message);
      
      // Try to get columns using a different method
      console.log('   🔄 Trying alternative method...');
      const { data: masterColumns, error: altError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'master_users')
        .eq('table_schema', 'public');
      
      if (masterColumns && masterColumns.length > 0) {
        console.log('   ✅ master_users columns found:');
        masterColumns.forEach(col => {
          console.log(`     - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
        });
      } else {
        console.log('   ❌ Could not get master_users structure');
      }
    } else {
      console.log('   ✅ master_users structure:', masterUsersInfo);
    }

    // 2. Check if kiosk_users table exists and has holiday_approved column
    console.log('\n📋 2. Checking kiosk_users table...');
    const { data: kioskData, error: kioskError } = await supabase
      .from('kiosk_users')
      .select('*')
      .limit(1);

    if (kioskError) {
      console.log('   ❌ kiosk_users error:', kioskError.message);
    } else {
      console.log('   ✅ kiosk_users exists');
      if (kioskData && kioskData.length > 0) {
        console.log('   📝 Sample record columns:', Object.keys(kioskData[0]));
        console.log('   🎯 Has holiday_approved?', 'holiday_approved' in kioskData[0] ? '✅ YES' : '❌ NO');
      }
    }

    // 3. Check kiosk_users column structure
    console.log('\n📋 3. Checking kiosk_users column structure...');
    const { data: kioskColumns, error: kioskColError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'kiosk_users')
      .eq('table_schema', 'public');

    if (kioskColumns && kioskColumns.length > 0) {
      console.log('   ✅ kiosk_users columns:');
      kioskColumns.forEach(col => {
        console.log(`     - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
      });
    } else {
      console.log('   ❌ Could not get kiosk_users columns');
    }

    // 4. Check profiles table for pin columns
    console.log('\n📋 4. Checking profiles table for PIN columns...');
    const { data: profilesColumns, error: profilesColError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'profiles')
      .eq('table_schema', 'public')
      .like('column_name', '%pin%');

    if (profilesColumns && profilesColumns.length > 0) {
      console.log('   ✅ profiles PIN columns:');
      profilesColumns.forEach(col => {
        console.log(`     - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
      });
    } else {
      console.log('   ❌ No PIN columns found in profiles');
    }

    // 5. Test holiday approval functionality
    console.log('\n📋 5. Testing holiday approval update...');
    
    // First, get a sample user
    const { data: sampleUser, error: sampleError } = await supabase
      .from('kiosk_users')
      .select('user_id, holiday_approved')
      .limit(1)
      .maybeSingle();

    if (sampleUser) {
      console.log(`   📝 Sample user ID: ${sampleUser.user_id}`);
      console.log(`   📝 Current holiday_approved: ${sampleUser.holiday_approved}`);
      
      // Try to update (but don't actually change it)
      const { data: updateTest, error: updateError } = await supabase
        .from('kiosk_users')
        .update({ holiday_approved: sampleUser.holiday_approved }) // Same value to not change anything
        .eq('user_id', sampleUser.user_id)
        .select();

      if (updateError) {
        console.log('   ❌ Holiday approval update error:', updateError.message);
        console.log('   🔍 Error code:', updateError.code);
      } else {
        console.log('   ✅ Holiday approval update works');
      }
    } else {
      console.log('   ❌ No sample user found for testing');
    }

    // 6. Check all tables that might have PIN columns
    console.log('\n📋 6. Searching for all PIN-related columns...');
    const { data: allPinColumns, error: allPinError } = await supabase
      .from('information_schema.columns')
      .select('table_name, column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .or('column_name.like.%pin%,column_name.like.%hash%');

    if (allPinColumns && allPinColumns.length > 0) {
      console.log('   ✅ All PIN/hash columns across tables:');
      allPinColumns.forEach(col => {
        console.log(`     - ${col.table_name}.${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
      });
    }

    // 7. Test UUID validation issue
    console.log('\n📋 7. Testing UUID validation...');
    
    // Try different UUID formats that might cause issues
    const testUUIDs = [
      null,
      'null',
      undefined,
      'undefined',
      '',
      '123',
      'not-a-uuid'
    ];

    for (const testUUID of testUUIDs) {
      try {
        const { data, error } = await supabase
          .from('kiosk_users')
          .select('user_id')
          .eq('user_id', testUUID)
          .limit(1);
        
        if (error) {
          console.log(`   ❌ UUID "${testUUID}" causes error: ${error.message}`);
        } else {
          console.log(`   ✅ UUID "${testUUID}" works fine`);
        }
      } catch (e) {
        console.log(`   ❌ UUID "${testUUID}" throws exception: ${e.message}`);
      }
    }

  } catch (error) {
    console.error('💥 Investigation failed:', error);
  }
}

// Run the investigation
investigateSchema().then(() => {
  console.log('\n🎯 Investigation complete!');
}).catch(console.error);