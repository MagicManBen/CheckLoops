import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-redirect-url',
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

    console.log('Processing invitation for:', { email, name, role, site_id })

    // Get the redirect URL from the request
    const redirectTo = req.headers.get('x-redirect-url') || 'https://magicmanben.github.io/CheckLoops/simple-set-password.html'
    
    // STEP 1: Create the site_invites record FIRST
    const { data: inviteRecord, error: inviteRecordError } = await supabaseAdmin
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
      .select()
      .single()

    if (inviteRecordError) {
      console.error('Failed to create site invite:', inviteRecordError)
      throw new Error(`Failed to create site invite: ${inviteRecordError.message}`)
    }

    console.log('Site invite created:', inviteRecord)

    // STEP 2: Add user to kiosk_users table immediately (if role_detail is provided)
    if (role_detail && role_detail.trim() !== '') {
      const { data: kioskUserData, error: kioskUserError } = await supabaseAdmin
        .from('kiosk_users')
        .insert({
          site_id: site_id,
          full_name: name,
          role: role_detail,
          active: true,
          reports_to_id: reports_to_id ? parseInt(reports_to_id, 10) : null,
          created_at: new Date().toISOString()
        })
        .select()

      if (kioskUserError) {
        console.log('Warning: Failed to create kiosk user (but continuing with invitation):', kioskUserError)
        // Don't fail the invitation if kiosk_users insert fails
      } else {
        console.log('Kiosk user created:', kioskUserData)
      }
    }

    // STEP 3: Send Supabase auth invitation
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
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

    if (authError) {
      console.error('Supabase auth invite failed:', authError)
      // If auth invite fails, clean up the site invite
      await supabaseAdmin
        .from('site_invites')
        .delete()
        .eq('id', inviteRecord.id)
      
      // Also try to clean up kiosk_users if it was created
      if (role_detail && role_detail.trim() !== '') {
        await supabaseAdmin
          .from('kiosk_users')
          .delete()
          .eq('site_id', site_id)
          .eq('full_name', name)
      }
      
      throw new Error(`Failed to send invite: ${authError.message}`)
    }

    console.log('Auth invite sent successfully:', authData)

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Invitation sent successfully!',
      user_id: authData.user.id,
      invite_id: inviteRecord.id
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
