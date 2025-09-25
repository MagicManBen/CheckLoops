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

    // Check if gp_practices table exists
    const { data: gpData, error: gpError } = await supabase
      .from('gp_practices')
      .select('count')
      .limit(1)

    // Check table information
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'gp_practices' })
      .single()

    return new Response(
      JSON.stringify({
        gp_practices_exists: !gpError,
        gp_practices_error: gpError?.message || null,
        table_info: tableInfo,
        table_error: tableError?.message || null
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})