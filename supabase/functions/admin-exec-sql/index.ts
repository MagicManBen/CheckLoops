import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in function environment');
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

serve(async (req) => {
  try {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
    const body = await req.json();

    // Support either a direct SQL exec or an RPC name + params to reduce risk
    if (body.rpc) {
      const { rpc, params } = body;
      const { data, error } = await supabaseAdmin.rpc(rpc, params || {});
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      return new Response(JSON.stringify({ data }), { status: 200 });
    }

    const sql = body?.sql;
    if (!sql || typeof sql !== 'string') return new Response('Missing sql or rpc', { status: 400 });

    // NOTE: This endpoint runs privileged SQL using the service role. Only deploy
    // if you control access to the function and set an appropriate auth check.
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    return new Response(JSON.stringify({ data }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
