import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeTrainingSystem() {
  console.log('Analyzing training system in Supabase...\n');
  
  try {
    // 1. Get training_types table structure
    console.log('TRAINING TYPES TABLE STRUCTURE:');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'training_types');
    
    if (columnsError) {
      console.error('Error fetching columns:', columnsError);
    } else if (columns) {
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(required)'} ${col.column_default ? `Default: ${col.column_default}` : ''}`);
      });
    }
    
    // 2. Get a sample of training types
    console.log('\nSAMPLE TRAINING TYPES:');
    const { data: trainingTypes, error: typesError } = await supabase
      .from('training_types')
      .select('*')
      .limit(5);
    
    if (typesError) {
      console.error('Error fetching training types:', typesError);
    } else if (trainingTypes) {
      console.log(JSON.stringify(trainingTypes, null, 2));
    }
    
    // 3. Get training_records table structure
    console.log('\nTRAINING RECORDS TABLE STRUCTURE:');
    const { data: recordColumns, error: recordColumnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'training_records');
    
    if (recordColumnsError) {
      console.error('Error fetching record columns:', recordColumnsError);
    } else if (recordColumns) {
      recordColumns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(required)'} ${col.column_default ? `Default: ${col.column_default}` : ''}`);
      });
    }
    
    // 4. Get a sample of training records
    console.log('\nSAMPLE TRAINING RECORDS:');
    const { data: trainingRecords, error: recordsError } = await supabase
      .from('training_records')
      .select(`
        *,
        training_types (
          name,
          validity_months
        )
      `)
      .limit(5);
    
    if (recordsError) {
      console.error('Error fetching training records:', recordsError);
    } else if (trainingRecords) {
      console.log(JSON.stringify(trainingRecords, null, 2));
    }
    
    // 5. Analyze default validity periods
    console.log('\nANALYZING DEFAULT VALIDITY PERIODS:');
    const { data: allTypes, error: allTypesError } = await supabase
      .from('training_types')
      .select('name, validity_months')
      .order('validity_months');
    
    if (allTypesError) {
      console.error('Error fetching all types:', allTypesError);
    } else if (allTypes) {
      // Group by validity period
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
    
    // 6. Check if there's a UI mapping between dropdown values and actual validity months
    console.log('\nANALYZING EXPIRY PERIOD MAPPING:');
    console.log('Looking for UI dropdown values and their relation to validity_months...');
    
    // Based on staff-training.html, the dropdown values are:
    const uiExpiryOptions = [
      { value: '1week', label: '1 Week', days: 7 },
      { value: '1month', label: '1 Month', months: 1 },
      { value: '3months', label: '3 Months', months: 3 },
      { value: '6months', label: '6 Months', months: 6 },
      { value: '1year', label: '1 Year', months: 12 },
      { value: '2years', label: '2 Years', months: 24 },
      { value: '3years', label: '3 Years', months: 36 },
      { value: 'never', label: 'No Expiry', months: null }
    ];
    
    console.log('UI Dropdown options:', uiExpiryOptions.map(o => `${o.label} (${o.value})`).join(', '));
    
    // Check for any missing options
    const uniqueValidityMonths = [...new Set(allTypes.map(t => t.validity_months).filter(v => v !== null))];
    console.log('\nUnique validity_months in database:', uniqueValidityMonths.sort((a, b) => a - b).join(', '));
    
    const dbMonths = new Set(uniqueValidityMonths);
    const uiMonths = new Set(uiExpiryOptions.filter(o => o.months).map(o => o.months));
    
    const missingFromUI = [...dbMonths].filter(m => !uiMonths.has(m));
    if (missingFromUI.length > 0) {
      console.log('⚠️ Warning: These validity periods exist in the database but not in the UI dropdown:', missingFromUI.join(', '));
    } else {
      console.log('✅ All database validity periods are represented in the UI dropdown.');
    }
    
    // 7. Look for default behavior
    console.log('\nDEFAULT BEHAVIOR ANALYSIS:');
    
    // Code analysis from staff-training.html
    console.log('From the UI code, when opening the training modal with a preselected type:');
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