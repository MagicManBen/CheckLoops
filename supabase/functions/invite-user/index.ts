import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Parse request body
    let { full_name, email, access_type, role_detail, team_id, site_id, password } = await req.json()

    // Generate temporary password if not provided
    if (!password) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%'
      password = ''
      for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      console.log('Generated temporary password for user')
    }

    // Validate required fields
    if (!full_name || !email || !access_type || !role_detail) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: full_name, email, access_type, role_detail are required'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Comprehensive check if user already exists (handle pagination)
    console.log(`Checking if user exists: ${email}`)

    let allUsers = []
    let page = 1
    const perPage = 1000
    let hasMore = true

    while (hasMore) {
      console.log(`Fetching users page ${page}...`)
      const { data: usersPage, error: checkError } = await supabaseAdmin.auth.admin.listUsers({
        page: page,
        perPage: perPage
      })

      if (checkError) {
        console.error('Error checking existing users:', checkError)
        break
      }

      if (usersPage?.users) {
        allUsers = allUsers.concat(usersPage.users)
        console.log(`Found ${usersPage.users.length} users on page ${page}`)

        // Check if there are more pages
        hasMore = usersPage.users.length === perPage
        page++
      } else {
        hasMore = false
      }
    }

    console.log(`Total users found: ${allUsers.length}`)
    console.log(`Searching for email: "${email}"`)

    // Log all emails for debugging
    const allEmails = allUsers.map(user => user.email).filter(Boolean)
    console.log(`All emails in system: ${JSON.stringify(allEmails)}`)

    const existingUser = allUsers.find(user => {
      const userEmail = user.email?.toLowerCase()
      const searchEmail = email.toLowerCase()
      console.log(`Comparing: "${userEmail}" vs "${searchEmail}"`)
      return userEmail === searchEmail
    })

    if (existingUser) {
      console.log(`User already exists with email: ${email}`, existingUser)
      return new Response(
        JSON.stringify({
          error: `User with email ${email} already exists in the system`,
          code: 'user_already_exists',
          details: {
            existing_user_id: existingUser.id,
            created_at: existingUser.created_at,
            display_name: existingUser.user_metadata?.full_name || 'Unknown'
          }
        }),
        {
          status: 409, // Conflict
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`No existing user found with email: ${email}`)

    console.log(`Creating user: ${email} with role: ${role_detail}`)

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Skip email verification
      user_metadata: {
        full_name: full_name,
        access_type: access_type,
        role_detail: role_detail,
        site_id: site_id || null,
        needs_onboarding: true // Flag to redirect to staff-welcome after password set
      }
    })

    if (authError) {
      console.error('Auth creation error:', authError)

      // Handle specific error types
      let errorMessage = authError.message
      let errorCode = authError.code || 'auth_creation_failed'
      let statusCode = 400

      if (authError.message?.includes('already registered') ||
          authError.message?.includes('already exists') ||
          authError.code === 'user_already_exists') {
        errorMessage = `User with email ${email} already exists`
        errorCode = 'user_already_exists'
        statusCode = 409
      } else if (authError.message?.includes('Database error')) {
        errorMessage = 'Database error during user creation - user may already exist'
        errorCode = 'database_constraint_violation'
        statusCode = 409
      }

      return new Response(
        JSON.stringify({
          error: errorMessage,
          code: errorCode,
          details: authError,
          suggestion: statusCode === 409 ? 'Try using a different email address' : 'Please check the user data and try again'
        }),
        {
          status: statusCode,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Auth user created: ${authData.user.id}`)

    // Prepare user record for master_users table
    const userRecord = {
      full_name,
      email,
      access_type,
      role_detail,
      team_id: team_id || null,
      site_id: site_id || null,
      auth_user_id: authData.user.id
    }

    // Insert into master_users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from('master_users')
      .insert([userRecord])
      .select()

    if (userError) {
      console.error('Database insertion error:', userError)

      // Clean up auth user if database insert fails
      console.log('Cleaning up auth user due to database error...')
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)

      return new Response(
        JSON.stringify({
          error: `Failed to create user record: ${userError.message}`,
          details: userError
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`User record created successfully: ${userData[0]?.id}`)

    // Send password reset email so user can set their own password
    console.log('Sending password reset email to user...')
    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: 'https://checkloops.co.uk/simple-set-password.html'
      }
    )

    if (resetError) {
      console.warn('Failed to send password reset email:', resetError)
      // Don't fail the whole operation if email fails
      // Admin can resend invitation later
    } else {
      console.log('Password reset email sent successfully')
    }

    // Return success response with user details
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: userData[0]?.id,
          auth_user_id: authData.user.id,
          full_name,
          email,
          access_type,
          role_detail,
          team_id,
          site_id,
          created_at: authData.user.created_at
        },
        email_sent: !resetError,
        message: resetError 
          ? 'User created but email failed to send. Please resend invitation.'
          : 'User created and invitation email sent successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})