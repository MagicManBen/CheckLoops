#!/usr/bin/env node

// This script adds the mode column to quiz_attempts via Supabase SQL API
import fetch from 'node-fetch';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

async function executeSql(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`
    },
    body: JSON.stringify({ query: sql })
  });
  
  const result = await response.text();
  return { status: response.status, result };
}

async function main() {
  console.log('Attempting to add mode column to quiz_attempts...\n');
  
  const sql = `
    ALTER TABLE quiz_attempts 
    ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'required';
    
    UPDATE quiz_attempts 
    SET mode = CASE 
      WHEN is_practice = true THEN 'practice'
      ELSE 'required'
    END;
  `;
  
  try {
    const { status, result } = await executeSql(sql);
    console.log('Response status:', status);
    console.log('Response:', result);
    
    if (status === 200) {
      console.log('\n✅ Successfully added mode column!');
    } else {
      console.log('\n⚠️ Note: exec_sql RPC may not be available.');
      console.log('\nPlease run this SQL manually in Supabase SQL Editor:');
      console.log('\n' + sql);
    }
  } catch (err) {
    console.error('Error:', err.message);
    console.log('\n📝 Please run this SQL manually in Supabase SQL Editor:');
    console.log('\n' + sql);
  }
}

main();
