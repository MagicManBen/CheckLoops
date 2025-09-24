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

  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Create Supabase client with user's token to verify they're authenticated
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    // Verify the user is authenticated
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    })

    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Check if user is admin
    const { data: userData, error: userError } = await userClient
      .from('master_users')
      .select('access_type')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !userData || (userData.access_type !== 'admin' && userData.access_type !== 'owner')) {
      throw new Error('Only admins can send invitations')
    }

    // Parse request body
    const { email, name, site_id, resend = false } = await req.json()

    if (!email) {
      throw new Error('Email is required')
    }

    if (!resend && !name) {
      throw new Error('Name is required for new invitations')
    }

    // Create service client for admin operations
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    // If resending, get existing user data
    let userData = null
    if (resend) {
      const { data: existing } = await serviceClient
        .from('master_users')
        .select('*')
        .eq('email', email)
        .single()

      if (!existing) {
        throw new Error('User not found. Cannot resend invitation.')
      }
      userData = existing
    } else {
      // Check if user already exists (for new invitations)
      const { data: existingUser } = await serviceClient
        .from('master_users')
        .select('*')
        .eq('email', email)
        .single()

      if (existingUser) {
        throw new Error('User with this email already exists')
      }
    }

    // Send invitation through Supabase Auth Admin API
    const inviteData = resend ? {
      data: {
        full_name: userData?.full_name || email,
        invited: true,
        site_id: userData?.site_id || site_id || 2,
      },
    } : {
      data: {
        full_name: name,
        invited: true,
        site_id: site_id || 2,
      },
    }

    const { data: invitation, error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(email, inviteData)

    if (inviteError) {
      console.error('Invitation error:', inviteError)
      throw new Error(`Failed to send invitation: ${inviteError.message}`)
    }

    // Create entry in master_users table (only for new invitations)
    if (!resend) {
      const { error: dbError } = await serviceClient
        .from('master_users')
        .insert({
          email: email,
          full_name: name,
          access_type: 'user',
          site_id: site_id || 2,
          created_at: new Date().toISOString(),
        })

      if (dbError) {
        console.error('Database error creating user record:', dbError)
        // Continue anyway - invitation was sent
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Invitation sent successfully to ${email}`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in send-invitation function:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})