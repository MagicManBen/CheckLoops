#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function testFixedInsert() {
  console.log('🧪 Testing FIXED quiz_attempts insert (without score_percent)...\n');
  
  const testUserId = '61b3f0ba-1ffc-4bfc-82f6-30148aa62b76';
  
  try {
    const now = new Date();
    const testAttempt = {
      site_id: null,
      user_id: testUserId,
      mode: 'required',
      started_at: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
      completed_at: now.toISOString(),
      total_questions: 10,
      correct_answers: 2,
      // score_percent removed - it's a generated column
      is_practice: false
    };
    
    console.log('Attempting to insert:', testAttempt);
    console.log('');
    
    const { data, error } = await supabase
      .from('quiz_attempts')
      .insert(testAttempt)
      .select();
    
    if (error) {
      console.error('❌ INSERT STILL FAILED:');
      console.error('   Code:', error.code);
      console.error('   Message:', error.message);
      console.error('   Details:', error.details);
    } else {
      console.log('✅ INSERT SUCCESSFUL!');
      console.log('   Attempt ID:', data[0]?.id);
      console.log('   Score Percent (generated):', data[0]?.score_percent);
      console.log('   Full data:', data[0]);
      
      // Clean up test data
      console.log('\n🧹 Cleaning up test record...');
      await supabase.from('quiz_attempts').delete().eq('id', data[0].id);
      console.log('✅ Test record deleted');
    }
    
  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

testFixedInsert();
