// Simple script to convert site_invites using the existing Supabase setup
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY must be set in the environment');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function convertSiteInvites() {
  console.log('🔄 Converting site_invites from table to VIEW...\n');

  try {
    // Step 1: Check existing data
    console.log('📊 Checking current site_invites data...');

    let existingData = [];
    try {
      const { data, error } = await supabase.from('site_invites').select('*');
      if (!error && data) {
        existingData = data;
        console.log(`Found ${existingData.length} existing site_invites records`);
      }
    } catch (e) {
      console.log('No existing site_invites table or access error');
    }

    // Step 2: Check master_users pending invitations
    console.log('📊 Checking master_users pending invitations...');
    const { data: pendingUsers, error: pendingError } = await supabase
      .from('master_users')
      .select('*')
      .eq('invite_status', 'pending');

    if (pendingError) {
      console.error('Error checking master_users:', pendingError);
    } else {
      console.log(`Found ${pendingUsers?.length || 0} pending invitations in master_users`);
    }

    // Step 3: Manual execution - we'll use schema introspection
    console.log('\n🔍 Attempting to check if site_invites is table or view...');

    // Try to get table info - this will help us understand current state
    try {
      const { data: tableInfo, error: tableError } = await supabase
        .from('pg_tables')
        .select('tablename')
        .eq('tablename', 'site_invites');

      console.log('Table check result:', tableInfo, tableError);
    } catch (e) {
      console.log('Could not check table info via pg_tables');
    }

    console.log('\n⚠️ Manual SQL execution required');
    console.log('The conversion needs to be done manually in Supabase Studio or via psql');
    console.log('\n📋 Steps to perform manually:');
    console.log('1. Go to Supabase Studio > SQL Editor');
    console.log('2. Run: DROP TABLE IF EXISTS public.site_invites;');
    console.log('3. Run the CREATE VIEW statement from convert_site_invites_to_view.sql');

    console.log('\n✅ Verification: After manual conversion, test with:');
    console.log('SELECT COUNT(*) FROM site_invites;');

  } catch (error) {
    console.error('💥 Error during conversion attempt:', error);
  }
}

// Run the conversion
convertSiteInvites().catch(console.error);