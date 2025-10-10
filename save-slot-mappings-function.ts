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

  console.log('Incoming request:', { method: req.method, url: req.url });

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No Authorization header present');
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
    const token = authHeader.replace('Bearer ', '')
    console.log('Auth header present, token length:', token ? token.length : 0)
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      console.error('Failed to authenticate user', { userError })
      throw new Error('Failed to authenticate user')
    }

    // Get user profile to find site_id
    // Try 'auth_user_id' first, then fall back to 'id' (some schemas differ)
    let profile = null;
    let profileError = null;

    ({ data: profile, error: profileError } = await supabase
      .from('master_users')
      .select('site_id, email')
      .eq('auth_user_id', user.id)
      .maybeSingle());

    if (!profile || !profile.site_id) {
      ({ data: profile, error: profileError } = await supabase
        .from('master_users')
        .select('site_id, email')
        .eq('id', user.id)
        .maybeSingle());
    }

    // Final fallback: try matching by email in case auth_user_id/id aren't populated
    if ((!profile || !profile.site_id) && user.email) {
      ({ data: profile, error: profileError } = await supabase
        .from('master_users')
        .select('site_id, email')
        .eq('email', user.email)
        .maybeSingle());
    }

    if (profileError || !profile || !profile.site_id) {
      console.error('User profile lookup failed', { profileError, profile })
      throw new Error('User profile or site_id not found')
    }

    // Parse request body
    const { mappings } = await req.json() as { mappings: SlotMapping[] }

    if (!Array.isArray(mappings) || mappings.length === 0) {
      console.error('Invalid or empty mappings array', { mappings });
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
      // Normalize the error into a serializable object so the client receives useful details
      const normErr = {
        message: insertError.message || 'Insert error',
        code: insertError.code || null,
        details: insertError.details || null,
        hint: insertError.hint || null
      };
      console.error('Insert error:', normErr);
      return new Response(
        JSON.stringify({ success: false, error: normErr }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
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
    // Prefer structured error output when available
    console.error('Error in save-slot-mappings:', error)
    const errMsg = (error && typeof error === 'object' && 'message' in error) ? (error as any).message : String(error);
    const errStack = (error && typeof error === 'object' && 'stack' in error) ? (error as any).stack : null;

    return new Response(
      JSON.stringify({ 
        success: false,
        error: errMsg || 'An unknown error occurred',
        stack: errStack
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
