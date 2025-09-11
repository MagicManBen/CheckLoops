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
    'https://magicmanben.github.io'
  ]
  
  return allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
}

const getCorsHeaders = (req: Request) => ({
  'Access-Control-Allow-Origin': getAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Credentials': 'true'
})

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) })
  }

  try {
    const { invite_id } = await req.json()

    if (!invite_id) {
      throw new Error('Missing required field: invite_id')
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SECRET_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables')
    }

    // Create Supabase admin client with service key for full access
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Get user from Authorization header to verify they're an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Invalid authorization')
    }

    // Get inviter's profile to verify they're an admin
    const { data: inviterProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('site_id, role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !inviterProfile) {
      throw new Error('Inviter profile not found')
    }

    if (inviterProfile.role !== 'admin' && inviterProfile.role !== 'owner') {
      throw new Error('Only admins can cancel invitations')
    }

    // Step 1: Get the invitation details
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('site_invites')
      .select('*')
      .eq('id', invite_id)
      .eq('site_id', inviterProfile.site_id)
      .single()

    if (inviteError || !invite) {
      throw new Error('Invitation not found or access denied')
    }

    // Verify the invitation is still pending
    if (invite.status !== 'pending') {
      throw new Error(`Cannot cancel invitation with status: ${invite.status}`)
    }

    console.log('Found invitation to cancel:', {
      id: invite.id,
      email: invite.email,
      name: invite.full_name,
      status: invite.status
    })

    // Step 2: Find the auth user created for this invitation
    // We need to search by email since that's what we have
    const { data: authUsers, error: authListError } = await supabaseAdmin
      .auth
      .admin
      .listUsers()

    if (!authListError && authUsers) {
      // Find the user with matching email who hasn't confirmed yet
      const authUser = authUsers.users.find(u => 
        u.email === invite.email && 
        !u.email_confirmed_at // User hasn't confirmed their email yet
      )

      if (authUser) {
        console.log('Found unconfirmed auth user to delete:', authUser.id)
        
        // Step 3: Delete the auth user
        const { error: deleteAuthError } = await supabaseAdmin
          .auth
          .admin
          .deleteUser(authUser.id)

        if (deleteAuthError) {
          console.error('Failed to delete auth user:', deleteAuthError)
          // Continue even if auth deletion fails
        } else {
          console.log('Successfully deleted auth user')
        }
      } else {
        console.log('No unconfirmed auth user found for this email')
      }
    }

    // Step 4: Delete from kiosk_users if exists
    if (invite.role_detail && invite.role_detail.trim() !== '') {
      const { error: kioskDeleteError } = await supabaseAdmin
        .from('kiosk_users')
        .delete()
        .eq('site_id', invite.site_id)
        .eq('full_name', invite.full_name)
        .eq('role', invite.role_detail)

      if (kioskDeleteError) {
        console.error('Failed to delete kiosk user:', kioskDeleteError)
        // Continue even if kiosk deletion fails
      } else {
        console.log('Deleted kiosk user entry')
      }
    }

    // Step 5: Update the invitation status to 'revoked'
    const { error: updateError } = await supabaseAdmin
      .from('site_invites')
      .update({ 
        status: 'revoked',
        accepted_at: null // Clear any acceptance timestamp
      })
      .eq('id', invite_id)

    if (updateError) {
      throw new Error(`Failed to update invitation status: ${updateError.message}`)
    }

    console.log('Successfully cancelled invitation')

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Invitation cancelled and all user traces removed successfully',
      details: {
        invite_id: invite_id,
        email: invite.email,
        name: invite.full_name
      }
    }), {
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error in cancel-invite function:', error)
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    })
  }
})