import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_wpy7lxfbI2HwvsznlWJVKg_Zx7HnAc4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkSiteTypes() {
  // Get unique site types
  const { data, error } = await supabase
    .from('gp_practices_cache')
    .select('primary_role')
    .limit(1000);

  if (error) {
    console.error('Error:', error);
    return;
  }

  const uniqueTypes = [...new Set(data.map(d => d.primary_role))].filter(Boolean).sort();
  console.log('Unique site types:', uniqueTypes);
  console.log('Total unique types:', uniqueTypes.length);

  // Get sample postcodes
  const { data: postcodes } = await supabase
    .from('gp_practices_cache')
    .select('postcode')
    .limit(100);

  const uniquePostcodes = [...new Set(postcodes.map(p => p.postcode))].filter(Boolean);
  console.log('\nSample postcodes:', uniquePostcodes.slice(0, 10));
}

checkSiteTypes();