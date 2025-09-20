import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const serviceKey = (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) || '';
if (!serviceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY not set in environment');
}

const supabase = createClient(supabaseUrl, serviceKey);

async function checkKioskUsersSchema() {
  console.log('🔍 Checking master_users table schema...');
  
  try {
    // Check master_users table structure
    const { data: kioskSample, error: kioskError } = await supabase
      .from('master_users')
      .select('*')
      .limit(1);
    
    if (kioskError) {
      console.error('Error accessing kiosk_users:', kioskError);
      return;
    }
    
    if (kioskSample && kioskSample[0]) {
      console.log('kiosk_users columns:', Object.keys(kioskSample[0]));
      console.log('Sample record:', kioskSample[0]);
    } else {
      console.log('master_users table is empty');
    }
    
    // Check master_users table to see how it maps to auth users
    console.log('\n🔍 Checking master_users table schema...');
    const { data: profilesSample, error: profilesError } = await supabase
      .from('master_users')
      .select('*')
      .limit(3);
    
    if (profilesError) {
      console.error('Error accessing profiles:', profilesError);
      return;
    }
    
    if (profilesSample && profilesSample[0]) {
      console.log('profiles columns:', Object.keys(profilesSample[0]));
      profilesSample.forEach((profile, i) => {
        console.log(`Sample profile ${i + 1}:`, {
          user_id: profile.user_id,
          full_name: profile.full_name,
          kiosk_user_id: profile.kiosk_user_id || 'null'
        });
      });
    }
    
    // Check training_records current structure
    console.log('\n🔍 Checking training_records current schema...');
    const { data: trainingRecs, error: trainingError } = await supabase
      .from('training_records')
      .select('*')
      .limit(3);
    
    if (trainingError) {
      console.error('Error accessing training_records:', trainingError);
      return;
    }
    
    if (trainingRecs && trainingRecs[0]) {
      console.log('training_records columns:', Object.keys(trainingRecs[0]));
      trainingRecs.forEach((record, i) => {
        console.log(`Sample training record ${i + 1}:`, {
          id: record.id,
          staff_id: record.staff_id,
          user_id: record.user_id || 'null',
          site_id: record.site_id
        });
      });
    } else {
      console.log('training_records table is empty');
    }
    
  } catch (error) {
    console.error('Failed to check schemas:', error);
  }
}

checkKioskUsersSchema().catch(console.error);