// Inspect invite-related tables using Supabase REST with service role from env
// Usage:
//   export SUPABASE_SERVICE_ROLE_KEY="..."
//   node scripts/investigate_invites.mjs

import fetch from 'node-fetch';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
if (!SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY not set in environment');

const headers = {
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  apikey: SERVICE_ROLE_KEY,
  'Content-Type': 'application/json'
};

async function list(table, select = '*', extra = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}${extra}`;
  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(`${table} ${r.status}: ${await r.text()}`);
  return r.json();
}

async function main() {
  console.log('🔎 Checking invite-related tables...');

  const tables = ['site_invites', 'master_users', 'profiles', 'kiosk_users', 'teams', 'kiosk_roles'];
  for (const t of tables) {
    try {
      const rows = await list(t, '*', '&limit=1');
      console.log(`✅ ${t}: ${rows.length} rows (showing 1)`);
      if (rows[0]) console.log(`   keys: ${Object.keys(rows[0]).join(', ')}`);
    } catch (e) {
      console.log(`❌ ${t}: ${e.message}`);
    }
  }

  console.log('\n🔎 Inspecting pending invites...');
  try {
    const rows = await list('site_invites', '*', '&status=eq.pending&limit=5&order=created_at.desc');
    console.log(`Found ${rows.length} pending invites`);
    for (const r of rows) {
      console.log(` - id=${r.id} email=${r.email} site_id=${r.site_id} status=${r.status}`);
    }
  } catch (e) {
    console.log('site_invites pending error:', e.message);
  }

  console.log('\n🔎 Sampling teams and roles...');
  try {
    const teams = await list('teams', 'id,name', '&limit=5');
    console.log('teams:', teams.map(t => `${t.id}:${t.name}`).join(', '));
  } catch {}
  try {
    const roles = await list('kiosk_roles', 'id,role_name', '&limit=5');
    console.log('roles:', roles.map(r => `${r.id}:${r.role_name}`).join(', '));
  } catch {}
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
