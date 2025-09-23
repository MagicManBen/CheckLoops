# CheckLoops Invitation System Setup Guide

## Quick Start

The invitation system has been completely rebuilt to use proper magic links with the checkloops.co.uk domain. Follow these steps to ensure your Supabase backend is properly configured.

## Tools Available

### 1. Web-Based Investigation Tool
**File**: `supabase-invitation-setup.html`
- Open in any browser
- Interactive UI with tabs for investigation, setup, testing, and email templates
- Real-time connection to your Supabase instance
- Visual feedback with color-coded results

**How to use**:
```bash
# Open in browser
open supabase-invitation-setup.html
# Or
google-chrome supabase-invitation-setup.html
```

### 2. Command-Line Investigation Script
**File**: `check-supabase-invitation.js`
- Run from terminal
- Comprehensive system check
- Provides SQL commands for setup
- Color-coded console output

**How to use**:
```bash
# Run the script
node check-supabase-invitation.js

# Or make it executable and run directly
./check-supabase-invitation.js
```

### 3. Email Templates Documentation
**File**: `SUPABASE_EMAIL_TEMPLATES.md`
- Complete email templates ready to copy
- SMTP configuration guide
- DNS records for domain verification
- Troubleshooting tips

## Step-by-Step Setup

### Step 1: Run Investigation
```bash
# Use either tool to check current setup
node check-supabase-invitation.js
# OR open supabase-invitation-setup.html in browser
```

### Step 2: Configure Supabase Dashboard

#### Authentication Settings
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Navigate to **Authentication** → **URL Configuration**
3. Set:
   - **Site URL**: `https://checkloops.co.uk`
   - **Redirect URLs**:
     - `https://checkloops.co.uk/simple-set-password.html`
     - `https://checkloops.co.uk/staff-welcome.html`
     - `https://checkloops.co.uk/*`

#### Email Templates
1. Go to **Authentication** → **Email Templates**
2. Update each template using the HTML from `SUPABASE_EMAIL_TEMPLATES.md`
3. Ensure all templates reference checkloops.co.uk

#### SMTP Configuration
1. Go to **Settings** → **Auth**
2. Enable **Custom SMTP**
3. Configure with your provider (SendGrid, AWS SES, etc.)
4. Set sender email: `noreply@checkloops.co.uk`

### Step 3: Database Setup

If `site_invites` table doesn't exist, run this SQL in Supabase SQL Editor:

```sql
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

-- Create indexes
CREATE INDEX idx_site_invites_email ON site_invites(email);
CREATE INDEX idx_site_invites_site_id ON site_invites(site_id);
CREATE INDEX idx_site_invites_status ON site_invites(status);

-- Enable RLS
ALTER TABLE site_invites ENABLE ROW LEVEL SECURITY;

-- Create policies
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

CREATE POLICY "Users can view own invite" ON site_invites
  FOR SELECT
  USING (auth.jwt() ->> 'email' = email);
```

### Step 4: DNS Configuration

Add these records to your domain's DNS:

#### SPF Record
```
Type: TXT
Name: @
Value: "v=spf1 include:[your-smtp-provider] ~all"
```

#### DKIM Records
Your email provider will provide these. Add as TXT records.

#### DMARC Record
```
Type: TXT
Name: _dmarc
Value: "v=DMARC1; p=quarantine; rua=mailto:admin@checkloops.co.uk"
```

### Step 5: Test the System

#### Using Web Tool
1. Open `supabase-invitation-setup.html`
2. Go to **Test** tab
3. Enter a test email
4. Click **Send Test Invitation**

#### Using Command Line
```bash
# Check everything is configured
node check-supabase-invitation.js

# The script will show:
# ✅ Successful configurations
# ⚠️ Warnings for optional items
# ❌ Errors that need fixing
```

## How the Invitation Flow Works

1. **Admin invites user** (admin-dashboard.html)
   - Creates record in `site_invites` table
   - Sends magic link via `signInWithOtp`
   - Falls back to password reset if needed

2. **User receives email**
   - Contains magic link to `checkloops.co.uk/simple-set-password.html`
   - Link includes all user metadata as URL parameters
   - Valid for 24 hours

3. **User clicks magic link**
   - Redirected to password setting page
   - Session automatically established
   - User sets their password

4. **Account creation**
   - Profile created in `master_users`
   - Metadata saved from invitation
   - User redirected to `/staff-welcome.html`

## Troubleshooting

### Common Issues and Solutions

#### "XX2 Error" in Admin Dashboard
- Usually means authentication issue
- Check service role key is valid
- Verify user has admin permissions

#### Magic Link Says "Expired" Immediately
- Email security scanner consumed the link
- System will offer to send a new link
- Consider using password reset as primary method

#### Emails Not Arriving
- Check SMTP configuration
- Verify DNS records (SPF, DKIM, DMARC)
- Check spam folder
- Test with investigation tool

#### "Invalid or Expired Link"
- Link was already used
- Link is older than 24 hours
- URL parameters were modified

### Debug Commands

```bash
# Check current status
node check-supabase-invitation.js

# View recent invitations (in Supabase SQL Editor)
SELECT * FROM site_invites
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

# Check for duplicate invitations
SELECT email, COUNT(*)
FROM site_invites
WHERE status = 'pending'
GROUP BY email
HAVING COUNT(*) > 1;

# Clean up old pending invitations
DELETE FROM site_invites
WHERE status = 'pending'
AND created_at < NOW() - INTERVAL '30 days';
```

## Files Modified

- **admin-dashboard.html**: Rebuilt invitation process with magic links
- **simple-set-password.html**: Improved magic link handling and error messages
- **config.js**: Configured for checkloops.co.uk domain

## New Files Created

- **supabase-invitation-setup.html**: Web-based investigation tool
- **check-supabase-invitation.js**: CLI investigation script
- **SUPABASE_EMAIL_TEMPLATES.md**: Email template documentation
- **INVITATION_SETUP_README.md**: This guide

## Support

If you encounter issues:

1. Run the investigation tool to identify problems
2. Check browser console for JavaScript errors
3. Review Supabase Auth logs in dashboard
4. Verify all URLs use https://checkloops.co.uk
5. Ensure database tables have correct structure

## Security Notes

- Service role key is included for setup purposes only
- Never expose service role key in client-side code
- Use Row Level Security (RLS) on all tables
- Regularly clean up old pending invitations
- Monitor for suspicious invitation patterns

## Next Steps

After setup is complete:

1. Send a test invitation to verify everything works
2. Monitor first real user invitations closely
3. Check email delivery rates in your SMTP provider
4. Set up email bounce handling
5. Configure rate limiting if needed