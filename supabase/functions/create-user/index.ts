import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface CreateUserRequest {
  email: string
  password: string
  fullName: string
  siteId: number
  role?: string
  totalHours?: number
  totalSessions?: number
  mondayHours?: number
  tuesdayHours?: number
  wednesdayHours?: number
  thursdayHours?: number
  fridayHours?: number
  holidayEntitlement?: number
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Create admin client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAdmin = createClient(supabaseUrl, serviceKey)

    // Verify the requesting user is an admin
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profileError || profile?.role !== 'Admin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin access required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Get request data
    const requestData: CreateUserRequest = await req.json()

    // Validate required fields
    if (!requestData.email || !requestData.password || !requestData.fullName || !requestData.siteId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: requestData.email,
      password: requestData.password,
      email_confirm: true
    })

    if (authError) {
      return new Response(
        JSON.stringify({ error: `Failed to create auth user: ${authError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create profile
    const { data: profileData, error: createProfileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        email: requestData.email,
        full_name: requestData.fullName,
        site_id: requestData.siteId,
        role: requestData.role || 'Visitor',
        total_hours: requestData.totalHours || 0,
        total_sessions: requestData.totalSessions || 0,
        monday_hours: requestData.mondayHours || 0,
        tuesday_hours: requestData.tuesdayHours || 0,
        wednesday_hours: requestData.wednesdayHours || 0,
        thursday_hours: requestData.thursdayHours || 0,
        friday_hours: requestData.fridayHours || 0,
        holiday_entitlement: requestData.holidayEntitlement || 25
      })
      .select()
      .single()

    if (createProfileError) {
      // Rollback: delete auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)

      return new Response(
        JSON.stringify({ error: `Failed to create profile: ${createProfileError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create kiosk user
    const { data: kioskData, error: kioskError } = await supabaseAdmin
      .from('kiosk_users')
      .insert({
        site_id: requestData.siteId,
        full_name: requestData.fullName,
        user_id: authData.user.id
      })
      .select()
      .single()

    if (!kioskError && kioskData) {
      // Update profile with kiosk_user_id
      await supabaseAdmin
        .from('profiles')
        .update({ kiosk_user_id: kioskData.id })
        .eq('id', profileData.id)
    }

    // Send password reset email for user to set their own password
    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(
      requestData.email,
      { redirectTo: `${req.headers.get('origin')}/simple-set-password.html` }
    )

    if (resetError) {
      console.error('Password reset email failed:', resetError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          profile: profileData,
          kioskUserId: kioskData?.id
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error in create-user function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})