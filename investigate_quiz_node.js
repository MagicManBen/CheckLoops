const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME';

async function fetchFromSupabase(endpoint, params = {}) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${endpoint}`);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
  
  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  
  return await response.json();
}

async function investigateQuizSubmission() {
  console.log('🔍 Investigating quiz submission for benhowardmagic@hotmail.com...');
  
  try {
    // First, get the user's auth_user_id from master_users
    console.log('\n📊 CHECKING MASTER_USERS TABLE:');
    const masterUsers = await fetchFromSupabase('master_users', {
      'email': 'eq.benhowardmagic@hotmail.com',
      'select': 'auth_user_id,site_id,last_required_quiz_at,next_quiz_due,email'
    });

    if (!masterUsers || masterUsers.length === 0) {
      console.log('❌ No master_users record found for benhowardmagic@hotmail.com');
      return;
    }

    const user = masterUsers[0];
    console.log('  Email:', user.email);
    console.log('  Auth User ID:', user.auth_user_id);
    console.log('  Site ID:', user.site_id);
    console.log('  Last Required Quiz At:', user.last_required_quiz_at);
    console.log('  Next Quiz Due:', user.next_quiz_due);

    // Check quiz_attempts table (main table for quiz submissions)
    console.log('\n🎯 CHECKING QUIZ_ATTEMPTS TABLE:');
    try {
      const quizAttempts = await fetchFromSupabase('quiz_attempts', {
        'user_id': `eq.${user.auth_user_id}`,
        'select': '*',
        'order': 'created_at.desc',
        'limit': '10'
      });

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
    } catch (error) {
      console.error('❌ Error fetching quiz_attempts:', error.message);
    }

    // Check quiz_practices table (for practice quizzes)
    console.log('\n📚 CHECKING QUIZ_PRACTICES TABLE:');
    try {
      const quizPractices = await fetchFromSupabase('quiz_practices', {
        'user_id': `eq.${user.auth_user_id}`,
        'select': '*',
        'order': 'created_at.desc',
        'limit': '10'
      });

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
    } catch (error) {
      console.error('❌ Error fetching quiz_practices:', error.message);
    }

    // Check recent entries in both tables (last 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    console.log('\n🕒 CHECKING RECENT SUBMISSIONS (last 30 minutes):');
    console.log('  Looking for entries since:', thirtyMinutesAgo);
    
    try {
      const recentAttempts = await fetchFromSupabase('quiz_attempts', {
        'created_at': `gte.${thirtyMinutesAgo}`,
        'select': '*',
        'order': 'created_at.desc'
      });

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
    } catch (error) {
      console.error('❌ Error fetching recent quiz_attempts:', error.message);
    }

    try {
      const recentPractices = await fetchFromSupabase('quiz_practices', {
        'created_at': `gte.${thirtyMinutesAgo}`,
        'select': '*',
        'order': 'created_at.desc'
      });

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
    } catch (error) {
      console.error('❌ Error fetching recent quiz_practices:', error.message);
    }

    console.log('\n🔍 SUMMARY:');
    console.log('✅ Investigation complete - check the data above to see where the quiz was saved');

  } catch (error) {
    console.error('❌ Error investigating quiz submission:', error);
  }
}

// Run the investigation
investigateQuizSubmission();