#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function diagnoseQuizSubmission() {
  console.log('🔍 Diagnosing quiz submission issue...\n');
  
  try {
    // Get your user record (assuming benhowardmagic@hotmail.com)
    const { data: users, error: userError } = await supabase
      .from('master_users')
      .select('auth_user_id, email, full_name, next_quiz_due, last_required_quiz_at')
      .eq('email', 'benhowardmagic@hotmail.com')
      .maybeSingle();

    if (userError) {
      console.error('❌ Error fetching user:', userError);
      return;
    }

    if (!users) {
      console.error('❌ User not found with email benhowardmagic@hotmail.com');
      return;
    }

    console.log('👤 User Profile:');
    console.log('  Email:', users.email);
    console.log('  Name:', users.full_name);
    console.log('  Auth User ID:', users.auth_user_id);
    console.log('  Next Quiz Due:', users.next_quiz_due || 'NOT SET');
    console.log('  Last Required Quiz At:', users.last_required_quiz_at || 'NOT SET');
    console.log('');

    // Check recent quiz attempts
    const { data: attempts, error: attemptError } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', users.auth_user_id)
      .order('completed_at', { ascending: false })
      .limit(5);

    if (attemptError) {
      console.error('❌ Error fetching quiz attempts:', attemptError);
      return;
    }

    console.log(`📊 Recent Quiz Attempts (${attempts?.length || 0} found):`);
    if (attempts && attempts.length > 0) {
      attempts.forEach((attempt, i) => {
        console.log(`\n  [${i + 1}] Attempt ID: ${attempt.id}`);
        console.log(`      Mode: ${attempt.mode || 'NOT SET'}`);
        console.log(`      Started: ${attempt.started_at || 'NOT SET'}`);
        console.log(`      Completed: ${attempt.completed_at || 'NOT COMPLETED'}`);
        console.log(`      Score: ${attempt.score_percent}% (${attempt.correct_answers}/${attempt.total_questions})`);
        console.log(`      Is Practice: ${attempt.is_practice}`);
      });
    } else {
      console.log('  ⚠️ NO ATTEMPTS FOUND');
    }
    console.log('');

    // Calculate what next_quiz_due SHOULD be
    if (attempts && attempts.length > 0) {
      const latestRequired = attempts.find(a => a.mode === 'required' && a.completed_at);
      
      if (latestRequired) {
        const completedAt = new Date(latestRequired.completed_at);
        const expectedNextDue = new Date(completedAt);
        expectedNextDue.setDate(expectedNextDue.getDate() + 7);
        
        console.log('🎯 Based on Latest Required Attempt:');
        console.log('  Completed At:', completedAt.toISOString());
        console.log('  Expected Next Due:', expectedNextDue.toISOString());
        console.log('  Actual Next Due:', users.next_quiz_due || 'NOT SET');
        
        if (users.next_quiz_due) {
          const actualNextDue = new Date(users.next_quiz_due);
          const diff = Math.abs(actualNextDue - expectedNextDue);
          if (diff > 60000) { // More than 1 minute difference
            console.log('  ⚠️ MISMATCH: master_users.next_quiz_due does NOT match expected value!');
          } else {
            console.log('  ✅ VALUES MATCH');
          }
        } else {
          console.log('  ❌ PROBLEM: next_quiz_due is NOT SET in master_users!');
        }
      } else {
        console.log('⚠️ No completed required quiz found in quiz_attempts');
      }
    }

    console.log('\n📋 DIAGNOSIS:');
    const now = new Date();
    
    // Check if the most recent attempt is the one just completed
    if (attempts && attempts.length > 0) {
      const mostRecent = attempts[0];
      const timeSinceCompletion = mostRecent.completed_at 
        ? (now - new Date(mostRecent.completed_at)) / 1000 
        : null;
      
      if (timeSinceCompletion !== null && timeSinceCompletion < 300) { // Within last 5 minutes
        console.log(`✅ Found recent quiz completion (${Math.floor(timeSinceCompletion)}s ago)`);
        console.log(`   Score: ${mostRecent.score_percent}% (${mostRecent.correct_answers}/${mostRecent.total_questions})`);
        console.log(`   Mode: ${mostRecent.mode}`);
        
        if (!users.next_quiz_due || !users.last_required_quiz_at) {
          console.log('\n❌ ISSUE FOUND: master_users fields were NOT updated!');
          console.log('   This is why the dashboard shows no change.');
          console.log('\n💡 SOLUTION: The quiz submission code should have updated master_users.');
          console.log('   Check if there was a Supabase error during submission.');
        } else {
          console.log('\n✅ master_users was updated correctly');
          console.log('   Dashboard should refresh on next page load.');
        }
      } else {
        console.log('⚠️ No recent quiz completion found (last was >5 minutes ago)');
      }
    }

  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

diagnoseQuizSubmission();
