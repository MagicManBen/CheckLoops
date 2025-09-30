import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNjM0MzAyMCwiZXhwIjoyMDQxOTE5MDIwfQ.nV3xSrLVHL50Zqp_DeZsgA_lLAYAaQs';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function investigateQuizSubmission() {
  console.log('🔍 Investigating quiz submission for benhowardmagic@hotmail.com...');
  
  try {
    // First, get the user's auth_user_id from master_users
    const { data: masterUsers, error: masterError } = await supabase
      .from('master_users')
      .select('auth_user_id, site_id, last_required_quiz_at, next_quiz_due, email')
      .eq('email', 'benhowardmagic@hotmail.com');

    if (masterError) {
      console.error('❌ Error fetching master_users:', masterError);
      return;
    }

    if (!masterUsers || masterUsers.length === 0) {
      console.log('❌ No master_users record found for benhowardmagic@hotmail.com');
      return;
    }

    const user = masterUsers[0];
    console.log('\n📊 MASTER_USERS RECORD:');
    console.log('  Email:', user.email);
    console.log('  Auth User ID:', user.auth_user_id);
    console.log('  Site ID:', user.site_id);
    console.log('  Last Required Quiz At:', user.last_required_quiz_at);
    console.log('  Next Quiz Due:', user.next_quiz_due);

    // Check quiz_attempts table (main table for quiz submissions)
    console.log('\n🎯 CHECKING QUIZ_ATTEMPTS TABLE:');
    const { data: quizAttempts, error: attemptsError } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', user.auth_user_id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (attemptsError) {
      console.error('❌ Error fetching quiz_attempts:', attemptsError);
    } else {
      console.log(`  Found ${quizAttempts?.length || 0} quiz attempt records`);
      if (quizAttempts && quizAttempts.length > 0) {
        quizAttempts.forEach((attempt, index) => {
          console.log(`\n  Attempt ${index + 1}:`);
          console.log('    ID:', attempt.id);
          console.log('    Site ID:', attempt.site_id);
          console.log('    Started At:', attempt.started_at);
          console.log('    Completed At:', attempt.completed_at);
          console.log('    Total Questions:', attempt.total_questions);
          console.log('    Correct Answers:', attempt.correct_answers);
          console.log('    Score Percent:', attempt.score_percent);
          console.log('    Is Practice:', attempt.is_practice);
          console.log('    Created At:', attempt.created_at);
          console.log('    Updated At:', attempt.updated_at);
        });
      } else {
        console.log('  ❌ No quiz attempt records found');
      }
    }

    // Check quiz_practices table (for practice quizzes)
    console.log('\n📚 CHECKING QUIZ_PRACTICES TABLE:');
    const { data: quizPractices, error: practicesError } = await supabase
      .from('quiz_practices')
      .select('*')
      .eq('user_id', user.auth_user_id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (practicesError) {
      console.error('❌ Error fetching quiz_practices:', practicesError);
    } else {
      console.log(`  Found ${quizPractices?.length || 0} quiz practice records`);
      if (quizPractices && quizPractices.length > 0) {
        quizPractices.forEach((practice, index) => {
          console.log(`\n  Practice ${index + 1}:`);
          console.log('    ID:', practice.id);
          console.log('    Site ID:', practice.site_id);
          console.log('    Started At:', practice.started_at);
          console.log('    Completed At:', practice.completed_at);
          console.log('    Total Questions:', practice.total_questions);
          console.log('    Score:', practice.score);
          console.log('    Score Percent:', practice.score_percent);
          console.log('    Created At:', practice.created_at);
          console.log('    Updated At:', practice.updated_at);
        });
      } else {
        console.log('  ❌ No quiz practice records found');
      }
    }

    // Check recent entries in both tables (last 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    
    console.log('\n🕒 CHECKING RECENT SUBMISSIONS (last 10 minutes):');
    
    const { data: recentAttempts, error: recentAttemptsError } = await supabase
      .from('quiz_attempts')
      .select('*')
      .gte('created_at', tenMinutesAgo)
      .order('created_at', { ascending: false });

    if (recentAttemptsError) {
      console.error('❌ Error fetching recent quiz_attempts:', recentAttemptsError);
    } else {
      console.log(`  Recent quiz_attempts: ${recentAttempts?.length || 0}`);
      if (recentAttempts && recentAttempts.length > 0) {
        recentAttempts.forEach((attempt, index) => {
          console.log(`\n  Recent Attempt ${index + 1}:`);
          console.log('    User ID:', attempt.user_id);
          console.log('    Site ID:', attempt.site_id);
          console.log('    Is Practice:', attempt.is_practice);
          console.log('    Score:', `${attempt.correct_answers}/${attempt.total_questions} (${attempt.score_percent}%)`);
          console.log('    Created At:', attempt.created_at);
        });
      }
    }

    const { data: recentPractices, error: recentPracticesError } = await supabase
      .from('quiz_practices')
      .select('*')
      .gte('created_at', tenMinutesAgo)
      .order('created_at', { ascending: false });

    if (recentPracticesError) {
      console.error('❌ Error fetching recent quiz_practices:', recentPracticesError);
    } else {
      console.log(`  Recent quiz_practices: ${recentPractices?.length || 0}`);
      if (recentPractices && recentPractices.length > 0) {
        recentPractices.forEach((practice, index) => {
          console.log(`\n  Recent Practice ${index + 1}:`);
          console.log('    User ID:', practice.user_id);
          console.log('    Site ID:', practice.site_id);
          console.log('    Score:', `${practice.score}/${practice.total_questions} (${practice.score_percent}%)`);
          console.log('    Created At:', practice.created_at);
        });
      }
    }

    console.log('\n🔍 SUMMARY:');
    console.log('- Master Users Record: ✅ Found');
    console.log(`- Quiz Attempts: ${quizAttempts?.length || 0} total records`);
    console.log(`- Quiz Practices: ${quizPractices?.length || 0} total records`);
    console.log(`- Recent Quiz Attempts: ${recentAttempts?.length || 0} (last 10 min)`);
    console.log(`- Recent Quiz Practices: ${recentPractices?.length || 0} (last 10 min)`);

  } catch (error) {
    console.error('❌ Error investigating quiz submission:', error);
  }
}

// Run the investigation
investigateQuizSubmission();