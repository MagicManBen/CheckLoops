// Supabase Edge Function: delete-user
// Deletes a user comprehensively across application tables and Supabase Auth.
// Uses the Service Role key via environment variables — never hardcode keys.

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Payload = {
  userId?: string;
  masterId?: string | number;
  email?: string;
  site_id?: number | string;
};

let SUPABASE_URL = Deno.env.get("SUPABASE_URL") || Deno.env.get("PROJECT_URL") || Deno.env.get("URL") || '';
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_KEY") || '';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, init: number | ResponseInit = 200) {
  const initObj: ResponseInit = typeof init === 'number' ? { status: init } : init;
  return new Response(JSON.stringify(body, null, 2), {
    ...initObj,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
      ...(initObj.headers || {}),
    },
  });
}

// Attempt simple admin check: require caller to be logged-in admin/owner
async function requireAdmin(req: Request) {
  try {
    const auth = req.headers.get('Authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token) return { ok: false, error: 'Missing bearer token' };

    const supa = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: userRes, error: userErr } = await supa.auth.getUser(token);
    if (userErr || !userRes?.user) return { ok: false, error: 'Invalid token' };

    const uid = userRes.user.id;
    const { data: mu, error: muErr } = await supa
      .from('master_users')
      .select('access_type')
      .eq('auth_user_id', uid)
      .maybeSingle();

    if (muErr) return { ok: false, error: 'Access check failed' };
    const access = String(mu?.access_type || '').toLowerCase();
    if (access !== 'admin' && access !== 'owner') return { ok: false, error: 'Forbidden' };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

const USER_COLUMNS = ['user_id', 'auth_user_id', 'created_by', 'owner_id', 'staff_id'];
const EMAIL_COLUMNS = ['email', 'user_email', 'created_by_email'];

const TABLES = [
  // dependent tables
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
  'pending_training_records',
  'pir_documents',
  'holidays',
  // primary last
  'master_users',
];

async function deleteByColumn(supa: any, table: string, column: string, value: string | number) {
  try {
    const { error } = await supa.from(table).delete().eq(column, value);
    return { ok: !error, error: error?.message || null };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

async function cleanTable(supa: any, table: string, ids: { userId?: string; email?: string; masterId?: string | number; site_id?: number | string }) {
  if (table === 'master_users') {
    if (ids.masterId) {
      return await deleteByColumn(supa, table, 'id', ids.masterId);
    }
    if (ids.userId) {
      const r = await deleteByColumn(supa, table, 'auth_user_id', ids.userId);
      if (r.ok) return r;
    }
    if (ids.email) {
      // If we know site_id we can restrict
      if (ids.site_id != null) {
        try {
          const { error } = await supa.from(table).delete().eq('email', ids.email).eq('site_id', ids.site_id);
          return { ok: !error, error: error?.message || null };
        } catch (e) {
          return { ok: false, error: (e as Error).message };
        }
      }
      return await deleteByColumn(supa, table, 'email', ids.email);
    }
    return { ok: true };
  }

  if (ids.userId) {
    for (const col of USER_COLUMNS) {
      const r = await deleteByColumn(supa, table, col, ids.userId);
      if (r.ok) return r;
    }
  }
  if (ids.email) {
    for (const col of EMAIL_COLUMNS) {
      const r = await deleteByColumn(supa, table, col, ids.email);
      if (r.ok) return r;
    }
  }
  return { ok: true };
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { ...corsHeaders } });
  }

  // If SUPABASE_URL is not set via env, infer from function hostname
  if (!SUPABASE_URL) {
    try {
      const host = new URL(req.url).hostname; // e.g. <ref>.functions.supabase.co
      const projectRef = host.split('.')[0];
      SUPABASE_URL = `https://${projectRef}.supabase.co`;
    } catch (_) {}
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return json({ error: 'Server misconfigured', detail: { haveUrl: !!SUPABASE_URL, haveKey: !!SERVICE_ROLE_KEY } }, 500);
  }

  // Require admin caller
  const admin = await requireAdmin(req);
  if (!admin.ok) {
    return json({ error: 'Forbidden', detail: admin.error }, 403);
  }

  let payload: Payload | null = null;
  try {
    payload = await req.json();
  } catch (_) {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const identifiers: Payload = {
    userId: payload?.userId || undefined,
    masterId: payload?.masterId || undefined,
    email: payload?.email || undefined,
    site_id: payload?.site_id || undefined,
  };

  const supa = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const results: Record<string, unknown>[] = [];

  for (const table of TABLES) {
    const res = await cleanTable(supa, table, identifiers as any);
    results.push({ table, ...res });
  }

  // Try auth deletion last
  let auth: { ok: boolean; error?: string | null } = { ok: true };
  if (identifiers.userId) {
    try {
      const { error } = await supa.auth.admin.deleteUser(identifiers.userId);
      auth = { ok: !error, error: error?.message || null };
    } catch (e) {
      auth = { ok: false, error: (e as Error).message };
    }
  }

  return json({ ok: true, results, auth }, 200);
});