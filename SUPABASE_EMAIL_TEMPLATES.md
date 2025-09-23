# Supabase Email Templates for CheckLoops Invitation System

## Overview
These email templates must be configured in the Supabase Dashboard to ensure the invitation system works correctly with the checkloops.co.uk domain.

## Access Email Templates
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **Email Templates**

## Required Configuration

### 1. URL Configuration
Go to **Authentication** → **URL Configuration** and set:
- **Site URL**: `https://checkloops.co.uk`
- **Redirect URLs** (add all):
  - `https://checkloops.co.uk/simple-set-password.html`
  - `https://checkloops.co.uk/staff-welcome.html`
  - `https://checkloops.co.uk/*`

### 2. Email Settings
Go to **Authentication** → **Settings** and configure:
- **Enable Email Confirmations**: OFF (for faster onboarding)
- **Enable Email Change Confirmations**: ON
- **Mailer OTP Expiration**: 86400 (24 hours)

## Email Templates

### Magic Link / OTP Template
**Template Name**: Magic Link
**Use for**: Initial invitations

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e1e8ed; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #4f89ff; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #687782; font-size: 14px; }
        .logo { font-size: 28px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">CheckLoops</div>
            <h2 style="margin: 10px 0 0 0; font-weight: normal;">Welcome to Your Team!</h2>
        </div>
        <div class="content">
            <p>Hello {{ .Data.full_name | default "there" }},</p>

            <p>You've been invited to join CheckLoops. Your administrator has set up an account for you.</p>

            <p style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="button">Set Up Your Password</a>
            </p>

            <p style="background: #f7f9fb; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 12px; word-break: break-all;">
                Or copy this link: {{ .ConfirmationURL }}
            </p>

            <p><strong>What happens next?</strong></p>
            <ul>
                <li>Click the button above to set your password</li>
                <li>Complete your profile setup</li>
                <li>Access your dashboard and start using CheckLoops</li>
            </ul>

            <p style="color: #687782; font-size: 14px;">
                <strong>Note:</strong> This link expires in 24 hours for security reasons. If it expires, you can request a new one from your administrator.
            </p>
        </div>
        <div class="footer">
            <p>© 2024 CheckLoops. All rights reserved.</p>
            <p><a href="https://checkloops.co.uk" style="color: #4f89ff;">checkloops.co.uk</a></p>
        </div>
    </div>
</body>
</html>
```

**Plain Text Version**:
```
Welcome to CheckLoops!

Hello {{ .Data.full_name | default "there" }},

You've been invited to join CheckLoops. Click the link below to set up your password:

{{ .ConfirmationURL }}

This link expires in 24 hours.

Best regards,
The CheckLoops Team
https://checkloops.co.uk
```

### Password Reset Template
**Template Name**: Reset Password
**Use for**: Password recovery and invitation resends

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e1e8ed; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #4f89ff; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #687782; font-size: 14px; }
        .warning { background: #fff4e5; border-left: 4px solid #ffa000; padding: 12px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div style="font-size: 28px; font-weight: bold;">CheckLoops</div>
            <h2 style="margin: 10px 0 0 0; font-weight: normal;">Password Reset Request</h2>
        </div>
        <div class="content">
            <p>Hello {{ .Data.full_name | default "there" }},</p>

            <p>We received a request to reset your CheckLoops password. Click the button below to create a new password:</p>

            <p style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="button">Reset Your Password</a>
            </p>

            <p style="background: #f7f9fb; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 12px; word-break: break-all;">
                Or copy this link: {{ .ConfirmationURL }}
            </p>

            <div class="warning">
                <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your password won't be changed unless you click the link above.
            </div>

            <p style="color: #687782; font-size: 14px;">
                This link expires in 24 hours. If you need assistance, contact your administrator.
            </p>
        </div>
        <div class="footer">
            <p>© 2024 CheckLoops. All rights reserved.</p>
            <p><a href="https://checkloops.co.uk" style="color: #4f89ff;">checkloops.co.uk</a></p>
        </div>
    </div>
</body>
</html>
```

### Email Change Confirmation Template
**Template Name**: Confirm Email Change
**Use for**: When users change their email address

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e1e8ed; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #10b981; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #687782; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div style="font-size: 28px; font-weight: bold;">CheckLoops</div>
            <h2 style="margin: 10px 0 0 0; font-weight: normal;">Confirm Your Email Address</h2>
        </div>
        <div class="content">
            <p>Hello,</p>

            <p>Please confirm your new email address for your CheckLoops account:</p>

            <p style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="button">Confirm Email Address</a>
            </p>

            <p style="background: #f7f9fb; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 12px; word-break: break-all;">
                Or copy this link: {{ .ConfirmationURL }}
            </p>

            <p style="color: #687782; font-size: 14px;">
                This link expires in 24 hours. If you didn't request this change, please contact your administrator immediately.
            </p>
        </div>
        <div class="footer">
            <p>© 2024 CheckLoops. All rights reserved.</p>
            <p><a href="https://checkloops.co.uk" style="color: #4f89ff;">checkloops.co.uk</a></p>
        </div>
    </div>
</body>
</html>
```

## SMTP Configuration (Required for Production)

To send emails from checkloops.co.uk domain:

1. Go to **Settings** → **Auth** in Supabase Dashboard
2. Scroll to **SMTP Settings**
3. Enable **Custom SMTP**
4. Configure with your email provider:

### Example: SendGrid Configuration
```
Host: smtp.sendgrid.net
Port: 587
User: apikey
Pass: [Your SendGrid API Key]
Sender email: noreply@checkloops.co.uk
Sender name: CheckLoops
```

### Example: AWS SES Configuration
```
Host: email-smtp.eu-west-1.amazonaws.com
Port: 587
User: [Your SMTP Username]
Pass: [Your SMTP Password]
Sender email: noreply@checkloops.co.uk
Sender name: CheckLoops
```

## Testing the Configuration

1. **Open the test tool**: Open `supabase-invitation-setup.html` in your browser
2. **Run investigation**: Click "Run Complete Investigation" to check your setup
3. **Send test email**: Use the Test tab to send a test invitation
4. **Check spam folder**: Emails might go to spam initially until domain reputation is established

## Domain Configuration

Ensure these DNS records are configured for checkloops.co.uk:

### SPF Record
```
TXT @ "v=spf1 include:sendgrid.net ~all"
```

### DKIM Records
Your email provider will provide DKIM records. Add them as TXT records.

### DMARC Record
```
TXT _dmarc "v=DMARC1; p=quarantine; rua=mailto:admin@checkloops.co.uk"
```

## Troubleshooting

### Issue: Emails going to spam
- Verify SPF, DKIM, and DMARC records
- Use a reputable SMTP provider
- Ensure "From" address matches your domain

### Issue: Magic links expired
- Check that email scanners aren't consuming links
- Use the fallback password reset method
- Increase OTP expiration time if needed

### Issue: Redirect not working
- Verify redirect URLs in Supabase Dashboard
- Ensure URLs use https://
- Check that simple-set-password.html is accessible

## Support

For issues with the invitation system:
1. Check the browser console for errors
2. Review Supabase Auth logs
3. Test with the investigation tool
4. Verify all DNS records are properly configured