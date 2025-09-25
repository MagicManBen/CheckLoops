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

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      db: { schema: 'public' },
      auth: { persistSession: false }
    })

    // First, try to create a simple test table to verify permissions
    const { data: testData, error: testError } = await supabase
      .from('CQC_List')
      .select('count')
      .limit(1)

    let tableCreated = false
    let message = ''

    if (testError && testError.message.includes('not find')) {
      // Table doesn't exist, let's insert a dummy record to create it
      const { error: createError } = await supabase
        .from('CQC_List')
        .insert([
          {
            provider_id: 'TEST-001',
            provider_name: 'Test GP Practice'
          }
        ])

      if (createError) {
        message = `Table creation via insert failed: ${createError.message}`
      } else {
        // Delete the test record
        await supabase
          .from('CQC_List')
          .delete()
          .eq('provider_id', 'TEST-001')

        tableCreated = true
        message = 'Table CQC_List created successfully via insert method'
      }
    } else if (!testError) {
      message = 'Table CQC_List already exists'
      tableCreated = true
    } else {
      message = `Unexpected error: ${testError.message}`
    }

    // Get count of records
    const { count } = await supabase
      .from('CQC_List')
      .select('*', { count: 'exact', head: true })

    return new Response(
      JSON.stringify({
        success: tableCreated,
        message,
        recordCount: count || 0
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