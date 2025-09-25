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

    const results = {}

    // Check different table name variations
    const tableNames = ['CQC_List', 'cqc_list', 'gp_practices', 'GP_practices']

    for (const tableName of tableNames) {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })

      results[tableName] = {
        exists: !error || !error.message.includes('not find'),
        count: count || 0,
        error: error?.message || null
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        tables: results
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