import { createClient } from '@supabase/supabase-js';

// Hardcode the config values for Node.js
const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyTrainingRecords() {
  console.log('Checking training records in Supabase...\n');
  
  try {
    // Get recent training records
    const { data: records, error } = await supabase
      .from('training_records')
      .select(`
        *,
        training_types (
          name,
          validity_months
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('Error fetching records:', error);
      return;
    }
    
    console.log(`Found ${records?.length || 0} recent training records:\n`);
    
    if (records && records.length > 0) {
      records.forEach((record, index) => {
        console.log(`Record ${index + 1}:`);
        console.log(`  ID: ${record.id}`);
        console.log(`  Training Type: ${record.training_types?.name || 'Unknown'}`);
        console.log(`  Staff ID: ${record.staff_id}`);
        console.log(`  Site ID: ${record.site_id}`);
        console.log(`  Completion Date: ${record.completion_date}`);
        console.log(`  Expiry Date: ${record.expiry_date || 'No expiry'}`);
        console.log(`  Notes: ${record.notes || 'None'}`);
        console.log(`  Certificate: ${record.certificate_url ? 'Yes' : 'No'}`);
        console.log(`  Created: ${new Date(record.created_at).toLocaleString()}`);
        console.log('');
      });
      
      // Check for test records
      const testRecords = records.filter(r => 
        r.notes && r.notes.toLowerCase().includes('test')
      );
      
      if (testRecords.length > 0) {
        console.log(`✅ Found ${testRecords.length} test record(s) - the training save functionality is working!`);
        console.log('\nMost recent test record:');
        const latest = testRecords[0];
        console.log(`  - Type: ${latest.training_types?.name}`);
        console.log(`  - Completed: ${latest.completion_date}`);
        console.log(`  - Expires: ${latest.expiry_date || 'No expiry'}`);
        console.log(`  - Notes: ${latest.notes}`);
      }
    } else {
      console.log('No training records found.');
    }
    
    // Also check training types
    console.log('\n--- Training Types ---');
    const { data: types, error: typesError } = await supabase
      .from('training_types')
      .select('*')
      .eq('active', true)
      .eq('site_id', 2)  // Assuming site_id 2 based on earlier data
      .order('name');
    
    if (!typesError && types) {
      console.log(`Found ${types.length} active training types for site 2:`);
      types.forEach(type => {
        console.log(`  - ${type.name} (validity: ${type.validity_months || 'No expiry'} months)`);
      });
    }
    
    // Check kiosk users to understand staff IDs
    console.log('\n--- Kiosk Users (Staff) ---');
    const { data: users, error: usersError } = await supabase
      .from('kiosk_users')
      .select('id, full_name, role')
      .eq('site_id', 2)
      .eq('active', true)
      .limit(5);
    
    if (!usersError && users) {
      console.log(`Sample staff members:`);
      users.forEach(user => {
        console.log(`  - ID ${user.id}: ${user.full_name} (${user.role})`);
      });
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

verifyTrainingRecords();