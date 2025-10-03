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
    console.log('🚀 Staff invitation function started')

    // Use the built-in Supabase service role key (provided automatically)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    console.log('🔍 Environment check:')
    console.log(`📍 SUPABASE_URL: ${supabaseUrl ? '✅ Available' : '❌ Missing'}`)
    console.log(`🔑 SUPABASE_SERVICE_ROLE_KEY: ${serviceRoleKey ? '✅ Available' : '❌ Missing'}`)

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ Missing required environment variables')
      console.error('Available env vars:', Object.keys(Deno.env.toObject()).sort())
      return new Response(
        JSON.stringify({
          error: 'Server configuration error: Missing required environment variables',
          debug: {
            supabaseUrl: !!supabaseUrl,
            serviceRoleKey: !!serviceRoleKey,
            allEnvVars: Object.keys(Deno.env.toObject()).sort()
          }
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`✅ Using built-in SUPABASE_SERVICE_ROLE_KEY`)
    console.log(`🔑 Service role key preview: ${serviceRoleKey.substring(0, 30)}...`)
    console.log(`📍 Supabase URL: ${supabaseUrl}`)

    // Initialize Supabase client with the official service role key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('✅ Supabase admin client initialized with custom service key')

    // Parse request body
    const requestBody = await req.json()
    const { full_name, email, access_type, role_detail, team_id, site_id, password } = requestBody

    console.log('📝 Request data received:', {
      full_name,
      email,
      access_type,
      role_detail,
      team_id,
      site_id,
      passwordProvided: !!password
    })

    // Validate required fields
    if (!full_name || !email || !access_type || !role_detail) {
      console.log('❌ Missing required fields')
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
      console.log('❌ Invalid email format:', email)
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`🔍 Checking if user already exists: ${email}`)

    // Check if user already exists in Auth
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()

    if (listError) {
      console.error('❌ Error listing users:', listError)
    } else {
      console.log(`📊 Found ${existingUsers.users?.length || 0} total users in Auth`)

      // Log all emails for debugging
      const allEmails = existingUsers.users?.map(user => user.email).filter(Boolean) || []
      console.log('📧 All emails in system:', allEmails)

      const existingUser = existingUsers.users?.find(user =>
        user.email?.toLowerCase() === email.toLowerCase()
      )

      if (existingUser) {
        console.log(`⚠️ User already exists:`, {
          id: existingUser.id,
          email: existingUser.email,
          created_at: existingUser.created_at
        })

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
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    console.log(`✅ No existing user found, proceeding with creation for: ${email}`)

    // Create user in Supabase Auth using admin client
    console.log('👤 Creating Auth user...')
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Skip email verification
      user_metadata: {
        full_name: full_name,
        access_type: access_type,
        role_detail: role_detail
      }
    })

    if (authError) {
      console.error('❌ Auth user creation failed:', {
        message: authError.message,
        code: authError.code,
        status: authError.status,
        name: authError.name,
        fullError: authError
      })

      // Handle ONLY specific duplicate user errors - NOT generic database errors
      if ((authError.message?.includes('already registered') ||
           authError.message?.includes('already exists')) &&
          !authError.message?.includes('Database error')) {
        console.log('🔍 Detected legitimate duplicate user error')
        return new Response(
          JSON.stringify({
            error: `User with email ${email} already exists`,
            code: 'user_already_exists',
            details: authError,
            suggestion: 'Try using a different email address'
          }),
          {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Handle 500 "unexpected_failure" errors specifically
      if (authError.status === 500 && authError.code === 'unexpected_failure') {
        console.error('🚨 Supabase Auth returned 500 unexpected_failure - likely permission issue')
        return new Response(
          JSON.stringify({
            error: 'Service configuration error: Unable to create user accounts',
            code: 'service_permission_error',
            details: {
              message: authError.message,
              code: authError.code,
              status: authError.status,
              suggestion: 'Service key may lack admin permissions or be invalid'
            },
            troubleshooting: 'Check service key permissions and edge function configuration'
          }),
          {
            status: 503, // Service Unavailable
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // All other auth errors
      console.error('🔍 Unhandled auth error type:', authError)
      return new Response(
        JSON.stringify({
          error: `Authentication service error: ${authError.message}`,
          code: 'auth_service_error',
          details: authError,
          suggestion: 'Contact system administrator'
        }),
        {
          status: 502, // Bad Gateway
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`✅ Auth user created successfully:`, {
      id: authData.user.id,
      email: authData.user.email,
      created_at: authData.user.created_at
    })

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

    console.log('💾 Inserting user record into master_users table:', userRecord)

    // Insert into master_users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from('master_users')
      .insert([userRecord])
      .select()

    if (userError) {
      console.error('❌ Database insertion failed:', userError)

      // Clean up auth user if database insert fails
      console.log('🧹 Cleaning up auth user due to database error...')
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(authData.user.id)

      if (deleteError) {
        console.error('❌ Failed to cleanup auth user:', deleteError)
      } else {
        console.log('✅ Auth user cleaned up successfully')
      }

      return new Response(
        JSON.stringify({
          error: `Failed to create user record: ${userError.message}`,
          code: 'database_insertion_failed',
          details: userError
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`🎉 Staff invitation completed successfully:`, {
      auth_user_id: authData.user.id,
      master_user_id: userData[0]?.id,
      email: email,
      full_name: full_name
    })

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Staff member invited successfully',
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
        credentials: {
          email,
          password
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('💥 Unexpected error in staff invitation function:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error during staff invitation',
        details: error.message,
        code: 'unexpected_error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})