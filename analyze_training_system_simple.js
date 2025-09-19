import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeTrainingSystem() {
  console.log('Analyzing training system in Supabase...\n');
  
  try {
    // 1. Directly query training_types table
    console.log('SAMPLE TRAINING TYPES:');
    const { data: trainingTypes, error: typesError } = await supabase
      .from('training_types')
      .select('*')
      .limit(5);
    
    if (typesError) {
      console.error('Error fetching training types:', typesError);
    } else if (trainingTypes) {
      console.log(JSON.stringify(trainingTypes, null, 2));
    }
    
    // 2. Directly query training_records table
    console.log('\nSAMPLE TRAINING RECORDS:');
    const { data: trainingRecords, error: recordsError } = await supabase
      .from('training_records')
      .select('*')
      .limit(5);
    
    if (recordsError) {
      console.error('Error fetching training records:', recordsError);
    } else if (trainingRecords) {
      console.log(JSON.stringify(trainingRecords, null, 2));
    }
    
    // 3. Analyze validity periods from training_types
    console.log('\nANALYZING VALIDITY PERIODS:');
    const { data: allTypes, error: allTypesError } = await supabase
      .from('training_types')
      .select('name, validity_months')
      .order('validity_months');
    
    if (allTypesError) {
      console.error('Error fetching all types:', allTypesError);
    } else if (allTypes) {
      // Count by validity period
      const validityGroups = {};
      allTypes.forEach(type => {
        const period = type.validity_months || 'No expiry';
        if (!validityGroups[period]) {
          validityGroups[period] = [];
        }
        validityGroups[period].push(type.name);
      });
      
      // Print grouped results
      console.log('Training types grouped by validity period:');
      Object.keys(validityGroups).sort((a, b) => {
        // Sort numerically, with 'No expiry' at the end
        if (a === 'No expiry') return 1;
        if (b === 'No expiry') return -1;
        return parseInt(a) - parseInt(b);
      }).forEach(period => {
        console.log(`\n${period} months validity (${validityGroups[period].length} types):`);
        validityGroups[period].forEach(name => {
          console.log(`  - ${name}`);
        });
      });
    }
    
    // 4. Code analysis from staff-training.html
    console.log('\nDefault behavior from UI code:');
    console.log(`
    if (preselectedType.validity_months) {
      if (preselectedType.validity_months <= 1) {
        document.getElementById('training-expiry-period').value = '1month';
      } else if (preselectedType.validity_months <= 3) {
        document.getElementById('training-expiry-period').value = '3months';
      } else if (preselectedType.validity_months <= 6) {
        document.getElementById('training-expiry-period').value = '6months';
      } else if (preselectedType.validity_months <= 12) {
        document.getElementById('training-expiry-period').value = '1year';
      } else if (preselectedType.validity_months <= 24) {
        document.getElementById('training-expiry-period').value = '2years';
      } else {
        document.getElementById('training-expiry-period').value = '3years';
      }
    }
    `);
    
    console.log('\nConclusion: When adding a new training record, the expiry period dropdown defaults based on the validity_months of the selected training type. The UI automatically selects the appropriate option that matches or is just above the training type\'s validity_months value.');
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

analyzeTrainingSystem();