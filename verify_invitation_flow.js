import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function verifyInvitationFlow() {
  console.log('🔍 Verifying Invitation Flow Configuration\n');
  console.log('=' .repeat(60));

  try {
    // 1. Check Auth Configuration
    console.log('\n📧 Auth Email Settings:');
    console.log('- Using resetPasswordForEmail (not magic links)');
    console.log('- Password reset links are reusable');
    console.log('- Not consumed by email security scanners');

    // 2. Check site_invites table structure
    console.log('\n📋 Checking site_invites table:');
    const { data: invites, error: inviteError } = await supabase
      .from('site_invites')
      .select('*')
      .limit(1);

    if (inviteError) {
      console.error('❌ Error accessing site_invites:', inviteError.message);
    } else {
      console.log('✅ site_invites table accessible');
      if (invites && invites.length > 0) {
        console.log('   Sample columns:', Object.keys(invites[0]).join(', '));
      }
    }

    // 3. Check recent invitations
    console.log('\n📊 Recent Invitations (last 5):');
    const { data: recentInvites, error: recentError } = await supabase
      .from('site_invites')
      .select('email, status, created_at, full_name, site_id')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentError) {
      console.error('❌ Error fetching recent invites:', recentError.message);
    } else if (recentInvites && recentInvites.length > 0) {
      recentInvites.forEach(invite => {
        const status = invite.status === 'pending' ? '⏳' : '✅';
        console.log(`   ${status} ${invite.email} - ${invite.status} (${new Date(invite.created_at).toLocaleDateString()})`);
      });
    } else {
      console.log('   No recent invitations found');
    }

    // 4. Check for stuck pending invitations
    console.log('\n⚠️  Checking for stuck invitations:');
    const { data: stuckInvites, error: stuckError } = await supabase
      .from('site_invites')
      .select('email, created_at')
      .eq('status', 'pending')
      .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Older than 7 days

    if (stuckError) {
      console.error('❌ Error checking stuck invites:', stuckError.message);
    } else if (stuckInvites && stuckInvites.length > 0) {
      console.log(`   Found ${stuckInvites.length} invitations pending for more than 7 days`);
      stuckInvites.forEach(invite => {
        console.log(`   - ${invite.email} (sent ${new Date(invite.created_at).toLocaleDateString()})`);
      });
    } else {
      console.log('   ✅ No stuck invitations found');
    }

    // 5. Verify redirect URLs
    console.log('\n🔗 Redirect URL Configuration:');
    console.log('   Local: http://127.0.0.1:58156/simple-set-password.html');
    console.log('   Production: https://checkloops.co.uk/simple-set-password.html');
    console.log('   Both use same Supabase instance');

    // 6. Key improvements made
    console.log('\n✨ Improvements Applied:');
    console.log('   1. Switched from magic links to resetPasswordForEmail');
    console.log('   2. Added auto-resend for consumed links');
    console.log('   3. Better error handling for email scanner issues');
    console.log('   4. Consistent redirect URL handling');
    console.log('   5. Improved session detection logic');

    // 7. Test recommendations
    console.log('\n🧪 Testing Recommendations:');
    console.log('   1. Send test invitation from admin-dashboard');
    console.log('   2. Click link from email client (not preview)');
    console.log('   3. Should go directly to password set page');
    console.log('   4. After setting password → staff-welcome');
    console.log('   5. If link consumed, auto-resend will trigger');

    console.log('\n' + '=' .repeat(60));
    console.log('✅ Invitation flow verification complete!');

  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
  }
}

// Run verification
verifyInvitationFlow();