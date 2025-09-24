const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME';

async function authenticateAndFetch(endpoint, params = {}) {
  // First authenticate
  const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'benhowardmagic@hotmail.com',
      password: 'Hello1!'
    })
  });
  
  if (!authResponse.ok) {
    throw new Error(`Auth failed: ${authResponse.status}`);
  }
  
  const authData = await authResponse.json();
  const accessToken = authData.access_token;
  
  // Now make the API call with the access token
  const url = new URL(`${SUPABASE_URL}/rest/v1/${endpoint}`);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
  
  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  
  return await response.json();
}

async function verifyQuizFix() {
  console.log('🔧 VERIFYING MANDATORY QUIZ FIX');
  console.log('================================');
  
  try {
    // Get user info
    const masterUsers = await authenticateAndFetch('master_users', {
      'email': 'eq.benhowardmagic@hotmail.com',
      'select': 'auth_user_id,site_id,last_required_quiz_at,next_quiz_due,email'
    });

    if (!masterUsers || masterUsers.length === 0) {
      console.log('❌ No master_users record found');
      return;
    }

    const user = masterUsers[0];
    console.log('📋 User Info:');
    console.log('  Email:', user.email);
    console.log('  Auth User ID:', user.auth_user_id);
    console.log('  Site ID:', user.site_id);
    
    // Check recent submissions (last 2 hours)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    
    console.log('\n🎯 CHECKING RECENT QUIZ_ATTEMPTS (last 2 hours):');
    console.log('Looking for entries since:', twoHoursAgo);
    
    const recentAttempts = await authenticateAndFetch('quiz_attempts', {
      'user_id': `eq.${user.auth_user_id}`,
      'created_at': `gte.${twoHoursAgo}`,
      'select': '*',
      'order': 'created_at.desc'
    });

    console.log(`Found ${recentAttempts?.length || 0} recent quiz_attempts for this user`);
    
    if (recentAttempts && recentAttempts.length > 0) {
      recentAttempts.forEach((attempt, index) => {
        console.log(`\n  ✅ Recent Attempt ${index + 1}:`);
        console.log('    ID:', attempt.id);
        console.log('    Is Practice:', attempt.is_practice ? 'Yes (Practice)' : 'No (MANDATORY)');
        console.log('    Score:', `${attempt.correct_answers}/${attempt.total_questions} (${attempt.score_percent}%)`);
        console.log('    Completed At:', attempt.completed_at);
        console.log('    Created At:', attempt.created_at);
        
        if (!attempt.is_practice) {
          console.log('    🎯 MANDATORY QUIZ RECORD FOUND! ✅');
        }
      });
    } else {
      console.log('  ❌ No recent quiz_attempts found');
    }

    // Check master_users timestamps
    console.log('\n📊 MASTER_USERS TIMESTAMPS:');
    console.log('  Last Required Quiz At:', user.last_required_quiz_at);
    console.log('  Next Quiz Due:', user.next_quiz_due);
    
    // Summary
    const hasMasterRecord = !!user.last_required_quiz_at;
    const hasAttemptRecord = recentAttempts && recentAttempts.some(a => !a.is_practice);
    
    console.log('\n🔍 FIX VERIFICATION SUMMARY:');
    console.log('============================');
    console.log('✅ master_users record:', hasMasterRecord ? 'FOUND' : 'MISSING');
    console.log('✅ quiz_attempts record:', hasAttemptRecord ? 'FOUND' : 'MISSING');
    
    if (hasMasterRecord && hasAttemptRecord) {
      console.log('\n🎉 SUCCESS! Both tables are now being updated correctly.');
      console.log('   The mandatory quiz fix is working! 🎯');
    } else if (hasMasterRecord && !hasAttemptRecord) {
      console.log('\n⚠️  PARTIAL: master_users updated but quiz_attempts still missing.');
      console.log('   The fix may need more work or hasn\'t been tested yet.');
    } else {
      console.log('\n❌ ISSUE: Missing records in one or both tables.');
    }

  } catch (error) {
    console.error('❌ Error verifying quiz fix:', error);
  }
}

// Run the verification
verifyQuizFix();