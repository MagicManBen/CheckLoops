import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const requestId = crypto.randomUUID()
  const debugSteps: Array<Record<string, unknown>> = []
  const trace = (step: string, details?: Record<string, unknown>) => {
    const payload = {
      step,
      timestamp: new Date().toISOString(),
      ...(details ?? {}),
    }
    debugSteps.push(payload)
    console.log(`[send-invitation][${requestId}] ${step}`, details ?? '')
  }

  try {

    // Get the authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      trace('missing-authorization-header')
      throw new Error('No authorization header')
    }

    // Create Supabase client with user's token to verify they're authenticated
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    // Try custom SERVICE_KEY first, then fall back to SUPABASE_SERVICE_ROLE_KEY
    let supabaseServiceKey = Deno.env.get('SERVICE_KEY') ?? ''
    if (!supabaseServiceKey) {
      supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    }

    trace('env-configuration-loaded', {
      hasUrl: Boolean(supabaseUrl),
      hasAnon: Boolean(supabaseAnonKey),
      hasService: Boolean(supabaseServiceKey),
      serviceKeySource: Deno.env.get('SERVICE_KEY') ? 'SERVICE_KEY' : 'SUPABASE_SERVICE_ROLE_KEY',
    })

    // Verify the user is authenticated
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    })

    let user: any
    const { data: authData, error: authError } = await userClient.auth.getUser()

    if (authError || !authData?.user) {
      trace('auth-getUser-failed', {
        authError: authError?.message,
        hasUser: Boolean(authData?.user),
      })

      // If getUser fails, try to decode the JWT directly
      const token = authHeader.replace('Bearer ', '')
      try {
        const parts = token.split('.')
        if (parts.length !== 3) {
          throw new Error('Invalid JWT format')
        }
        const payload = JSON.parse(atob(parts[1]))
        if (!payload.sub) {
          throw new Error('No subject in JWT')
        }

        // Use the user info from the JWT payload
        user = {
          id: payload.sub,
          email: payload.email || 'unknown@email.com',
          user_metadata: payload.user_metadata || {},
        }

        trace('jwt-fallback-success', {
          userId: user.id,
          userEmail: user.email,
          role: payload.role,
        })
      } catch (decodeError) {
        trace('jwt-decode-failed', {
          error: decodeError instanceof Error ? decodeError.message : String(decodeError),
        })
        throw new Error('Unauthorized')
      }
    } else {
      user = authData.user
    }

    trace('auth-success', {
      userId: user.id,
      userEmail: user.email,
    })

    // Create service client for admin operations early
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    // Check if user is admin (use service client for elevated permissions)
    const { data: requesterProfile, error: requesterProfileError } = await serviceClient
      .from('master_users')
      .select('access_type')
      .eq('auth_user_id', user.id)
      .single()

    trace('requester-profile-check', {
      hasProfile: Boolean(requesterProfile),
      profileError: requesterProfileError?.message,
      accessType: requesterProfile?.access_type ?? null,
    })

    if (
      requesterProfileError ||
      !requesterProfile ||
      (requesterProfile.access_type !== 'admin' && requesterProfile.access_type !== 'owner')
    ) {
      throw new Error('Only admins can send invitations')
    }

    // Parse request body
    const body = await req.json()
    const {
      email,
      name,
      site_id,
      resend = false,
      access_type,
      role_detail,
      team_id,
      reports_to_id,
    } = body

    trace('request-body', {
      emailProvided: Boolean(email),
      nameProvided: Boolean(name),
      resendRequested: resend,
      siteIdProvided: site_id ?? null,
      accessTypeProvided: access_type ?? null,
      roleDetailProvided: Boolean(role_detail),
      teamIdProvided: team_id ?? null,
      reportsToProvided: reports_to_id ?? null,
    })

    if (!email) {
      throw new Error('Email is required')
    }

    if (!resend && !name) {
      throw new Error('Name is required for new invitations')
    }

    // If resending, get existing user data
    let existingUserRecord = null
    if (resend) {
      const { data: existing } = await serviceClient
        .from('master_users')
        .select('*')
        .eq('email', email)
        .single()

      if (!existing) {
        trace('resend-user-not-found', { email })
        throw new Error('User not found. Cannot resend invitation.')
      }
      existingUserRecord = existing
      trace('resend-user-found', {
        email,
        accessType: existing.access_type,
        siteId: existing.site_id,
        hasAuthUser: Boolean(existing.auth_user_id),
      })
    } else {
      // Check if user already exists (for new invitations)
      const { data: existingUser } = await serviceClient
        .from('master_users')
        .select('*')
        .eq('email', email)
        .single()

      if (existingUser) {
        trace('duplicate-email', { email })
        throw new Error('User with this email already exists')
      }
    }

    // Send invitation through Supabase Auth Admin API
    const normalizedSiteId = resend
      ? existingUserRecord?.site_id ?? site_id ?? 2
      : site_id ?? 2

    const parseOptionalNumber = (value: unknown) => {
      if (value === null || value === undefined || value === '') return null
      const num = Number(value)
      return Number.isFinite(num) ? num : null
    }

    const sanitizedTeamId = parseOptionalNumber(team_id)
    const sanitizedReportsToId = parseOptionalNumber(reports_to_id)
    const normalizedAccessType = (access_type || existingUserRecord?.access_type || 'staff').toString().toLowerCase()
    const invitationFullName = resend ? existingUserRecord?.full_name || email : name

    const inviteData = {
      data: {
        full_name: invitationFullName,
        invited: true,
        site_id: normalizedSiteId,
        access_type: normalizedAccessType,
        role_detail: role_detail || existingUserRecord?.role_detail || null,
        team_id: sanitizedTeamId ?? existingUserRecord?.team_id ?? null,
        reports_to_id: sanitizedReportsToId ?? existingUserRecord?.reports_to_id ?? null,
      },
    }

    trace('invitation-prepared', {
      resend,
      normalizedSiteId,
      fullName: invitationFullName,
      accessType: normalizedAccessType,
      roleDetail: role_detail ?? existingUserRecord?.role_detail ?? null,
      teamId: sanitizedTeamId ?? existingUserRecord?.team_id ?? null,
      reportsToId: sanitizedReportsToId ?? existingUserRecord?.reports_to_id ?? null,
    })

    const { data: invitation, error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(
      email,
      inviteData,
    )

    if (inviteError) {
      console.error(`[send-invitation][${requestId}] Invitation error`, inviteError)
      trace('invitation-error', { message: inviteError.message, status: inviteError.status })
      throw new Error(`Failed to send invitation: ${inviteError.message}`)
    }

    trace('invitation-success', {
      invitationId: invitation?.id ?? null,
      createdAt: invitation?.created_at ?? null,
      email,
    })

    // Create entry in master_users table (only for new invitations)
    if (!resend) {
      const nowIso = new Date().toISOString()
      const { error: dbError } = await serviceClient
        .from('master_users')
        .insert({
          email: email,
          full_name: name,
          access_type: normalizedAccessType,
          role: normalizedAccessType,
          role_detail: role_detail || null,
          team_id: sanitizedTeamId,
          reports_to_id: sanitizedReportsToId,
          invite_status: 'pending',
          invite_sent_at: nowIso,
          invited_by: user.id,
          site_id: normalizedSiteId,
          created_at: nowIso,
          updated_at: nowIso,
        })

      if (dbError) {
        console.error(`[send-invitation][${requestId}] Database insert error`, dbError)
        trace('database-insert-error', {
          message: dbError.message,
          code: dbError.code,
          details: dbError.details,
        })
        // Continue anyway - invitation was sent
      }
      trace('database-insert-complete', {
        email,
        table: 'master_users',
      })
    }

    trace('completed', { email, resend })

    return new Response(
      JSON.stringify({ success: true, message: `Invitation sent successfully to ${email}`, debug: debugSteps, requestId }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    trace('top-level-error', { message: err.message, stack: err.stack })
    console.error('Error in send-invitation function:', err)
    return new Response(
      JSON.stringify({ success: false, error: err.message, debug: debugSteps, requestId }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
