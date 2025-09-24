import { createClient } from '@supabase/supabase-js';

// Test script to debug the invitation flow
const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
// Use the service role key from .env
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function debugInvitationFlow() {
  console.log('=== Debugging Invitation Flow ===\n');

  // 1. Check recent auth logs
  console.log('1. Checking recent auth logs for ben.howard@stoke.nhs.uk...');
  try {
    const { data: authLogs, error: logsError } = await supabase
      .from('auth.audit_log_entries')
      .select('*')
      .ilike('payload', '%ben.howard@stoke.nhs.uk%')
      .order('created_at', { ascending: false })
      .limit(10);

    if (logsError) {
      console.error('Error fetching auth logs:', logsError);
    } else {
      console.log('Recent auth events:', authLogs?.map(log => ({
        event: log.event,
        created_at: log.created_at,
        ip: log.ip
      })));
    }
  } catch (error) {
    console.error('Failed to fetch auth logs:', error);
  }

  // 2. Check user in auth.users
  console.log('\n2. Checking user in auth.users...');
  try {
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
      console.error('Error fetching users:', userError);
    } else {
      const testUser = userData.users.find(u => u.email === 'ben.howard@stoke.nhs.uk');
      if (testUser) {
        console.log('User found:', {
          id: testUser.id,
          email: testUser.email,
          email_confirmed: testUser.email_confirmed_at ? true : false,
          created_at: testUser.created_at,
          last_sign_in_at: testUser.last_sign_in_at,
          user_metadata: testUser.user_metadata
        });
      } else {
        console.log('User not found in auth.users');
      }
    }
  } catch (error) {
    console.error('Failed to fetch user:', error);
  }

  // 3. Check master_users table
  console.log('\n3. Checking master_users...');
  try {
    const { data: masterUsers, error: masterError } = await supabase
      .from('master_users')
      .select('*')
      .ilike('email', 'ben.howard@stoke.nhs.uk');

    if (masterError) {
      console.error('Error fetching master_users:', masterError);
    } else {
      console.log('Master users found:', masterUsers);
    }
  } catch (error) {
    console.error('Failed to fetch master_users:', error);
  }

  // 4. Check site_invites table
  console.log('\n4. Checking site_invites...');
  try {
    const { data: invites, error: invitesError } = await supabase
      .from('site_invites')
      .select('*')
      .eq('email', 'ben.howard@stoke.nhs.uk')
      .order('created_at', { ascending: false });

    if (invitesError) {
      console.error('Error fetching invites:', invitesError);
    } else {
      console.log('Invites found:', invites?.map(invite => ({
        id: invite.id,
        status: invite.status,
        created_at: invite.created_at,
        accepted_at: invite.accepted_at,
        site_id: invite.site_id,
        role: invite.role,
        role_detail: invite.role_detail
      })));
    }
  } catch (error) {
    console.error('Failed to fetch invites:', error);
  }
}

debugInvitationFlow().then(() => {
  console.log('\n=== Debug Complete ===');
  process.exit(0);
}).catch((error) => {
  console.error('Debug script failed:', error);
  process.exit(1);
});