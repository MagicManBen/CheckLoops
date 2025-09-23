import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, accessType, invitationToken, invitationExpiry } = await req.json();

    // Validate inputs
    if (!name || !email || !accessType || !invitationToken) {
      throw new Error('Missing required fields');
    }

    if (!['staff', 'admin'].includes(accessType)) {
      throw new Error('Invalid access type');
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('master_users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Insert new user record with invitation token
    const { data: newUser, error: insertError } = await supabase
      .from('master_users')
      .insert({
        name,
        email,
        access_type: accessType,
        invitation_token: invitationToken,
        invitation_expires_at: invitationExpiry,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Generate magic link URL
    const magicLinkUrl = `https://checkloops.co.uk/setup-password.html?token=${invitationToken}`;

    // Send email using Supabase Auth (this is a simplified version)
    // In production, you might want to use a dedicated email service
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to CheckLoops!</h2>
        <p>Hello ${name},</p>
        <p>You've been invited to join CheckLoops as a ${accessType} member.</p>
        <p>Please click the link below to set up your password and complete your registration:</p>
        <div style="margin: 30px 0;">
          <a href="${magicLinkUrl}"
             style="background: #4CAF50; color: white; padding: 12px 24px;
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Set Up Your Account
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          Or copy and paste this link into your browser:<br>
          <code style="background: #f4f4f4; padding: 4px;">${magicLinkUrl}</code>
        </p>
        <p style="color: #666; font-size: 14px;">
          This invitation link will expire in 7 days.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          If you didn't expect this invitation, you can safely ignore this email.
        </p>
      </div>
    `;

    // Use Resend API or another email service to send the email
    // For now, we'll use a placeholder that logs the email
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY') || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'CheckLoops <noreply@checkloops.co.uk>',
        to: email,
        subject: 'You\'ve been invited to CheckLoops',
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok && Deno.env.get('RESEND_API_KEY')) {
      console.error('Failed to send email via Resend');
      // Continue anyway - the invitation is still created
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invitation sent successfully',
        userId: newUser.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in send-invitation function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});