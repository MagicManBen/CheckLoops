#!/usr/bin/env node
// delete_supabase_user.js - A utility script to delete all data for a user from Supabase
import fetch from 'node-fetch';

// Get email from command line argument
const EMAIL_TO_DELETE = process.argv[2];

if (!EMAIL_TO_DELETE) {
  console.error('Please provide an email address as an argument: node delete_supabase_user.js <email>');
  process.exit(1);
}

// Supabase credentials
const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_ylIhDtikpno4LTTUmpDJvw_Ov7BtIEp';

async function main() {
  try {
    console.log(`Starting deletion process for user: ${EMAIL_TO_DELETE}`);
    
    // Step 1: Find user ID
    console.log('Finding user ID...');
    let userId = null;
    
    // Check profiles table
    try {
      const profilesResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(EMAIL_TO_DELETE)}`,
        {
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
          }
        }
      );
      
      if (profilesResponse.ok) {
        const profiles = await profilesResponse.json();
        if (profiles && profiles.length > 0) {
          userId = profiles[0].user_id || profiles[0].id;
          console.log(`Found user with ID: ${userId} in profiles table`);
        }
      }
    } catch (error) {
      console.log(`Error checking profiles: ${error.message}`);
    }
    
    // Step 2: List common table names to check
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
    
    // Step 3: Process each table
    for (const tableName of tablesToCheck) {
      console.log(`Processing ${tableName}...`);
      
      // Try to delete by email
      try {
        const emailDeleteResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/${tableName}?email=eq.${encodeURIComponent(EMAIL_TO_DELETE)}`,
          {
            method: 'DELETE',
            headers: {
              'apikey': SUPABASE_SERVICE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
            }
          }
        );
        
        if (emailDeleteResponse.ok) {
          console.log(`Deleted rows from ${tableName} by email`);
        }
      } catch (error) {
        // Silently continue if table doesn't exist or no email column
      }
      
      // Try email variations
      const emailVariations = ['user_email', 'userEmail', 'email_address'];
      for (const emailCol of emailVariations) {
        try {
          const emailVarDeleteResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/${tableName}?${emailCol}=eq.${encodeURIComponent(EMAIL_TO_DELETE)}`,
            {
              method: 'DELETE',
              headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
              }
            }
          );
          
          if (emailVarDeleteResponse.ok) {
            console.log(`Deleted rows from ${tableName} by ${emailCol}`);
          }
        } catch (error) {
          // Silently continue if this variation doesn't exist
        }
      }
      
      // If we found a user ID, try to delete by user_id
      if (userId) {
        try {
          const userIdDeleteResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/${tableName}?user_id=eq.${encodeURIComponent(userId)}`,
            {
              method: 'DELETE',
              headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
              }
            }
          );
          
          if (userIdDeleteResponse.ok) {
            console.log(`Deleted rows from ${tableName} by user_id`);
          }
        } catch (error) {
          // Silently continue if table doesn't exist or no user_id column
        }
        
        // Try ID variations
        const idVariations = ['userId', 'userid', 'user', 'id'];
        for (const idCol of idVariations) {
          try {
            const idVarDeleteResponse = await fetch(
              `${SUPABASE_URL}/rest/v1/${tableName}?${idCol}=eq.${encodeURIComponent(userId)}`,
              {
                method: 'DELETE',
                headers: {
                  'apikey': SUPABASE_SERVICE_KEY,
                  'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
                }
              }
            );
            
            if (idVarDeleteResponse.ok) {
              console.log(`Deleted rows from ${tableName} by ${idCol}`);
            }
          } catch (error) {
            // Silently continue if this variation doesn't exist
          }
        }
      }
    }
    
    // Step 4: Verification
    console.log('\nVerifying deletion...');
    let foundData = false;
    
    for (const tableName of tablesToCheck) {
      try {
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/${tableName}?email=eq.${encodeURIComponent(EMAIL_TO_DELETE)}`,
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
            console.log(`⚠️ FOUND ${data.length} RECORDS in ${tableName} with matching email`);
            foundData = true;
          }
        }
      } catch (error) {
        // Silently continue if table doesn't exist
      }
      
      // Check by user ID if available
      if (userId) {
        try {
          const response = await fetch(
            `${SUPABASE_URL}/rest/v1/${tableName}?user_id=eq.${encodeURIComponent(userId)}`,
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
              console.log(`⚠️ FOUND ${data.length} RECORDS in ${tableName} with matching user_id`);
              foundData = true;
            }
          }
        } catch (error) {
          // Silently continue if table doesn't exist
        }
      }
    }
    
    if (foundData) {
      console.log(`⚠️ Some data for ${EMAIL_TO_DELETE} still exists in the database`);
    } else {
      console.log(`✅ Verification complete - No data found for ${EMAIL_TO_DELETE}`);
    }
    
    console.log('\nDeletion process completed');
  } catch (error) {
    console.error('Error during deletion process:', error);
  }
}

main().catch(err => console.error('Fatal error:', err));