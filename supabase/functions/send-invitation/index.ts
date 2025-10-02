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
    // Use the official Supabase service role key from the environment for admin operations.
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    trace('env-configuration-loaded', {
      hasUrl: Boolean(supabaseUrl),
      hasAnon: Boolean(supabaseAnonKey),
      hasService: Boolean(supabaseServiceKey),
    })

    // Log a masked version of the Authorization header for debugging
    const maskedAuth = authHeader ? (authHeader.substring(0, 10) + '...') : 'missing'
    trace('auth-header-debug', { maskedAuth })

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

    const parseOptionalNumber = (value: unknown) => {
      if (value === null || value === undefined || value === '') return null
      const num = Number(value)
      return Number.isFinite(num) ? num : null
    }

    const sanitizedTeamId = parseOptionalNumber(team_id)
    const sanitizedReportsToId = parseOptionalNumber(reports_to_id)
    const normalizedAccessType = (access_type || 'staff').toString().toLowerCase()
    const invitationFullName = name || email

    // Check for existing master_users record
    const { data: existingUserRecord, error: existingUserError } = await serviceClient
      .from('master_users')
      .select('*')
      .eq('email', email)
      .eq('site_id', site_id ?? normalizedSiteId)
      .maybeSingle()

    if (existingUserError && existingUserError.code && existingUserError.code !== 'PGRST116') {
      trace('existing-user-lookup-error', {
        code: existingUserError.code,
        message: existingUserError.message,
        details: existingUserError.details,
      })
      throw new Error('Failed to check existing user state')
    }

    const hasExistingUser = Boolean(existingUserRecord)
    const existingUserHasAccount = Boolean(existingUserRecord?.auth_user_id)

    if (!resend && hasExistingUser && existingUserHasAccount) {
      trace('duplicate-email-active-account', { email })
      throw new Error('User with this email already exists')
    }

    const normalizedSiteId = resend
      ? existingUserRecord?.site_id ?? site_id ?? 2
      : site_id ?? 2

    // Upsert site_invites entry here (replace front-end insert)
    const inviteExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const inviteRow = {
      site_id: normalizedSiteId,
      email,
      full_name: invitationFullName,
      role: normalizedAccessType,
      role_detail: role_detail || existingUserRecord?.role_detail || null,
      reports_to_id: sanitizedReportsToId ?? existingUserRecord?.reports_to_id ?? null,
      status: 'pending',
      expires_at: inviteExpiry,
      invited_by: user.id,
    }

    const { data: existingInvite, error: existingInviteError } = await serviceClient
      .from('site_invites')
      .select('id, status, created_at')
      .eq('site_id', normalizedSiteId)
      .eq('email', email)
      .maybeSingle()

    if (existingInviteError && existingInviteError.code && existingInviteError.code !== 'PGRST116') {
      trace('site-invite-lookup-error', {
        code: existingInviteError.code,
        message: existingInviteError.message,
        details: existingInviteError.details,
      })
      throw new Error('Failed to prepare invitation record')
    }

    if (existingInvite) {
      const { error: updateInviteError } = await serviceClient
        .from('site_invites')
        .update({ ...inviteRow })
        .eq('id', existingInvite.id)

      if (updateInviteError) {
        trace('site-invite-update-error', {
          message: updateInviteError.message,
          code: updateInviteError.code,
          details: updateInviteError.details,
        })
        throw new Error('Failed to refresh existing invitation')
      }

      trace('site-invite-updated', {
        inviteId: existingInvite.id,
        email,
        expiresAt: inviteExpiry,
      })
    } else {
      const { error: insertInviteError } = await serviceClient
        .from('site_invites')
        .insert({ ...inviteRow })

      if (insertInviteError) {
        trace('site-invite-insert-error', {
          message: insertInviteError.message,
          code: insertInviteError.code,
          details: insertInviteError.details,
        })
        throw new Error('Failed to create invitation record')
      }

      trace('site-invite-inserted', {
        email,
        expiresAt: inviteExpiry,
      })
    }

    const redirectTo = `https://checkloops.co.uk/simple-set-password.html?email=${encodeURIComponent(email)}&site_id=${normalizedSiteId}`

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
      redirectTo,
    }

    trace('invitation-prepared', {
      resend: resend || (hasExistingUser && !existingUserHasAccount),
      normalizedSiteId,
      fullName: invitationFullName,
      accessType: normalizedAccessType,
      roleDetail: role_detail ?? existingUserRecord?.role_detail ?? null,
      teamId: sanitizedTeamId ?? existingUserRecord?.team_id ?? null,
      reportsToId: sanitizedReportsToId ?? existingUserRecord?.reports_to_id ?? null,
      redirectTo,
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

    const nowIso = new Date().toISOString()
    const masterUserPayload = {
      email,
      full_name: invitationFullName,
      access_type: normalizedAccessType,
      role: normalizedAccessType,
      role_detail: role_detail || existingUserRecord?.role_detail || null,
      team_id: sanitizedTeamId ?? existingUserRecord?.team_id ?? null,
      reports_to_id: sanitizedReportsToId ?? existingUserRecord?.reports_to_id ?? null,
      invite_status: 'pending',
      invite_sent_at: nowIso,
      invite_expires_at: inviteExpiry,
      invited_by: user.id,
      site_id: normalizedSiteId,
      updated_at: nowIso,
    }

    if (existingUserRecord) {
      const { error: updateUserError } = await serviceClient
        .from('master_users')
        .update(masterUserPayload)
        .eq('id', existingUserRecord.id)

      if (updateUserError) {
        console.error(`[send-invitation][${requestId}] master_users update error`, updateUserError)
        trace('database-update-error', {
          message: updateUserError.message,
          code: updateUserError.code,
          details: updateUserError.details,
        })
      } else {
        trace('database-update-complete', {
          email,
          table: 'master_users',
          id: existingUserRecord.id,
        })
      }
    } else {
      const insertPayload = { ...masterUserPayload, created_at: nowIso }
      const { error: dbError } = await serviceClient
        .from('master_users')
        .insert(insertPayload)

      if (dbError) {
        console.error(`[send-invitation][${requestId}] master_users insert error`, dbError)
        trace('database-insert-error', {
          message: dbError.message,
          code: dbError.code,
          details: dbError.details,
        })
      } else {
        trace('database-insert-complete', {
          email,
          table: 'master_users',
        })
      }
    }

    const finalResend = resend || (hasExistingUser && !existingUserHasAccount)

    trace('completed', { email, resend: finalResend })

    return new Response(
      JSON.stringify({
        success: true,
        message: finalResend
          ? `Invitation resent successfully to ${email}`
          : `Invitation sent successfully to ${email}`,
        debug: debugSteps,
        requestId,
      }),
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
