import { createClient } from '@supabase/supabase-js';

async function checkAdminInvites() {
  const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME';
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log('=== CHECKING SITE INVITES FOR ADMIN ACCESS ===\n');

  try {
    // Check both email addresses
    const emails = ['benhowardmagic@hotmail.com', 'ben.howard@stoke.nhs.uk'];

    for (const email of emails) {
      console.log(`Checking invites for: ${email}`);

      const { data: invites, error } = await supabase
        .from('site_invites')
        .select('*')
        .eq('email', email);

      if (error) {
        console.error('Error:', error);
        continue;
      }

      if (invites && invites.length > 0) {
        console.log(`Found ${invites.length} invite(s):`);
        invites.forEach(invite => {
          console.log(`  - ID: ${invite.id}, Role: ${invite.role}, Status: ${invite.status}, Site: ${invite.site_id}`);
        });
      } else {
        console.log('  No invites found');
      }
      console.log('');
    }

    // Check all admin/owner invites
    console.log('All admin/owner invites in system:');
    const { data: adminInvites, error: adminError } = await supabase
      .from('site_invites')
      .select('*')
      .in('role', ['admin', 'owner']);

    if (adminError) {
      console.error('Error fetching admin invites:', adminError);
    } else if (adminInvites && adminInvites.length > 0) {
      adminInvites.forEach(invite => {
        console.log(`  - Email: ${invite.email}, Role: ${invite.role}, Status: ${invite.status}, Site: ${invite.site_id}`);
      });
    } else {
      console.log('  No admin/owner invites found');
    }

  } catch (error) {
    console.error('Error checking invites:', error);
  }
}

checkAdminInvites().catch(console.error);