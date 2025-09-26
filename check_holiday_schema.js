import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseKey = 'sb_secret_ylIhDtikpno4LTTUmpDJvw_Ov7BtIEp';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  try {
    // Get master_users sample
    console.log('Checking master_users sample data...');
    const { data: masterSample, error: muError } = await supabase
      .from('master_users')
      .select('*')
      .limit(1);
    
    if (muError) {
      console.error('Error fetching master_users sample:', muError);
    } else if (masterSample && masterSample.length > 0) {
      console.log('master_users columns:', Object.keys(masterSample[0]));
    }

    // Check 4_holiday_requests sample
    console.log('\nChecking 4_holiday_requests sample data...');
    const { data: holidaySample, error: hrError } = await supabase
      .from('4_holiday_requests')
      .select('*')
      .limit(1);
    
    if (hrError) {
      console.error('Error fetching 4_holiday_requests sample:', hrError);
    } else if (holidaySample && holidaySample.length > 0) {
      console.log('4_holiday_requests columns:', Object.keys(holidaySample[0]));
    }

    // Check holiday_taken and approved-holidays-used columns
    console.log('\nChecking sample data from master_users...');
    const { data: sampleUsers, error: suError } = await supabase
      .from('master_users')
      .select('id, auth_user_id, full_name, holiday_taken, approved_holidays_used')
      .limit(5);
    
    if (suError) {
      console.error('Error fetching sample users:', suError);
    } else {
      console.log('Sample users:');
      console.table(sampleUsers);
    }

    // Check sample holiday requests with correct columns
    console.log('\nChecking approved holiday requests...');
    const { data: sampleHolidays, error: shError } = await supabase
      .from('4_holiday_requests')
      .select('*')
      .eq('status', 'approved')
      .limit(10);
    
    if (shError) {
      console.error('Error fetching sample holiday requests:', shError);
    } else {
      console.log('Sample approved holiday requests:');
      console.table(sampleHolidays);
      
      // Count how many holiday requests exist per user
      console.log('\nCounting approved holiday requests per user...');
      const { data: countData, error: countError } = await supabase
        .from('4_holiday_requests')
        .select('user_id, count(*)', { count: 'exact' })
        .eq('status', 'approved')
        .group('user_id');
        
      if (countError) {
        console.error('Error counting holiday requests:', countError);
      } else {
        console.log('Holiday counts per user:');
        console.table(countData);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkSchema();