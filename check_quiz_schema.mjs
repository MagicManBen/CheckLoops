#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkSchema() {
  console.log('🔍 Checking quiz_attempts schema...\n');
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT column_name, data_type, is_generated, generation_expression
        FROM information_schema.columns
        WHERE table_name = 'quiz_attempts'
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `
    });
    
    if (error) {
      // Try direct query instead
      const result = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: `SELECT column_name, data_type, is_generated, generation_expression FROM information_schema.columns WHERE table_name = 'quiz_attempts' AND table_schema = 'public' ORDER BY ordinal_position;`
        })
      });
      
      console.log('Schema columns for quiz_attempts:');
      console.log(await result.text());
    } else {
      console.log('Schema:', data);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkSchema();
