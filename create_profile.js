// Script to create profile for staff user via Supabase API
// Run this in browser console on the app to create the missing profile

async function createStaffProfile() {
  try {
    // Import Supabase
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');

    // Initialize Supabase client
    const supabase = createClient(
      'https://unveoqnlqnobufhublyw.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME'
    );

    // Get current session to get user ID
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('No active session found');
      return;
    }

    console.log('Current user:', session.user.email, session.user.id);

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (existingProfile) {
      console.log('Profile already exists:', existingProfile);

      // Update existing profile to ensure all required fields are present
      const updateData = {
        nickname: existingProfile.nickname || 'Ben',
        role: existingProfile.role || 'staff',
        avatar_url: existingProfile.avatar_url || 'https://via.placeholder.com/64x64.png?text=Staff',
        onboarding_complete: true,
        site_id: existingProfile.site_id || 1
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', session.user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
      } else {
        console.log('Profile updated successfully');
      }
    } else {
      // Create new profile
      const profileData = {
        user_id: session.user.id,
        full_name: session.user.raw_user_meta_data?.full_name || 'Ben Howard',
        nickname: 'Ben',
        role: 'staff',
        avatar_url: 'https://via.placeholder.com/64x64.png?text=Staff',
        onboarding_complete: true,
        site_id: 1
      };

      const { error: insertError } = await supabase
        .from('profiles')
        .insert(profileData);

      if (insertError) {
        console.error('Error creating profile:', insertError);
      } else {
        console.log('Profile created successfully');
      }
    }

    // Also create/update staff_app_welcome record
    const welcomeData = {
      user_id: session.user.id,
      site_id: 1,
      full_name: session.user.raw_user_meta_data?.full_name || 'Ben Howard',
      nickname: 'Ben',
      role_detail: 'staff',
      team_id: 1,
      team_name: 'General Staff',
      avatar_url: 'https://via.placeholder.com/64x64.png?text=Staff'
    };

    const { error: welcomeError } = await supabase
      .from('staff_app_welcome')
      .upsert(welcomeData);

    if (welcomeError) {
      console.error('Error creating staff_app_welcome:', welcomeError);
    } else {
      console.log('staff_app_welcome record created/updated successfully');
    }

    // Update user metadata
    const { error: userError } = await supabase.auth.updateUser({
      data: {
        welcome_completed_at: new Date().toISOString(),
        onboarding_required: false,
        role: 'staff'
      }
    });

    if (userError) {
      console.error('Error updating user metadata:', userError);
    } else {
      console.log('User metadata updated successfully');
    }

    console.log('Profile setup complete! Try refreshing the page.');

  } catch (error) {
    console.error('Error in createStaffProfile:', error);
  }
}

// Run the function
createStaffProfile();