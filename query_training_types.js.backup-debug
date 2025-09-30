import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseServiceKey = (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) || '';
if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY not set in environment');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function queryTrainingTypes() {
  console.log('Querying training_types table in Supabase...\n');
  
  try {
    // Get all training types
    const { data: trainingTypes, error } = await supabase
      .from('training_types')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching training types:', error);
      return;
    }
    
    console.log(`Found ${trainingTypes?.length || 0} training types:\n`);
    
    if (trainingTypes && trainingTypes.length > 0) {
      console.log('| ID | Name | Validity (months) | Clinical Required | Non-Clinical Required | Active |');
      console.log('|----|------|------------------|-------------------|----------------------|--------|');
      
      trainingTypes.forEach(type => {
        console.log(`| ${type.id} | ${type.name} | ${type.validity_months || 'No expiry'} | ${type.is_clinical_required ? 'Yes' : 'No'} | ${type.is_non_clinical_required ? 'Yes' : 'No'} | ${type.active ? 'Yes' : 'No'} |`);
      });
    } else {
      console.log('No training types found.');
    }
    
    // Also get the database schema for training_types
    console.log('\n--- Training Types Table Schema ---');
    
    const { data: schema, error: schemaError } = await supabase.rpc('get_table_definition', { 
      table_name: 'training_types' 
    });
    
    if (schemaError) {
      console.error('Error fetching schema:', schemaError);
      
      // Alternative approach if RPC fails
      console.log('Attempting to get schema information using system tables...');
      
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_name', 'training_types');
      
      if (!columnsError && columns) {
        console.log('Columns:');
        columns.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(required)'} ${col.column_default ? `Default: ${col.column_default}` : ''}`);
        });
      }
    } else {
      console.log(schema);
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

queryTrainingTypes();