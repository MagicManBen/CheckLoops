import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, name, role, role_detail, reports_to_id } = await req.json()

    if (!email || !name || !role) {
      throw new Error('Missing required fields: email, name, or role')
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables')
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Invalid authorization')
    }

    // Get inviter's profile
    const { data: inviterProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('site_id, role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !inviterProfile) {
      throw new Error('Inviter profile not found')
    }

    if (inviterProfile.role !== 'admin') {
      throw new Error('Only admins can invite users')
    }

    const site_id = inviterProfile.site_id

    // Get the redirect URL from the request (so client can tell us where to redirect)
    const redirectTo = req.headers.get('x-redirect-url') || 'https://magicmanben.github.io/CheckLoops/simple-set-password.html'
    
    // Step 1: Use Supabase's built-in invite system (MUCH SIMPLER)
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          full_name: name,
          role: role,
          site_id: site_id,
          role_detail: role_detail,
          reports_to_id: reports_to_id
        },
        redirectTo: redirectTo
      }
    )

    if (inviteError) {
      throw new Error(`Failed to send invite: ${inviteError.message}`)
    }

    console.log('Invite sent successfully:', inviteData)

    // Step 2: Create a simple invite tracking record only
    const { error: inviteRecordError } = await supabaseAdmin
      .from('site_invites')
      .insert({
        email: email,
        full_name: name,
        role: role,
        role_detail: role_detail,
        reports_to_id: reports_to_id ? parseInt(reports_to_id, 10) : null,
        site_id: site_id,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        invited_by: user.id
      })

    if (inviteRecordError) {
      console.error('Invite record error:', inviteRecordError)
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Invitation sent successfully!',
      user_id: inviteData.user.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Invite error:', error)
    return new Response(JSON.stringify({ 
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
