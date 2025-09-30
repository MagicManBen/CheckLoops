// Script to verify user data deletion from Supabase
import fetch from 'node-fetch';

// Supabase credentials
const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_ylIhDtikpno4LTTUmpDJvw_Ov7BtIEp';
const EMAIL_TO_DELETE = 'ben.howard@stoke.nhs.uk';

async function main() {
  console.log(`Verifying deletion of data for user: ${EMAIL_TO_DELETE}`);
  
  // Common tables to check
  const tablesToCheck = [
    'profiles',
    'users',
    'user_profiles',
    'staff',
    'employees',
    'holiday_requests',
    'records',
    'achievements',
    'sessions',
    'quiz_attempts',
    'training_records',
    'activity_logs',
    'notifications'
  ];
  
  let foundData = false;
  
  // Check each table for email matches
  for (const table of tablesToCheck) {
    console.log(`Checking ${table} table for email matches...`);
    
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/${table}?email=eq.${encodeURIComponent(EMAIL_TO_DELETE)}`,
        {
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          console.log(`⚠️ FOUND ${data.length} RECORDS in ${table} table with matching email`);
          foundData = true;
        } else {
          console.log(`✓ No records found in ${table} table with matching email`);
        }
      } else if (response.status === 404) {
        console.log(`Table ${table} doesn't exist - skipping`);
      } else {
        console.log(`Error checking ${table}: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`Error checking ${table}: ${error.message}`);
    }
    
    // Also check email variations
    const emailVariations = ['user_email', 'userEmail', 'email_address'];
    for (const emailCol of emailVariations) {
      try {
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/${table}?${emailCol}=eq.${encodeURIComponent(EMAIL_TO_DELETE)}`,
          {
            headers: {
              'apikey': SUPABASE_SERVICE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            console.log(`⚠️ FOUND ${data.length} RECORDS in ${table} table with matching ${emailCol}`);
            foundData = true;
          }
        }
      } catch (error) {
        // Silently continue if column doesn't exist
      }
    }
  }
  
  // Check if any data was found
  if (foundData) {
    console.log(`⚠️ Some data for ${EMAIL_TO_DELETE} still exists in the database`);
    return 1;
  } else {
    console.log(`✅ Verification complete - No data found for ${EMAIL_TO_DELETE}`);
    return 0;
  }
}

main().then(
  exitCode => process.exit(exitCode)
).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});