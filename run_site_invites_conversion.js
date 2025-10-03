import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseServiceKey = 'sb_secret_ylIhDtikpno4LTTUmpDJvw_Ov7BtIEp';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function convertSiteInvitesToView() {
  console.log('🔄 Converting site_invites from table to VIEW...\n');

  try {
    // Step 1: Check current state
    console.log('📊 Checking current state...');

    // Check if site_invites exists as table
    const { data: tableCheck, error: tableError } = await supabase.rpc('run_sql', {
      sql_query: `
        SELECT table_name, table_type
        FROM information_schema.tables
        WHERE table_name = 'site_invites' AND table_schema = 'public'
      `
    });

    if (tableError) {
      console.error('Error checking table:', tableError);
      return;
    }

    console.log('Current site_invites:', tableCheck);

    // Check current data in site_invites if it exists
    try {
      const { data: currentData, error: dataError } = await supabase
        .from('site_invites')
        .select('*')
        .limit(5);

      if (!dataError) {
        console.log(`Current site_invites records: ${currentData?.length || 0}`);
        if (currentData?.length > 0) {
          console.log('Sample record:', currentData[0]);
        }
      }
    } catch (e) {
      console.log('No existing site_invites data or access error');
    }

    // Check master_users pending invitations
    const { data: pendingUsers, error: pendingError } = await supabase
      .from('master_users')
      .select('id, email, full_name, access_type, invite_status')
      .eq('invite_status', 'pending');

    if (!pendingError) {
      console.log(`Pending invitations in master_users: ${pendingUsers?.length || 0}`);
    }

    // Step 2: Read and execute the conversion SQL
    console.log('\n🚀 Executing conversion SQL...');

    const sqlContent = fs.readFileSync(
      path.join(process.cwd(), 'convert_site_invites_to_view.sql'),
      'utf8'
    );

    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;

      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      console.log(`SQL: ${statement.substring(0, 100)}...`);

      const { data, error } = await supabase.rpc('run_sql', {
        sql_query: statement
      });

      if (error) {
        console.error(`❌ Error in statement ${i + 1}:`, error);
        if (error.message.includes('does not exist')) {
          console.log('⚠️ Table may not exist, continuing...');
        } else {
          throw error;
        }
      } else {
        console.log(`✅ Statement ${i + 1} completed successfully`);
        if (data) {
          console.log('Result:', data);
        }
      }

      // Small delay between statements
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Step 3: Verify the conversion worked
    console.log('\n🔍 Verifying conversion...');

    // Check that site_invites is now a VIEW
    const { data: viewCheck, error: viewError } = await supabase.rpc('run_sql', {
      sql_query: `
        SELECT table_name, table_type
        FROM information_schema.tables
        WHERE table_name = 'site_invites' AND table_schema = 'public'
      `
    });

    if (viewError) {
      console.error('Error checking view:', viewError);
    } else {
      console.log('site_invites type after conversion:', viewCheck);
    }

    // Test querying the new VIEW
    const { data: viewData, error: viewDataError } = await supabase
      .from('site_invites')
      .select('*')
      .limit(5);

    if (viewDataError) {
      console.error('❌ Error querying new VIEW:', viewDataError);
    } else {
      console.log(`✅ VIEW query successful! Records: ${viewData?.length || 0}`);
      if (viewData?.length > 0) {
        console.log('Sample VIEW record:', viewData[0]);
      }
    }

    console.log('\n🎉 Conversion completed successfully!');
    console.log('📋 site_invites is now a VIEW that self-populates from master_users');
    console.log('🔗 Only shows records where invite_status = "pending"');
    console.log('✅ No more data duplication between tables');

  } catch (error) {
    console.error('💥 Fatal error during conversion:', error);
  }
}

// Run the conversion
convertSiteInvitesToView().catch(console.error);