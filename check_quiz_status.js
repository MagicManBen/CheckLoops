import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkQuizStatus() {
  try {
    console.log('Checking quiz status for benhowardmagic@hotmail.com...\n');
    
    // First, get the user's auth_user_id
    const { data: users, error: userError } = await supabase
      .from('master_users')
      .select('auth_user_id, email, next_quiz_due, last_required_quiz_at')
      .eq('email', 'benhowardmagic@hotmail.com')
      .single();

    if (userError) {
      console.error('Error getting user:', userError);
      return;
    }

    console.log('User data:');
    console.log('  email:', users.email);
    console.log('  auth_user_id:', users.auth_user_id);
    console.log('  next_quiz_due:', users.next_quiz_due);
    console.log('  last_required_quiz_at:', users.last_required_quiz_at);
    console.log('');

    // Check quiz_attempts
    const { data: attempts, error: attemptError } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', users.auth_user_id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(3);

    if (attemptError) {
      console.error('Error getting quiz attempts:', attemptError);
    } else {
      console.log('Recent quiz attempts:', attempts?.length || 0);
      if (attempts && attempts.length > 0) {
        attempts.forEach((attempt, i) => {
          console.log(`  [${i + 1}] completed_at: ${attempt.completed_at}, mode: ${attempt.mode}, score: ${attempt.score}`);
        });
      }
      console.log('');
    }

    // Calculate what the quiz status should be
    const now = new Date();
    console.log('Current time:', now.toISOString());
    console.log('');

    if (users.next_quiz_due) {
      const nextDue = new Date(users.next_quiz_due);
      console.log('Next quiz due:', nextDue.toISOString());
      
      if (now >= nextDue) {
        const overdueDays = Math.floor((now - nextDue) / (1000 * 60 * 60 * 24));
        const overdueHours = Math.floor((now - nextDue) / (1000 * 60 * 60));
        console.log(`❌ Quiz is OVERDUE by ${overdueDays} days (${overdueHours} hours)`);
      } else {
        const hoursUntilDue = (nextDue - now) / (1000 * 60 * 60);
        console.log(`✅ Quiz NOT due yet. Due in ${Math.floor(hoursUntilDue)} hours`);
      }
    } else {
      console.log('❓ No next_quiz_due set - quiz should be available');
    }

    // Check if there's a quiz attempt from the last attempt
    if (attempts && attempts.length > 0) {
      const lastAttempt = attempts[0];
      const completedAt = new Date(lastAttempt.completed_at);
      const nextDueCalc = new Date(completedAt);
      nextDueCalc.setDate(nextDueCalc.getDate() + 7);
      
      console.log('');
      console.log('Based on last quiz_attempts:');
      console.log('  Last completed:', completedAt.toISOString());
      console.log('  Next due (calculated):', nextDueCalc.toISOString());
      
      if (now >= nextDueCalc) {
        console.log('  ❌ Quiz should be AVAILABLE (7 days passed)');
      } else {
        const hoursUntil = (nextDueCalc - now) / (1000 * 60 * 60);
        console.log(`  ✅ Quiz locked for ${Math.floor(hoursUntil)} more hours`);
      }
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

checkQuizStatus();
