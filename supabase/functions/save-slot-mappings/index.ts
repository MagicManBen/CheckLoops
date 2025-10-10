import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with the auth token from the request
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the user from the auth token
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid or missing auth token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the request body
    const body = await req.json()
    const mappings = body.mappings

    if (!mappings || !Array.isArray(mappings) || mappings.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No mappings provided. Expected array of mapping objects.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user's site_id from master_users
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('master_users')
      .select('site_id, email, access_type')
      .eq('auth_user_id', user.id)
      .single()

    if (profileError || !userProfile) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin or owner
    const accessType = String(userProfile.access_type || '').toLowerCase()
    if (accessType !== 'admin' && accessType !== 'owner') {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. Only admin or owner can save slot type mappings.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const siteId = userProfile.site_id
    const userEmail = userProfile.email || user.email

    if (!siteId) {
      return new Response(
        JSON.stringify({ error: 'User profile missing site_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate and prepare mapping records
    const records = []
    for (const mapping of mappings) {
      if (!mapping.category_key || !mapping.category_label || !mapping.emis_slot_type) {
        console.warn('Skipping invalid mapping:', mapping)
        continue
      }

      // Skip if emis_slot_type is the placeholder "— Select —"
      if (mapping.emis_slot_type === '— Select —' || mapping.emis_slot_type.trim() === '') {
        console.log('Skipping unselected mapping:', mapping.category_key)
        continue
      }

      records.push({
        site_id: siteId,
        category_key: mapping.category_key,
        category_label: mapping.category_label,
        emis_slot_type: mapping.emis_slot_type,
        configured_by_user_id: user.id,
        configured_by_email: userEmail,
        is_active: true,
      })
    }

    if (records.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid mappings to save. Please select slot types from the dropdowns.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Use upsert to handle updates (on conflict, update the mapping)
    const { data: savedMappings, error: saveError } = await supabaseClient
      .from('slot_type_mappings')
      .upsert(records, {
        onConflict: 'site_id,category_key',
        returning: 'minimal'
      })

    if (saveError) {
      console.error('Error saving mappings:', saveError)
      return new Response(
        JSON.stringify({ error: 'Failed to save mappings', details: saveError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch back the saved mappings to return to client
    const { data: finalMappings, error: fetchError } = await supabaseClient
      .from('slot_type_mappings')
      .select('*')
      .eq('site_id', siteId)
      .eq('is_active', true)
      .order('category_key', { ascending: true })

    if (fetchError) {
      console.error('Error fetching saved mappings:', fetchError)
      // Still return success since the save worked
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully saved ${records.length} slot type mappings`,
        saved_count: records.length,
        site_id: siteId,
        mappings: finalMappings || records,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (err) {
    console.error('Unexpected error in save-slot-mappings:', err)
    const message = (err && (err as any).message) ? (err as any).message : String(err)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
