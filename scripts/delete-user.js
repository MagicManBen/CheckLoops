#!/usr/bin/env node
// Comprehensive Supabase user deletion script
// Usage (run locally):
// SUPABASE_URL=https://<project>.supabase.co SERVICE_ROLE_KEY=<service_key> node scripts/delete-user.js --user-id <auth_user_id> [--master-id <master_users_id>] [--email <email>]

const { argv, env, exit } = require('process');
const fetch = global.fetch || require('node-fetch');

function parseArgs() {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--user-id' || a === '-u') args.userId = argv[++i];
    else if (a === '--master-id' || a === '-m') args.masterId = argv[++i];
    else if (a === '--email' || a === '-e') args.email = argv[++i];
    else if (a === '--help' || a === '-h') args.help = true;
  }
  return args;
}

const args = parseArgs();
if (args.help) {
  console.log('Usage: SUPABASE_URL=... SERVICE_ROLE_KEY=... node scripts/delete-user.js --user-id <auth_user_id> [--master-id <master_id>] [--email <email>]');
  exit(0);
}

const SUPABASE_URL = env.SUPABASE_URL;
const SERVICE_KEY = env.SERVICE_ROLE_KEY || env.SERVICE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SERVICE_ROLE_KEY in environment');
  exit(2);
}

const userId = args.userId;
const masterId = args.masterId;
const email = args.email;

if (!userId && !masterId && !email) {
  console.error('Provide at least --user-id, --master-id or --email');
  exit(2);
}

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

const tablesToClean = [
  'practice_progress',
  'user_badges',
  'user_streaks',
  'user_points',
  'training_records',
  'holiday_requests',
  'complaints',
  'submissions',
  'submission_rows',
  'quiz_attempts',
  'meeting_notes',
  'tasks',
  'notifications',
  'audit_logs',
  'file_attachments',
  'fuzzy_match_holidays',
  'team_members',
  'site_invites',
  'pir_attachments',
  'complaint_attachments',
  'training_certificates',
  'submission_rows',
  'pending_training_records',
  'pir_documents',
  'holidays',
  // primary table last
  'master_users'
];

const userColumns = ['user_id', 'auth_user_id', 'created_by', 'owner_id', 'staff_id'];
const emailColumns = ['email', 'user_email', 'created_by_email'];

async function tryDeleteTableByColumn(table, column, value) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  // supabase REST expects column filter like column=eq.value
  url.search = `${column}=eq.${encodeURIComponent(value)}`;
  const resp = await fetch(url.toString(), {
    method: 'DELETE',
    headers: {
      ...headers,
      Prefer: 'return=representation'
    }
  });
  const text = await resp.text();
  let data = null;
  try { data = JSON.parse(text); } catch(_) { data = text; }
  return { status: resp.status, ok: resp.ok, data };
}

async function deleteFromTable(table, identifiers) {
  // identifiers: { userId, email, masterId }
  if (table === 'master_users') {
    // Try masterId first
    if (identifiers.masterId) {
      return await tryDeleteTableByColumn(table, 'id', identifiers.masterId);
    }
    if (identifiers.userId) {
      const r = await tryDeleteTableByColumn(table, 'auth_user_id', identifiers.userId);
      if (r.ok) return r;
    }
    if (identifiers.email) {
      return await tryDeleteTableByColumn(table, 'email', identifiers.email);
    }
    return { ok: false, status: 404, data: 'No identifier for master_users' };
  }

  // For other tables, try user columns then email columns
  if (identifiers.userId) {
    for (const col of userColumns) {
      try {
        const res = await tryDeleteTableByColumn(table, col, identifiers.userId);
        if (res.ok) return res;
      } catch (e) { /* ignore and try next */ }
    }
  }

  if (identifiers.email) {
    for (const col of emailColumns) {
      try {
        const res = await tryDeleteTableByColumn(table, col, identifiers.email);
        if (res.ok) return res;
      } catch (e) { /* ignore and try next */ }
    }
  }

  // Nothing matched
  return { ok: true, status: 204, data: 'No rows matched (treated as OK)' };
}

async function deleteAuthUser(uid) {
  const url = `${SUPABASE_URL}/auth/v1/admin/users/${uid}`;
  const resp = await fetch(url, { method: 'DELETE', headers });
  const text = await resp.text();
  let data = null;
  try { data = JSON.parse(text); } catch(_) { data = text; }
  return { status: resp.status, ok: resp.ok, data };
}

(async function main(){
  console.log('Starting comprehensive deletion run for', { userId, masterId, email });
  const identifiers = { userId, masterId, email };
  const results = [];

  for (const table of tablesToClean) {
    try {
      process.stdout.write(`Cleaning ${table} ... `);
      const res = await deleteFromTable(table, identifiers);
      results.push({ table, res });
      console.log(res.ok ? 'OK' : `FAIL (${res.status})`, res.data ? (typeof res.data === 'string' ? res.data.slice(0,200) : JSON.stringify(res.data).slice(0,200)) : '');
    } catch (e) {
      console.error(`Error cleaning ${table}:`, e.message || e);
      results.push({ table, error: e });
    }
  }

  // Finally attempt to delete auth user if we have userId
  if (userId) {
    try {
      process.stdout.write(`Deleting auth user ${userId} ... `);
      const r = await deleteAuthUser(userId);
      if (r.ok) console.log('OK'); else console.log('FAIL', r.status, r.data);
      results.push({ authDeletion: r });
    } catch (e) {
      console.error('Auth deletion error:', e.message || e);
      results.push({ authDeletionError: e });
    }
  }

  console.log('\n=== SUMMARY ===');
  results.forEach(r => console.log(JSON.stringify(r).slice(0,1000)));
  console.log('\nFinished.');
})();
