import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Configure CORS to only allow specific origins
const getAllowedOrigin = (req: Request): string => {
  const origin = req.headers.get('origin') || ''
  const allowedOrigins = [
    'https://checkloops.co.uk',
    'http://127.0.0.1:58156',
    'http://127.0.0.1:5500',
    'http://localhost:5173',
    'http://localhost:5500'
  ]
  if (origin.startsWith('http://127.0.0.1') || origin.startsWith('http://localhost')) return origin
  return allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
}

const getCorsHeaders = (req: Request) => ({
  'Access-Control-Allow-Origin': getAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-redirect-url',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Credentials': 'true'
})

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) })
  }

  try {
    let body: any
    try {
      body = await req.json()
    } catch (_e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } })
    }

    const { email, name, role, role_detail, reports_to_id } = body || {}

    if (!email || !name || !role) {
      return new Response(JSON.stringify({ error: 'Missing required fields: email, name, or role' }), { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } })
    }

    // Get environment variables
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SECRET_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Missing environment variables' }), { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } })
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authorization' }), { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } })
    }

    // Determine inviter authorization & site via master_users first, then profiles as fallback
    let site_id: number | null = null
    let inviterRole: string | null = null

    const { data: mu, error: muErr } = await supabaseAdmin
      .from('master_users')
      .select('site_id, access_type')
      .eq('auth_user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (mu && mu.site_id) {
      site_id = Number(mu.site_id)
      inviterRole = mu.access_type || null
    } else {
      const { data: inviterProfile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('site_id, role')
        .eq('user_id', user.id)
        .maybeSingle()

      if (inviterProfile) {
        site_id = Number(inviterProfile.site_id)
        inviterRole = inviterProfile.role || null
      }
    }

    if (!site_id) {
      return new Response(JSON.stringify({ error: 'Inviter not linked to a site' }), {
        status: 403,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      })
    }

    if (!['admin', 'owner'].includes((inviterRole || '').toLowerCase())) {
      return new Response(JSON.stringify({ error: 'Only admins/owners can invite users' }), {
        status: 403,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      })
    }

    // Get the redirect URL from the request
    const origin = req.headers.get('origin') || ''
    const isProduction = origin.includes('checkloops.co.uk')
    const defaultRedirect = isProduction
      ? 'https://checkloops.co.uk/simple-set-password.html'
      : 'http://127.0.0.1:5500/simple-set-password.html'
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
      .maybeSingle()

    if (inviteRecordError) {
      // Failed to create site invite
      return new Response(JSON.stringify({ error: `Failed to create site invite: ${inviteRecordError.message}` }), { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } })
    }

    // Site invite created successfully

    // STEP 2: Optionally add user to kiosk_users if the table exists and role_detail provided
    if (role_detail && role_detail.trim() !== '') {
      let kioskTableExists = true
      try {
        const { error: existsErr } = await supabaseAdmin.from('kiosk_users').select('id').limit(1)
        if (existsErr) kioskTableExists = false
      } catch (_e) {
        kioskTableExists = false
      }

      if (kioskTableExists) {
        const { error: kioskUserError } = await supabaseAdmin
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

        // Ignore kiosk user insert errors; do not block the invitation flow
        if (kioskUserError) {
          // no-op
        }
      }
    }

    // STEP 3: Send Supabase magic link (OTP) invitation
  // Append full onboarding parameters to redirect URL
  const url = new URL(redirectTo)
  url.searchParams.set('invite_id', String(inviteRecord.id))
  url.searchParams.set('invite_email', email)
  url.searchParams.set('site_id', String(site_id))
  url.searchParams.set('full_name', name)
  url.searchParams.set('role', role)
  if (role_detail) url.searchParams.set('role_detail', role_detail)
  if (reports_to_id) url.searchParams.set('reports_to_id', String(reports_to_id))
  const redirectWithInvite = url.toString()

    const { error: authError } = await supabaseAdmin.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: redirectWithInvite,
        data: {
          full_name: name,
          role,
          site_id,
          role_detail,
          reports_to_id,
          invite_id: String(inviteRecord.id)
        }
      }
    })

    if (authError) {
      throw new Error(`Failed to send magic link: ${authError.message}`)
    }

    // Auth invite sent successfully

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Invitation sent successfully!',
      invite_id: inviteRecord.id
    }), {
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    const message = (error && (error as any).message) ? (error as any).message : 'Unknown error'
    return new Response(JSON.stringify({ 
      error: message
    }), {
      status: 500,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    })
  }
})
