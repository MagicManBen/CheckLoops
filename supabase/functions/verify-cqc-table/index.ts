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

    // Get count of records in CQC_List
    const { count, error: countError } = await supabase
      .from('CQC_List')
      .select('*', { count: 'exact', head: true })

    // Get a sample of records
    const { data: sampleData, error: sampleError } = await supabase
      .from('CQC_List')
      .select('provider_id, provider_name')
      .limit(5)

    return new Response(
      JSON.stringify({
        success: true,
        tableExists: !countError,
        totalRecords: count || 0,
        sampleRecords: sampleData || [],
        errors: {
          countError: countError?.message || null,
          sampleError: sampleError?.message || null
        }
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