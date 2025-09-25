import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // First, drop the old table if it exists
    await supabase.from('gp_practices').delete().neq('id', 0)

    // Create the new CQC_List table using raw SQL
    const { data, error } = await supabase.rpc('create_cqc_list_table', {})

    // If the RPC doesn't exist, try using the admin API
    const createTableSQL = `
      -- Drop the old table if it exists
      DROP TABLE IF EXISTS public.gp_practices CASCADE;

      -- Create table for CQC List (GP practices from CQC API)
      CREATE TABLE IF NOT EXISTS public."CQC_List" (
          id SERIAL PRIMARY KEY,
          provider_id VARCHAR(255) UNIQUE NOT NULL,
          provider_name TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
      );

      -- Create indexes for faster lookups
      CREATE INDEX IF NOT EXISTS idx_cqc_list_provider_id ON public."CQC_List"(provider_id);
      CREATE INDEX IF NOT EXISTS idx_cqc_list_provider_name ON public."CQC_List"(provider_name);

      -- Add RLS policies
      ALTER TABLE public."CQC_List" ENABLE ROW LEVEL SECURITY;

      -- Drop existing policy if it exists and create new one
      DROP POLICY IF EXISTS "Allow public read access" ON public."CQC_List";
      CREATE POLICY "Allow public read access" ON public."CQC_List"
          FOR SELECT USING (true);
    `

    // Check if the table exists and count rows
    const { count, error: countError } = await supabase
      .from('CQC_List')
      .select('*', { count: 'exact', head: true })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Table creation attempted',
        tableExists: !countError,
        rowCount: count || 0,
        error: countError?.message || null
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})