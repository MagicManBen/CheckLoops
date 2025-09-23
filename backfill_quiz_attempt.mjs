// Backfill one official quiz_attempt row for a user based on master_users metadata
// Usage:
//   SUPABASE_SERVICE_KEY=... node backfill_quiz_attempt.mjs userEmail
// Requires service role key.

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://unveoqnlqnobufhublyw.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
if (!SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json'
};

async function req(path, opts={}){
  const res = await fetch(`${SUPABASE_URL}${path}`, { headers, ...opts });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
  return res.json();
}

async function main(){
  const email = process.argv[2];
  if (!email) throw new Error('Provide user email');

  // Lookup master_users
  const users = await req(`/rest/v1/master_users?email=eq.${encodeURIComponent(email)}&select=auth_user_id,site_id,last_required_quiz_at`);
  if (!users.length) throw new Error('master_users not found');
  const u = users[0];
  if (!u.last_required_quiz_at) throw new Error('No last_required_quiz_at to backfill');

  // Avoid duplicate if already exists
  const attempts = await req(`/rest/v1/quiz_attempts?user_id=eq.${encodeURIComponent(u.auth_user_id)}&site_id=eq.${encodeURIComponent(u.site_id)}&select=id&order=completed_at.desc&limit=1`);
  if (attempts.length) {
    console.log('quiz_attempts already exists, skipping');
    return;
  }

  // Insert a minimal attempt row with unknown score
  const payload = [{
    site_id: u.site_id,
    user_id: u.auth_user_id,
    started_at: u.last_required_quiz_at,
    completed_at: u.last_required_quiz_at,
    total_questions: 10,
    correct_answers: null,
    score_percent: null,
    is_practice: false
  }];

  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/quiz_attempts`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  if (!insertRes.ok) throw new Error(`Insert failed: ${await insertRes.text()}`);
  console.log('Backfill inserted');
}

main().catch(e=>{ console.error(e); process.exit(1); });
