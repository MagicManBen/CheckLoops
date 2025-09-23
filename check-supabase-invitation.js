#!/usr/bin/env node

/**
 * Supabase Invitation System Checker
 *
 * This script checks and configures the Supabase backend for the invitation system.
 * Run with: node check-supabase-invitation.js
 */

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';
const PRODUCTION_DOMAIN = 'https://checkloops.co.uk';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, type = 'info') {
  const prefix = {
    error: `${colors.red}❌`,
    success: `${colors.green}✅`,
    warning: `${colors.yellow}⚠️`,
    info: `${colors.blue}ℹ️`,
    debug: `${colors.magenta}🔍`
  };

  console.log(`${prefix[type]} ${message}${colors.reset}`);
}

function logSection(title) {
  console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(50)}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${title}${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(50)}${colors.reset}\n`);
}

async function checkSupabaseSetup() {
  log('Starting Supabase Invitation System Check...', 'info');
  log(`URL: ${SUPABASE_URL}`, 'debug');
  log(`Production Domain: ${PRODUCTION_DOMAIN}`, 'debug');

  try {
    // Dynamic import of @supabase/supabase-js
    const { createClient } = await import('@supabase/supabase-js');

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 1. Check Tables
    logSection('1. DATABASE TABLES CHECK');

    const requiredTables = [
      { name: 'site_invites', required: true },
      { name: 'master_users', required: true },
      { name: 'teams', required: false }
    ];

    for (const table of requiredTables) {
      try {
        const { data, error } = await supabase
          .from(table.name)
          .select('*')
          .limit(1);

        if (error) {
          if (table.required) {
            log(`Table '${table.name}': ${error.message}`, 'error');
          } else {
            log(`Table '${table.name}': ${error.message} (optional)`, 'warning');
          }
        } else {
          log(`Table '${table.name}' exists and is accessible`, 'success');
        }
      } catch (e) {
        log(`Table '${table.name}': ${e.message}`, 'error');
      }
    }

    // 2. Check site_invites structure
    logSection('2. SITE_INVITES TABLE STRUCTURE');

    const { data: sampleInvite } = await supabase
      .from('site_invites')
      .select('*')
      .limit(1);

    const requiredColumns = [
      'id',
      'email',
      'full_name',
      'site_id',
      'status',
      'role',
      'role_detail',
      'reports_to_id',
      'invite_data',
      'created_at'
    ];

    if (sampleInvite && sampleInvite.length > 0) {
      const existingColumns = Object.keys(sampleInvite[0]);

      for (const col of requiredColumns) {
        if (existingColumns.includes(col)) {
          log(`Column '${col}' exists`, 'success');
        } else {
          log(`Column '${col}' is missing`, 'warning');
        }
      }
    } else {
      log('Cannot verify columns - table is empty', 'warning');
      log('Required columns:', 'info');
      requiredColumns.forEach(col => console.log(`  - ${col}`));
    }

    // 3. Check Auth Configuration
    logSection('3. AUTHENTICATION CONFIGURATION');

    try {
      const { data: { users }, error } = await supabase.auth.admin.listUsers({
        perPage: 1
      });

      if (error) {
        log(`Auth admin access failed: ${error.message}`, 'error');
      } else {
        log('Service role key is valid and working', 'success');
        log(`Total users in system: ${users.length}+`, 'info');
      }
    } catch (e) {
      log(`Cannot access auth.admin: ${e.message}`, 'error');
      log('Make sure you are using the service role key, not the anon key', 'warning');
    }

    // 4. Check Pending Invitations
    logSection('4. PENDING INVITATIONS STATUS');

    const { data: pendingInvites, error: pendingError } = await supabase
      .from('site_invites')
      .select('email, full_name, created_at, status, site_id')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10);

    if (pendingError) {
      log(`Cannot query invitations: ${pendingError.message}`, 'error');
    } else if (pendingInvites && pendingInvites.length > 0) {
      log(`Found ${pendingInvites.length} pending invitation(s):`, 'info');
      pendingInvites.forEach((invite, index) => {
        const created = new Date(invite.created_at);
        const age = Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24));
        console.log(`  ${index + 1}. ${invite.email} (${invite.full_name}) - Site ${invite.site_id} - ${age} days old`);
      });
    } else {
      log('No pending invitations found', 'info');
    }

    // 5. Configuration Recommendations
    logSection('5. CONFIGURATION RECOMMENDATIONS');

    log('Email Settings (Configure in Supabase Dashboard):', 'info');
    console.log(`  ${colors.cyan}• Site URL: ${PRODUCTION_DOMAIN}`);
    console.log(`  ${colors.cyan}• Redirect URLs: ${PRODUCTION_DOMAIN}/simple-set-password.html`);
    console.log(`  ${colors.cyan}• Email "From": noreply@checkloops.co.uk`);
    console.log(`  ${colors.cyan}• Email "From Name": CheckLoops${colors.reset}`);

    log('\nEmail Templates to Configure:', 'info');
    console.log(`  ${colors.cyan}1. Magic Link Template`);
    console.log(`  2. Password Recovery Template`);
    console.log(`  3. Email Confirmation Template${colors.reset}`);

    log('\nSMTP Configuration:', 'info');
    console.log(`  ${colors.cyan}• Use custom SMTP for production emails`);
    console.log(`  • Configure SendGrid, Mailgun, or AWS SES`);
    console.log(`  • Ensure SPF/DKIM records are set for checkloops.co.uk${colors.reset}`);

    // 6. SQL Commands for Setup
    logSection('6. SQL SETUP COMMANDS');

    console.log('If site_invites table is missing, run this SQL in Supabase SQL Editor:\n');
    console.log(`${colors.yellow}-- Create site_invites table
CREATE TABLE IF NOT EXISTS site_invites (
  id SERIAL PRIMARY KEY,
  site_id INTEGER NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'staff',
  role_detail TEXT,
  reports_to_id INTEGER,
  status TEXT DEFAULT 'pending',
  invite_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email, site_id, status)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_site_invites_email ON site_invites(email);
CREATE INDEX IF NOT EXISTS idx_site_invites_site_id ON site_invites(site_id);
CREATE INDEX IF NOT EXISTS idx_site_invites_status ON site_invites(status);

-- Enable Row Level Security
ALTER TABLE site_invites ENABLE ROW LEVEL SECURITY;

-- Policy for admins to manage invites
CREATE POLICY "Admins can manage invites" ON site_invites
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM master_users
      WHERE master_users.user_id = auth.uid()
      AND master_users.site_id = site_invites.site_id
      AND master_users.role IN ('admin', 'owner')
    )
  );

-- Policy for users to view their own invite
CREATE POLICY "Users can view own invite" ON site_invites
  FOR SELECT
  USING (auth.jwt() ->> 'email' = email);
${colors.reset}`);

    // 7. Test Email Sending
    logSection('7. EMAIL SENDING TEST');

    log('To test email sending, use the HTML tool or run:', 'info');
    console.log(`${colors.cyan}  1. Open supabase-invitation-setup.html in a browser`);
    console.log(`  2. Go to the "Test" tab`);
    console.log(`  3. Enter a test email and click "Send Test Invitation"${colors.reset}`);

    // Final Summary
    logSection('SUMMARY');

    log('Invitation System Check Complete!', 'success');
    log('\nNext Steps:', 'info');
    console.log(`  1. ${colors.yellow}Configure email templates in Supabase Dashboard`);
    console.log(`  2. Set up custom SMTP for production emails`);
    console.log(`  3. Ensure redirect URLs point to ${PRODUCTION_DOMAIN}`);
    console.log(`  4. Test the invitation flow with a real email${colors.reset}`);

  } catch (error) {
    log(`Fatal error: ${error.message}`, 'error');
    console.error(error);

    if (error.message.includes('Cannot find module')) {
      log('\nPlease install required dependencies:', 'warning');
      console.log(`${colors.cyan}  npm install @supabase/supabase-js${colors.reset}`);
    }
  }
}

// Run the check
checkSupabaseSetup().catch(console.error);