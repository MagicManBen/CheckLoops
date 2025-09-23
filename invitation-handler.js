// Secure invitation handler
// This file handles the invitation logic without exposing service keys in the frontend

async function sendInvitation(name, email, accessType) {
  try {
    // Generate invitation token
    const invitationToken = crypto.randomUUID();
    const invitationExpiry = new Date();
    invitationExpiry.setDate(invitationExpiry.getDate() + 7); // 7 days expiry

    // First, try to use the Edge Function if deployed
    try {
      const { data: edgeResponse, error: edgeError } = await window.supabase.functions.invoke('send-invitation', {
        body: {
          name,
          email,
          accessType,
          invitationToken,
          invitationExpiry: invitationExpiry.toISOString()
        }
      });

      if (!edgeError && edgeResponse?.success) {
        return { success: true, message: 'Invitation sent via Edge Function' };
      }
    } catch (e) {
      console.log('Edge Function not available, using direct method');
    }

    // Fallback: Direct database insertion (requires proper RLS policies)
    // Check if user already exists
    const { data: existingUser } = await window.supabase
      .from('master_users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Insert new user record with invitation
    const { data: newUser, error: insertError } = await window.supabase
      .from('master_users')
      .insert({
        full_name: name,
        email,
        access_type: accessType,
        invitation_token: invitationToken,
        invitation_expires_at: invitationExpiry,
        invite_status: 'pending',
        invited_by: (await window.supabase.auth.getUser()).data.user?.id,
        invite_sent_at: new Date().toISOString(),
        active: true,
        created_at: new Date().toISOString(),
        onboarding_complete: false,
        onboarding_required: true
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Generate the invitation link
    const invitationLink = `https://checkloops.co.uk/setup-password.html?token=${invitationToken}`;

    // For demonstration, log the invitation link
    console.log('Invitation link generated:', invitationLink);
    console.log('Please send this link to:', email);

    // In production, you would send this via email service
    // You can integrate with services like SendGrid, Mailgun, or AWS SES

    return {
      success: true,
      message: `Invitation created for ${email}. Link: ${invitationLink}`,
      invitationLink
    };

  } catch (error) {
    console.error('Error sending invitation:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Export for use in admin dashboard
if (typeof window !== 'undefined') {
  window.sendInvitation = sendInvitation;
}