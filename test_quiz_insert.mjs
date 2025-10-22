#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function testQuizInsert() {
  console.log('🧪 Testing quiz_attempts insert with ANON key...\n');
  
  const testUserId = '61b3f0ba-1ffc-4bfc-82f6-30148aa62b76'; // Your auth_user_id
  
  try {
    const now = new Date();
    const testAttempt = {
      site_id: null,
      user_id: testUserId,
      mode: 'required',
      started_at: new Date(now.getTime() - 5 * 60 * 1000).toISOString(), // 5 mins ago
      completed_at: now.toISOString(),
      total_questions: 10,
      correct_answers: 2,
      score_percent: 20,
      is_practice: false
    };
    
    console.log('Attempting to insert:', testAttempt);
    console.log('');
    
    const { data, error } = await supabase
      .from('quiz_attempts')
      .insert(testAttempt)
      .select();
    
    if (error) {
      console.error('❌ INSERT FAILED:');
      console.error('   Code:', error.code);
      console.error('   Message:', error.message);
      console.error('   Details:', error.details);
      console.error('   Hint:', error.hint);
      console.log('\n💡 LIKELY ISSUE: RLS (Row Level Security) policy blocking insert with anon key');
      console.log('   The quiz submission code runs in browser with anon key, not service_role');
    } else {
      console.log('✅ INSERT SUCCESSFUL:');
      console.log('   Attempt ID:', data[0]?.id);
      console.log('   Data:', data);
    }
    
    console.log('\n🔍 Now testing master_users UPDATE...');
    
    const nextDue = new Date(now);
    nextDue.setDate(nextDue.getDate() + 7);
    
    const { error: updateErr } = await supabase
      .from('master_users')
      .update({
        next_quiz_due: nextDue.toISOString(),
        last_required_quiz_at: now.toISOString()
      })
      .eq('auth_user_id', testUserId);
    
    if (updateErr) {
      console.error('❌ UPDATE FAILED:');
      console.error('   Code:', updateErr.code);
      console.error('   Message:', updateErr.message);
      console.error('   Details:', updateErr.details);
    } else {
      console.log('✅ UPDATE SUCCESSFUL');
    }
    
  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

testQuizInsert();
