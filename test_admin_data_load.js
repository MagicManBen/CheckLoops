import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Use the same config as the app
const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME';

async function checkAndClearQuizData() {
  console.log('🔍 Connecting to remote Supabase database...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // First, let's authenticate as the test user
  console.log('🔑 Authenticating as test user...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'ben.howard@stoke.nhs.uk',
    password: 'Hello1!'
  });
  
  if (authError) {
    console.error('❌ Authentication failed:', authError);
    return;
  }
  
  console.log('✅ Authentication successful');
  const userId = authData.user.id;
  console.log('👤 User ID:', userId);
  
  // Check current quiz_attempts data
  console.log('\n📊 Checking current quiz_attempts data...');
  const { data: attempts, error: attemptsError } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });
  
  if (attemptsError) {
    console.error('❌ Error fetching quiz_attempts:', attemptsError);
  } else {
    console.log(`📝 Found ${attempts?.length || 0} quiz attempts for this user`);
    if (attempts && attempts.length > 0) {
      attempts.forEach((attempt, index) => {
        console.log(`  ${index + 1}. ID: ${attempt.id}, Completed: ${attempt.completed_at}, Score: ${attempt.correct_answers}/${attempt.total_questions}, Practice: ${attempt.is_practice}`);
      });
    }
  }
  
  // Check current quiz_practices data
  console.log('\n🎯 Checking current quiz_practices data...');
  const { data: practices, error: practicesError } = await supabase
    .from('quiz_practices')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });
  
  if (practicesError) {
    console.error('❌ Error fetching quiz_practices:', practicesError);
  } else {
    console.log(`🎯 Found ${practices?.length || 0} quiz practices for this user`);
    if (practices && practices.length > 0) {
      practices.forEach((practice, index) => {
        console.log(`  ${index + 1}. ID: ${practice.id}, Completed: ${practice.completed_at}, Score: ${practice.score}/${practice.total_questions}`);
      });
    }
  }
  
  // Clear all quiz attempts for this user
  console.log('\n🗑️ Clearing all quiz attempts...');
  const { error: deleteAttemptsError } = await supabase
    .from('quiz_attempts')
    .delete()
    .eq('user_id', userId);
  
  if (deleteAttemptsError) {
    console.error('❌ Error deleting quiz_attempts:', deleteAttemptsError);
  } else {
    console.log('✅ Quiz attempts cleared successfully');
  }
  
  // Clear all quiz practices for this user
  console.log('🗑️ Clearing all quiz practices...');
  const { error: deletePracticesError } = await supabase
    .from('quiz_practices')
    .delete()
    .eq('user_id', userId);
  
  if (deletePracticesError) {
    console.error('❌ Error deleting quiz_practices:', deletePracticesError);
  } else {
    console.log('✅ Quiz practices cleared successfully');
  }
  
  // Verify data is cleared
  console.log('\n🔍 Verifying data is cleared...');
  
  const { data: verifyAttempts } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('user_id', userId);
  
  const { data: verifyPractices } = await supabase
    .from('quiz_practices')
    .select('*')
    .eq('user_id', userId);
  
  console.log(`📝 Remaining quiz attempts: ${verifyAttempts?.length || 0}`);
  console.log(`🎯 Remaining quiz practices: ${verifyPractices?.length || 0}`);
  
  console.log('\n✅ Database clearing completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Run the quiz test to submit a required quiz');
  console.log('2. Check the database again to see where it was saved');
}

checkAndClearQuizData().catch(console.error);