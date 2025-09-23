// Quick diagnostic for quiz status mismatch between staff.html and staff-quiz.html
// Uses Supabase REST API with the provided Service Key.

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://unveoqnlqnobufhublyw.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
if (!SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_KEY in environment');
  process.exit(1);
}

const headers = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json'
};

async function getJson(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${t}`);
  }
  return res.json();
}

async function main() {
  const email = process.argv[2] || 'benhowardmagic@hotmail.com';
  console.log('Checking quiz status for', email);

  // 1) Find master_users row by email
  const users = await getJson(`${SUPABASE_URL}/rest/v1/master_users?email=eq.${encodeURIComponent(email)}&select=auth_user_id,site_id,full_name,nickname,next_quiz_due,last_required_quiz_at,created_at,updated_at`);
  if (!users.length) {
    console.log('No master_users row for email');
    return;
  }
  const u = users[0];
  console.log('master_users:', u);

  // 2) Fetch quiz_attempts for this user/site
  const attempts = await getJson(`${SUPABASE_URL}/rest/v1/quiz_attempts?user_id=eq.${encodeURIComponent(u.auth_user_id)}&site_id=eq.${encodeURIComponent(u.site_id)}&select=id,started_at,completed_at,total_questions,correct_answers,score_percent,is_practice,created_at&order=completed_at.desc&limit=10`);
  console.log('quiz_attempts count:', attempts.length);
  if (attempts[0]) console.log('latest quiz_attempt:', attempts[0]);

  // 3) Fetch quiz_practices for this user/site (just in case)
  const practices = await getJson(`${SUPABASE_URL}/rest/v1/quiz_practices?user_id=eq.${encodeURIComponent(u.auth_user_id)}&site_id=eq.${encodeURIComponent(u.site_id)}&select=id,started_at,completed_at,total_questions,score,score_percent,created_at&order=completed_at.desc&limit=5`);
  console.log('quiz_practices count:', practices.length);
  if (practices[0]) console.log('latest practice:', practices[0]);

  // 4) Summarise likely cause
  if ((u.last_required_quiz_at || u.next_quiz_due) && attempts.length === 0) {
    console.log('\nLikely cause: Required quiz recorded in master_users but no row in quiz_attempts.');
  }
}

main().catch(err => {
  console.error('Diagnostic failed:', err);
  process.exit(1);
});
