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

  return allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
}

const getCorsHeaders = (req: Request) => ({
  'Access-Control-Allow-Origin': getAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Credentials': 'true'
})

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) })
  }

  try {
    // Parse request body
    let requestBody
    try {
      requestBody = await req.json()
    } catch (e) {
      throw new Error('Invalid JSON in request body')
    }

    const { email, name, role, role_detail, reports_to_id } = requestBody

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
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError) throw new Error(`Auth error: ${userError.message}`)
    if (!user) throw new Error('User not found or invalid token')

    // Get inviter's profile to check role and site_id
    const { data: inviterProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('site_id, role')
      .eq('user_id', user.id)
      .single()

    if (profileError) throw new Error(`Profile error: ${profileError.message}`)
    if (!inviterProfile) throw new Error('Inviter profile not found')

    if (inviterProfile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized: Only admins can invite users' }), {
        status: 401,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      })
    }

    const site_id = inviterProfile.site_id

    // Create the site invitation record first
    const inviteToken = crypto.randomUUID()
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
        token: inviteToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        invited_by: user.id,
        allowed_pages: '[]'
      })

    if (inviteRecordError) throw new Error(`Failed to create invite record: ${inviteRecordError.message}`)

    // Always use production URL for invitations regardless of where the request comes from
    const defaultRedirect = 'https://checkloops.co.uk/set-password.html'
    const redirectTo = requestBody.redirect_to || defaultRedirect

    // Send a passwordless magic-link (OTP) email via the Supabase Auth REST endpoint.
    // Using the admin/service key server-side is safe and this will trigger the
    // 'Your Magic Link' email template instead of the default invite template.
    const otpUrl = `${supabaseUrl.replace(/\/$/, '')}/auth/v1/otp?provider=email`

    const otpResp = await fetch(otpUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ email, redirect_to: redirectTo })
    })

    if (!otpResp.ok) {
      const body = await otpResp.text().catch(() => '')
      throw new Error(`Failed to send magic link (OTP). Status: ${otpResp.status} ${otpResp.statusText} - ${body}`)
    }

    // The database triggers will handle creating the profile when the user confirms their email
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Invitation sent successfully. User profile will be created when they accept the invitation.',
      invite_token: inviteToken
    }), {
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return new Response(JSON.stringify({ 
      error: errorMessage
    }), {
      status: 500,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    })
  }
})

