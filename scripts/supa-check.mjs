import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

function getConfigFromEnvOrFile() {
  const envUrl = process.env.SUPABASE_URL;
  const envAnon = process.env.SUPABASE_ANON_KEY;
  if (envUrl && envAnon) return { url: envUrl, anon: envAnon };
  const cfgPath = path.resolve(process.cwd(), 'config.js');
  const text = fs.readFileSync(cfgPath, 'utf8');
  const urlMatch = text.match(/SUPABASE_URL:\s*'([^']+)'/);
  const keyMatch = text.match(/SUPABASE_ANON_KEY:\s*'([^']+)'/);
  if (!urlMatch || !keyMatch) throw new Error('Could not parse SUPABASE_URL/ANON_KEY from config.js; set env vars.');
  return { url: urlMatch[1], anon: keyMatch[1] };
}

async function main() {
  const email = process.env.TEST_USER;
  const password = process.env.TEST_PASS;
  if (!email || !password) throw new Error('Missing TEST_USER or TEST_PASS env.');

  const { url, anon } = getConfigFromEnvOrFile();
  const supabase = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });

  console.log('Signing in as', email);
  const { data: signIn, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
  if (signInErr) throw signInErr;
  const user = signIn.user;
  console.log('Signed in, user id:', user.id);

  // Load profile to get site_id & role
  const { data: profile, error: profErr } = await supabase
    .from('profiles')
    .select('site_id, role, full_name')
    .eq('user_id', user.id)
    .maybeSingle();
  if (profErr) throw profErr;
  if (!profile) throw new Error('No profile found for user.');

  const siteId = profile.site_id;
  console.log('Profile:', profile, 'site_id =', siteId);

  // Counts
  const [{ data: types, error: typesErr }, { data: staff, error: staffErr }, { data: recs, error: recsErr }] = await Promise.all([
    supabase.from('training_types').select('*').eq('site_id', siteId).eq('active', true).limit(5),
    supabase.from('kiosk_users').select('*').eq('site_id', siteId).limit(5),
    supabase.from('training_records').select('*').eq('site_id', siteId).limit(5),
  ]);
  if (typesErr) throw typesErr;
  if (staffErr) throw staffErr;
  if (recsErr) throw recsErr;

  // Aggregate counts too
  const [{ count: typesCount }, { count: staffCount }, { count: recsCount }] = await Promise.all([
    supabase.from('training_types').select('id', { count: 'exact', head: true }).eq('site_id', siteId).eq('active', true),
    supabase.from('kiosk_users').select('id', { count: 'exact', head: true }).eq('site_id', siteId),
    supabase.from('training_records').select('id', { count: 'exact', head: true }).eq('site_id', siteId),
  ]);

  console.log('Summary:', { typesCount, staffCount, recsCount });
  console.log('Sample training_types:', types);
  console.log('Sample kiosk_users:', staff);
  console.log('Sample training_records:', recs);
}

main().catch(err => {
  console.error('Supabase check failed:', err);
  process.exit(1);
});

