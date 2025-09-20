import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkQuizSubmission() {
  console.log('Checking quiz submission in Supabase for benhowardmagic@hotmail.com...');
  
  try {
    // Login as admin first
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'benhowardmagic@hotmail.com',
      password: 'Hello1!'
    });

    if (authError) {
      console.error('Auth error:', authError);
      return;
    }

    console.log('Successfully logged in as admin');
    
    // Get user ID
    const userId = authData.user.id;
    
    // Check master_users table
    const { data: masterUser, error: masterError } = await supabase
      .from('master_users')
      .select('next_quiz_due, last_required_quiz_at')
      .eq('auth_user_id', userId)
      .maybeSingle();
    
    if (masterError) {
      console.error('Error fetching master_users:', masterError);
    } else {
      console.log('\nMASTER_USERS DATA:');
      console.log(`Next quiz due: ${masterUser.next_quiz_due}`);
      console.log(`Last quiz taken: ${masterUser.last_required_quiz_at || 'Not completed'}`);
      
      // Determine if record exists and quiz is marked as completed
      if (masterUser.last_required_quiz_at) {
        const nextDue = new Date(masterUser.next_quiz_due);
        const lastTaken = new Date(masterUser.last_required_quiz_at);
        console.log(`Quiz taken on: ${lastTaken.toLocaleString()}`);
        console.log(`Next quiz due on: ${nextDue.toLocaleString()}`);
        console.log('✅ Quiz has been recorded successfully in master_users table');
      } else {
        console.log('❌ No quiz completion record found in master_users');
      }
    }
    
    // Check quiz_practices table
    const { data: practices, error: practicesError } = await supabase
      .from('quiz_practices')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(5);
    
    if (practicesError) {
      console.error('Error fetching quiz_practices:', practicesError);
    } else {
      console.log('\nQUIZ_PRACTICES DATA:');
      if (practices && practices.length > 0) {
        console.log(`Found ${practices.length} quiz practice records`);
        practices.forEach((quiz, index) => {
          console.log(`Quiz ${index + 1}:`);
          console.log(`  Completed: ${quiz.completed_at}`);
          console.log(`  Score: ${quiz.score}/${quiz.total_questions} (${quiz.score_percent || Math.round((quiz.score/quiz.total_questions)*100)}%)`);
        });
      } else {
        console.log('No practice quiz records found');
      }
    }
    
    // Check quiz_attempts table
    const { data: attempts, error: attemptsError } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(5);
    
    if (attemptsError) {
      console.error('Error fetching quiz_attempts:', attemptsError);
    } else {
      console.log('\nQUIZ_ATTEMPTS DATA:');
      if (attempts && attempts.length > 0) {
        console.log(`Found ${attempts.length} quiz attempt records`);
        attempts.forEach((quiz, index) => {
          console.log(`Attempt ${index + 1}:`);
          console.log(`  Completed: ${quiz.completed_at}`);
          console.log(`  Score: ${quiz.correct_answers}/${quiz.total_questions} (${quiz.score_percent || Math.round((quiz.correct_answers/quiz.total_questions)*100)}%)`);
          console.log(`  Practice: ${quiz.is_practice ? 'Yes' : 'No'}`);
        });
      } else {
        console.log('No quiz attempt records found');
      }
    }
    
    console.log('\nSUMMARY:');
    if (masterUser?.last_required_quiz_at) {
      console.log('✅ The quiz submission appears to have been recorded successfully in the master_users table');
      if ((practices && practices.length > 0) || (attempts && attempts.length > 0)) {
        console.log('✅ Quiz attempt records were also found in auxiliary tables');
      } else {
        console.log('⚠️ No quiz attempt records were found in auxiliary tables, but this is OK since master_users is the source of truth');
      }
    } else {
      console.log('❌ The quiz submission may not have been recorded properly in master_users');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkQuizSubmission();