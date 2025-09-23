const { createClient } = require('@supabase/supabase-js');

// Test the complete invitation flow
const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.cOj-r15UfnJ6O-Ty8wkFsvPRJX3VpOdI5sJJqqMdvQo';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testInvitationFlow() {
  console.log('🧪 Testing invitation flow...\n');

  try {
    // Step 1: First, sign in as admin
    console.log('1️⃣ Authenticating as admin...');
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: 'ben.howard@stoke.nhs.uk',
      password: 'admin123' // You'll need to use the actual admin password
    });

    if (authError) {
      console.error('❌ Admin auth failed:', authError.message);
      console.log('Please ensure you have a valid admin account.');
      return;
    }

    console.log('✅ Admin authenticated successfully\n');

    // Step 2: Get admin's session token
    const session = authData.session;
    if (!session) {
      console.error('❌ No session available');
      return;
    }

    // Step 3: Call the invitation function
    console.log('2️⃣ Sending invitation via Edge Function...');
    const testEmail = `test.user.${Date.now()}@checkloops.test`;

    const response = await fetch(`${supabaseUrl}/functions/v1/simple-invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'x-redirect-url': 'https://checkloops.co.uk/simple-set-password.html'
      },
      body: JSON.stringify({
        email: testEmail,
        name: 'Test User',
        role: 'staff',
        role_detail: 'Nurse',
        reports_to_id: null
      })
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('❌ Invitation failed:', responseData.error || 'Unknown error');
      console.log('Response status:', response.status);
      console.log('Response data:', responseData);
      return;
    }

    console.log('✅ Invitation sent successfully!');
    console.log('Response:', responseData);
    console.log('');

    // Step 4: Check if site_invites record was created
    console.log('3️⃣ Verifying site_invites record...');
    const { data: inviteRecord, error: inviteError } = await supabaseAdmin
      .from('site_invites')
      .select('*')
      .eq('email', testEmail)
      .single();

    if (inviteError) {
      console.error('❌ Could not find invite record:', inviteError.message);
    } else {
      console.log('✅ Invite record created:');
      console.log('  - ID:', inviteRecord.id);
      console.log('  - Email:', inviteRecord.email);
      console.log('  - Name:', inviteRecord.full_name);
      console.log('  - Role:', inviteRecord.role);
      console.log('  - Status:', inviteRecord.status);
      console.log('  - Site ID:', inviteRecord.site_id);
    }

    console.log('\n📧 Test email sent to:', testEmail);
    console.log('Note: Since this is a test email, it won\'t actually receive the magic link.');
    console.log('\n✨ Invitation flow test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testInvitationFlow();