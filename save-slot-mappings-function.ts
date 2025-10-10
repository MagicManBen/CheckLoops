import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SlotMapping {
  hardcoded_type: string
  matched_emis_type: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Create Supabase client with service role for bypassing RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    })

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    
    if (userError || !user) {
      throw new Error('Failed to authenticate user')
    }

    // Get user profile to find site_id
    const { data: profile, error: profileError } = await supabase
      .from('master_users')
      .select('site_id')
      .eq('auth_user_id', user.id)
      .single()

    if (profileError || !profile || !profile.site_id) {
      throw new Error('User profile or site_id not found')
    }

    // Parse request body
    const { mappings } = await req.json() as { mappings: SlotMapping[] }

    if (!Array.isArray(mappings) || mappings.length === 0) {
      throw new Error('Invalid or empty mappings array')
    }

    // Prepare records for insertion
    const records = mappings.map(mapping => ({
      site_id: profile.site_id,
      hardcoded_type: mapping.hardcoded_type,
      matched_emis_type: mapping.matched_emis_type,
      mapped_by_user_id: user.id,
      mapped_by_user_email: user.email || null,
      mapped_at: new Date().toISOString()
    }))

    // Insert all records
    const { data, error: insertError } = await supabase
      .from('slot_type_mappings')
      .insert(records)
      .select()

    if (insertError) {
      console.error('Insert error:', insertError)
      throw insertError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully saved ${records.length} mappings`,
        count: records.length,
        data 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in save-slot-mappings:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'An unknown error occurred'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
