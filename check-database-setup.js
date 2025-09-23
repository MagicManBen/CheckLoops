import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
// Service key removed - this script requires admin privileges to run
// const supabaseServiceKey = '[SERVICE_KEY_REMOVED]';

// const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

console.log('❌ This script has been disabled - service key removed for security');
console.log('To run database checks, use the Supabase dashboard directly');
process.exit(1);

async function checkDatabaseSetup() {
  console.log('🔍 Checking database setup for invitation system...\n');

  // Check site_invites table
  console.log('1️⃣ Checking site_invites table...');
  try {
    const { data: invites, error } = await supabaseAdmin
      .from('site_invites')
      .select('*')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        console.log('❌ site_invites table does not exist!');
        console.log('   Creating table...');

        // Create the table
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS site_invites (
            id SERIAL PRIMARY KEY,
            email TEXT NOT NULL,
            full_name TEXT,
            role TEXT,
            role_detail TEXT,
            reports_to_id INTEGER,
            site_id INTEGER,
            status TEXT DEFAULT 'pending',
            token TEXT,
            expires_at TIMESTAMP WITH TIME ZONE,
            invited_by UUID,
            allowed_pages TEXT DEFAULT '[]',
            invite_data JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            accepted_at TIMESTAMP WITH TIME ZONE
          );

          -- Create indexes
          CREATE INDEX IF NOT EXISTS idx_site_invites_email ON site_invites(email);
          CREATE INDEX IF NOT EXISTS idx_site_invites_status ON site_invites(status);
          CREATE INDEX IF NOT EXISTS idx_site_invites_site_id ON site_invites(site_id);
        `;

        // Note: We can't execute raw SQL directly via the JS client
        console.log('   Please execute the following SQL in Supabase SQL editor:');
        console.log(createTableSQL);
      } else {
        console.log('❌ Error checking site_invites table:', error.message);
      }
    } else {
      console.log('✅ site_invites table exists');
      console.log('   Records found:', invites ? invites.length : 0);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }

  // Check master_users table
  console.log('\n2️⃣ Checking master_users table...');
  try {
    const { data: users, error } = await supabaseAdmin
      .from('master_users')
      .select('*')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        console.log('❌ master_users table does not exist!');
        console.log('   Creating table...');

        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS master_users (
            id SERIAL PRIMARY KEY,
            auth_user_id UUID UNIQUE,
            email TEXT,
            full_name TEXT,
            nickname TEXT,
            site_id INTEGER,
            access_type TEXT,
            role TEXT,
            role_detail TEXT,
            reports_to_id INTEGER,
            active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          -- Create indexes
          CREATE INDEX IF NOT EXISTS idx_master_users_auth_user_id ON master_users(auth_user_id);
          CREATE INDEX IF NOT EXISTS idx_master_users_email ON master_users(email);
          CREATE INDEX IF NOT EXISTS idx_master_users_site_id ON master_users(site_id);
        `;

        console.log('   Please execute the following SQL in Supabase SQL editor:');
        console.log(createTableSQL);
      } else {
        console.log('❌ Error checking master_users table:', error.message);
      }
    } else {
      console.log('✅ master_users table exists');
      console.log('   Records found:', users ? users.length : 0);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }

  // Check profiles table (legacy support)
  console.log('\n3️⃣ Checking profiles table...');
  try {
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        console.log('⚠️  profiles table does not exist (optional - used as fallback)');
      } else {
        console.log('❌ Error checking profiles table:', error.message);
      }
    } else {
      console.log('✅ profiles table exists');
      console.log('   Records found:', profiles ? profiles.length : 0);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }

  // Check for RLS policies
  console.log('\n4️⃣ Checking RLS policies...');
  console.log('   Note: RLS policies need to be configured in Supabase dashboard');
  console.log('   Recommended policies for site_invites:');
  console.log('   - SELECT: auth.uid() IN (SELECT auth_user_id FROM master_users WHERE access_type = \'admin\')');
  console.log('   - INSERT: auth.uid() IN (SELECT auth_user_id FROM master_users WHERE access_type = \'admin\')');
  console.log('   - UPDATE: auth.uid() IN (SELECT auth_user_id FROM master_users WHERE access_type = \'admin\')');

  console.log('\n✨ Database check complete!');
}

checkDatabaseSetup();