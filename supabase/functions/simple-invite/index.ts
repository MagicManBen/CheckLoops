import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Configure CORS to only allow specific origins
const getAllowedOrigin = (req: Request): string => {
  const origin = req.headers.get('origin') || ''
  const allowedOrigins = [
    'http://127.0.0.1:58156',
    'http://127.0.0.1:5500',
    'http://localhost:5173',
    'http://localhost:5500',
    'https://magicmanben.github.io',
    'https://checkloops.co.uk',
    'https://www.checkloops.co.uk'
  ]
  
  return allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
}

const getCorsHeaders = (req: Request) => ({
  'Access-Control-Allow-Origin': getAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-redirect-url',
  'Access-Control-Allow-Credentials': 'true'
})

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) })
  }

  try {
    const { email, name, role, role_detail, reports_to_id } = await req.json()

    if (!email || !name || !role) {
      throw new Error('Missing required fields: email, name, or role')
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SECRET_KEY')

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

    // Get the redirect URL from the request
    const origin = req.headers.get('origin') || ''
    // Choose sensible defaults if caller doesn't provide x-redirect-url
    let defaultRedirect = 'http://127.0.0.1:5500/simple-set-password.html'
    if (origin.includes('checkloops.co.uk')) {
      defaultRedirect = 'https://checkloops.co.uk/simple-set-password.html'
    } else if (origin.includes('github.io')) {
      defaultRedirect = 'https://magicmanben.github.io/CheckLoops/simple-set-password.html'
    }
    const redirectTo = req.headers.get('x-redirect-url') || defaultRedirect
    
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
      // Failed to create site invite
      throw new Error(`Failed to create site invite: ${inviteRecordError.message}`)
    }

    // Site invite created successfully

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
        // Warning: Failed to create kiosk user (but continuing with invitation)
        // Don't fail the invitation if kiosk_users insert fails
      } else {
        // Kiosk user created successfully
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
      // Supabase auth invite failed
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

    // Auth invite sent successfully

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Invitation sent successfully!',
      user_id: authData.user.id,
      invite_id: inviteRecord.id
    }), {
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message
    }), {
      status: 500,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    })
  }
})
