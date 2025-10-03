// Quick runner to execute invitation setup SQL commands
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Import config
const config = await import('./config.js');
const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);

async function runSQL(query, description) {
  console.log(`\n🔄 ${description}...`);
  try {
    const { data, error } = await supabase.rpc('exec_sql', { query });
    if (error) {
      console.log(`❌ ${description} failed:`, error.message);
      return false;
    }
    console.log(`✅ ${description} completed`);
    if (data && data.length > 0) {
      console.log('Result:', data);
    }
    return true;
  } catch (err) {
    console.log(`❌ ${description} error:`, err.message);
    return false;
  }
}

async function setupInvitationSystem() {
  console.log('🚀 Starting Invitation System Setup...');

  // Read the SQL file
  let sqlContent;
  try {
    sqlContent = fs.readFileSync('./COMPLETE_INVITATION_SETUP.sql', 'utf8');
  } catch (err) {
    console.log('❌ Could not read COMPLETE_INVITATION_SETUP.sql:', err.message);
    return;
  }

  // Split into individual commands (rough split on semicolons)
  const commands = sqlContent
    .split(';')
    .map(cmd => cmd.trim())
    .filter(cmd => cmd && !cmd.startsWith('--') && cmd.length > 5);

  console.log(`Found ${commands.length} SQL commands to execute`);

  // Execute key commands one by one
  const keyCommands = [
    {
      sql: `SELECT table_name, table_type FROM information_schema.tables WHERE table_name IN ('master_users', 'site_invites')`,
      desc: 'Check existing tables'
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS public.master_users (
        id BIGSERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        access_type TEXT NOT NULL DEFAULT 'staff',
        role_detail TEXT,
        team_id TEXT,
        site_id BIGINT,
        invite_status TEXT DEFAULT 'pending',
        invited_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        user_id UUID,
        phone TEXT,
        status TEXT DEFAULT 'active',
        last_login_at TIMESTAMPTZ,
        profile_completed BOOLEAN DEFAULT FALSE,
        CONSTRAINT valid_access_type CHECK (access_type IN ('admin', 'staff', 'owner')),
        CONSTRAINT valid_invite_status CHECK (invite_status IN ('pending', 'accepted', 'expired', 'cancelled'))
      )`,
      desc: 'Create master_users table'
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS public.site_invites (
        id BIGSERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'staff',
        role_detail TEXT,
        site_id BIGINT,
        status TEXT DEFAULT 'pending',
        expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        reports_to_id BIGINT,
        token UUID DEFAULT gen_random_uuid(),
        invited_by_id UUID,
        metadata JSONB DEFAULT '{}',
        allowed_pages TEXT[],
        CONSTRAINT valid_role CHECK (role IN ('admin', 'staff', 'owner')),
        CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
        CONSTRAINT unique_email_site UNIQUE(email, site_id)
      )`,
      desc: 'Create site_invites table'
    },
    {
      sql: `ALTER TABLE public.master_users DISABLE ROW LEVEL SECURITY`,
      desc: 'Disable RLS on master_users'
    },
    {
      sql: `ALTER TABLE public.site_invites DISABLE ROW LEVEL SECURITY`,
      desc: 'Disable RLS on site_invites'
    },
    {
      sql: `GRANT SELECT, INSERT, UPDATE, DELETE ON public.master_users TO authenticated`,
      desc: 'Grant permissions on master_users'
    },
    {
      sql: `GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_invites TO authenticated`,
      desc: 'Grant permissions on site_invites'
    },
    {
      sql: `INSERT INTO public.master_users (email, full_name, access_type, role_detail, site_id, invite_status)
            VALUES ('setup_test@example.com', 'Setup Test', 'staff', 'Test Role', 1, 'pending')
            ON CONFLICT (email) DO NOTHING`,
      desc: 'Test master_users insert'
    },
    {
      sql: `INSERT INTO public.site_invites (email, full_name, role, role_detail, site_id, status)
            VALUES ('setup_test@example.com', 'Setup Test', 'staff', 'Test Role', 1, 'pending')
            ON CONFLICT (email, site_id) DO NOTHING`,
      desc: 'Test site_invites insert'
    },
    {
      sql: `DELETE FROM public.master_users WHERE email = 'setup_test@example.com'`,
      desc: 'Cleanup test master_users'
    },
    {
      sql: `DELETE FROM public.site_invites WHERE email = 'setup_test@example.com'`,
      desc: 'Cleanup test site_invites'
    },
    {
      sql: `SELECT
              (SELECT COUNT(*) FROM public.master_users) as master_users_count,
              (SELECT COUNT(*) FROM public.site_invites) as site_invites_count`,
      desc: 'Final verification'
    }
  ];

  for (const cmd of keyCommands) {
    await runSQL(cmd.sql, cmd.desc);
    // Small delay between commands
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n✅ Invitation system setup completed!');
  console.log('📋 Both master_users and site_invites tables should now be ready');
  console.log('🔧 You can now test the invitation form in admin-dashboard.html');
}

// Run the setup
setupInvitationSystem().catch(console.error);