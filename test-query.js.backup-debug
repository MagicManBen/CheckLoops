import { createClient } from '@supabase/supabase-js';

// Use local Supabase instance
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testQuery() {
  // Get some test GP practices with ODS codes
  const { data, error } = await supabase
    .from('CQC all GPs')
    .select('location_name, ods_code, postal_code')
    .not('ods_code', 'is', null)
    .limit(5);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Sample GP practices with ODS codes:');
    console.log(JSON.stringify(data, null, 2));
  }

  // Check if NHS_All_GPs table has any data
  const { data: nhsData, error: nhsError } = await supabase
    .from('NHS_All_GPs')
    .select('practice_ods_code, practice_name')
    .limit(5);

  console.log('\nNHS_All_GPs table contents:');
  if (nhsError) {
    console.error('Error:', nhsError);
  } else if (!nhsData || nhsData.length === 0) {
    console.log('Table is empty');
  } else {
    console.log(JSON.stringify(nhsData, null, 2));
  }
}

testQuery();