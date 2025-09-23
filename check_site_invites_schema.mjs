#!/usr/bin/env node
// Quick schema check for site_invites.invite_data
// Usage: node check_site_invites_schema.mjs [service_key]

const URL = 'https://unveoqnlqnobufhublyw.supabase.co/rest/v1';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.argv[2];

if (!SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_KEY. Pass as env or arg.');
  process.exit(1);
}

async function main() {
  try {
    const res = await fetch(`${URL}/?select=*`, {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Accept: 'application/vnd.pgrst.object+json'
      }
    });
    // Above call is a noop to validate creds; ignore result
  } catch (e) {
    console.error('Auth check failed:', e.message);
  }

  // Probe by selecting invite_data directly; PostgREST returns an error if missing
  const probeUrl = `${URL}/site_invites?select=invite_data&limit=1`;
  const res2 = await fetch(probeUrl, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`
    }
  });

  if (res2.ok) {
    console.log('✅ invite_data column exists');
    process.exit(0);
  }

  const errText = await res2.text();
  const lower = errText.toLowerCase();
  const missing = lower.includes("column 'invite_data' does not exist") || lower.includes('invite_data') || lower.includes('schema cache');
  if (!missing) {
    console.error('Check failed:', errText);
    process.exit(2);
  }

  console.log('❌ invite_data column missing. To add it, run:');
  console.log('  -- In Supabase SQL editor as postgres:');
  console.log('  DO $$ BEGIN IF NOT EXISTS (');
  console.log("    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='site_invites' AND column_name='invite_data'");
  console.log('  ) THEN ALTER TABLE public.site_invites ADD COLUMN invite_data JSONB; END IF; END $$;');
  console.log('\nOr apply the workspace patch file sql/invitation_add_invite_data.sql');
  process.exit(3);
}

main();
