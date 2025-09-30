#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const ANON_KEY = 'sb_publishable_wpy7lxfbI2HwvsznlWJVKg_Zx7HnAc4';

const anonClient = createClient(SUPABASE_URL, ANON_KEY);

console.log('\nTesting what UPDATE actually returns...\n');

const { data, error } = await anonClient
  .from('CQC All GPs')
  .update({ updated_at: new Date().toISOString() })
  .eq('location_id', '1-11309361439')
  .select('*');

console.log('Error:', error);
console.log('Data is null?', data === null);
console.log('Data is array?', Array.isArray(data));
console.log('Data length:', data?.length);
console.log('First item:', data?.[0]?.location_id, data?.[0]?.location_name);
