import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Generate secure temporary password
function generateSecurePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%'
  let result = ''
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🚀 Send invitation function started')

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ Missing required environment variables')
      return new Response(
        JSON.stringify({
          error: 'Server configuration error: Missing required environment variables'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('✅ Supabase admin client initialized')

    // Parse request body
    const requestBody = await req.json()
    const { email, full_name, resend, site_id } = requestBody

    console.log('📝 Request data received:', {
      email,
      full_name,
      resend: !!resend,
      site_id
    })

    // Validate required fields
    if (!email) {
      console.log('❌ Missing required field: email')
      return new Response(
        JSON.stringify({
          error: 'Missing required field: email'
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

    console.log(`📧 Processing invitation for: ${email}`)

    try {
      let userId = null
      let isNewUser = false

      // Check if user already exists
      console.log('🔍 Checking if user exists...')
      const { data: userList, error: lookupError } = await supabaseAdmin.auth.admin.listUsers()
      const existingUser = userList?.users?.find((u: any) => u.email === email) ? { user: userList.users.find((u: any) => u.email === email) } : null

      if (existingUser?.user) {
        console.log('✅ User already exists:', existingUser.user.id)
        userId = existingUser.user.id

        // For existing users on resend, just send password reset
        if (resend) {
          console.log('📬 Resending password reset for existing user')
        } else {
          console.log('⚠️ User already exists, sending password reset instead of creating')
        }
      } else {
        // Create new user only if not resending
        if (!resend) {
          console.log('👤 Creating new user account')
          const temporaryPassword = generateSecurePassword()
          console.log('🔐 Generated temporary password')

          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: temporaryPassword,
            email_confirm: true, // Auto-confirm email since admin is creating
            user_metadata: {
              full_name: full_name || 'Team Member',
              site_id: site_id || null,
              needs_onboarding: true, // Flag for staff-welcome redirect
              invitation_date: new Date().toISOString()
            }
          })

          if (createError) {
            console.error('❌ User creation failed:', createError)

            // Check if it's because user exists (race condition)
            if (createError.message?.includes('already registered') ||
                createError.message?.includes('already exists')) {
              console.log('📧 User exists (race condition), proceeding with password reset')
              const { data: retryList } = await supabaseAdmin.auth.admin.listUsers()
              const existingUserRetry = retryList?.users?.find((u: any) => u.email === email)
              if (existingUserRetry) {
                userId = existingUserRetry.id
              }
            } else if (createError.message?.includes('rate limit')) {
              return new Response(
                JSON.stringify({
                  error: 'Email rate limit exceeded. Please wait before sending another invitation.',
                  code: 'rate_limit_exceeded'
                }),
                {
                  status: 429,
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
              )
            } else {
              return new Response(
                JSON.stringify({
                  error: `Failed to create user: ${createError.message}`,
                  code: 'user_creation_failed'
                }),
                {
                  status: 400,
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
              )
            }
          } else {
            console.log('✅ User created successfully:', newUser.user?.id)
            userId = newUser.user?.id
            isNewUser = true
          }
        } else {
          console.log('❌ Cannot resend invitation for non-existent user')
          return new Response(
            JSON.stringify({
              error: 'No user found with this email address',
              code: 'user_not_found'
            }),
            {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
      }

      // Send password reset email (this uses YOUR SMTP configuration!)
      console.log('📮 Sending password reset email via YOUR SMTP configuration')

      // Use the client library method that respects SMTP settings
      const { data: resetData, error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: 'https://checkloops.co.uk/simple-set-password.html'
        }
      )

      if (resetError) {
        console.error('❌ Password reset email failed:', resetError)

        // If we created a user but couldn't send email, we should clean up
        if (isNewUser && userId) {
          console.log('🧹 Cleaning up created user due to email failure')
          await supabaseAdmin.auth.admin.deleteUser(userId)
        }

        if (resetError.message?.includes('rate limit')) {
          return new Response(
            JSON.stringify({
              error: 'Email rate limit exceeded. Please wait 60 seconds before sending another invitation.',
              code: 'rate_limit_exceeded'
            }),
            {
              status: 429,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        return new Response(
          JSON.stringify({
            error: `Failed to send password reset email: ${resetError.message}`,
            code: 'email_failed'
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      console.log('✅ Password reset email sent successfully using YOUR SMTP!')

      // Update the master_users table if this is a new invitation
      if (!resend && site_id) {
        try {
          console.log('💾 Updating master_users table')

          const { error: updateError } = await supabaseAdmin
            .from('master_users')
            .update({
              invite_status: 'pending',
              invite_sent_at: new Date().toISOString(),
              invite_expires_at: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString() // 7 days
            })
            .eq('email', email)
            .eq('site_id', site_id)

          if (updateError) {
            console.warn('⚠️ Failed to update master_users:', updateError)
          } else {
            console.log('✅ Updated master_users table')
          }
        } catch (dbError) {
          console.warn('⚠️ Database update error:', dbError)
        }
      }

      // Return success response
      const message = resend
        ? 'Password reset email resent successfully'
        : (isNewUser
          ? 'User created and password setup email sent successfully'
          : 'Password reset email sent to existing user')

      return new Response(
        JSON.stringify({
          success: true,
          message: message,
          email: email,
          user_id: userId,
          is_new_user: isNewUser,
          sent_via: 'Your configured SMTP server (no more via sender-sib.com!)',
          redirect_url: 'https://checkloops.co.uk/simple-set-password.html',
          flow: 'After setting password, user will be redirected to staff-welcome.html'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )

    } catch (emailError) {
      console.error('💥 Error in invitation process:', emailError)
      return new Response(
        JSON.stringify({
          error: 'Failed to process invitation',
          details: emailError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('💥 Unexpected error in send-invitation function:', error)
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