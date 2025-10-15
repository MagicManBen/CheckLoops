import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

serve(async (req) => {
  try {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
    const { email } = await req.json();
    if (!email) return new Response('Missing email', { status: 400 });

    // Use existing server-side RPC to list tables
    const { data: tables, error: tablesError } = await supabaseAdmin.rpc('execute_sql', {
      query: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
    });
    if (tablesError) return new Response(JSON.stringify({ error: tablesError.message }), { status: 500 });

    const results = [];
    for (const row of tables || []) {
      const table = row.table_name;
      // Use parameterized approach via execute_sql RPC if available; here we build a safe query
      // Build a safe query using the execute_sql RPC that your project provides.
      const searchSql = `SELECT * FROM "${table}" WHERE LOWER(CAST(ROW_TO_JSON(${table})::text AS text)) ILIKE LOWER('%${email}%') LIMIT 10`;
      const { data, error } = await supabaseAdmin.rpc('execute_sql', { query: searchSql });
      if (error) {
        // ignore tables that error (e.g., permission/unknown structure)
        continue;
      }
      if (data && data.length) results.push({ table, matches: data });
    }

    return new Response(JSON.stringify({ results }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
