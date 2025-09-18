# Simple Invitation Flow Fix

## Current Setup
The invitation now sends a magic link that goes directly to `staff-welcome.html`. Users will be automatically logged in when they click the link.

## Required Supabase Configuration

### 1. Add Redirect URL to Whitelist
In your Supabase dashboard:
1. Go to **Authentication** → **URL Configuration**
2. Add this URL to **Redirect URLs**:
   ```
   https://checkloop.co.uk/staff-welcome.html
   ```
3. Save changes

### 2. Customize Email Template
In Supabase dashboard:
1. Go to **Authentication** → **Email Templates**
2. Find **Magic Link** template (or **Confirm signup** if that's what's being used)
3. Update the email content to something like:

```html
<h2>You've been invited to CheckLoop!</h2>
<p>Hello {{ .Email }},</p>
<p>You've been invited to join CheckLoop. Click the button below to access your account:</p>
<p><a href="{{ .ConfirmationURL }}">Accept Invitation and Get Started</a></p>
<p>This link will expire in 24 hours.</p>
<p>If you didn't expect this invitation, you can safely ignore this email.</p>
```

### 3. Ensure Correct Email Type
Make sure Supabase is sending the right type of email:
1. The `signInWithOtp` method should trigger a **Magic Link** email
2. If you're seeing "Confirm signup" emails, check if email confirmation is required in **Authentication** → **Providers** → **Email**

## How The Flow Works Now

1. **Admin invites user** from admin-dashboard
2. **User receives magic link email**
3. **User clicks link** → Automatically logged in
4. **Redirected to staff-welcome.html**
5. **staff-welcome.html** handles onboarding

## No Password Required!
With magic links, users don't need passwords. They:
- Click the link in their email to login
- Are automatically authenticated
- Can optionally set a password later from their profile

## Alternative: Force Password Setup

If you absolutely need users to set a password on first login, add this to the top of `staff-welcome.html`:

```javascript
// Check if user needs to set password
async function checkPasswordRequirement() {
  const { data: { user } } = await supabase.auth.getUser();

  if (user && user.user_metadata?.needs_password === true) {
    // Redirect to password setup
    window.location.href = `simple-set-password.html?email=${user.email}&from=welcome`;
  }
}
```

## Testing the Flow

1. Delete any existing test user data
2. Invite a user from admin-dashboard
3. Check the email - it should have a link
4. Click the link - should go to staff-welcome.html
5. User should be logged in automatically

## If Still Going to Homepage

If the link still goes to the homepage, it's likely because:

1. **Redirect URL not whitelisted** - Add it in Supabase dashboard
2. **Email template has hardcoded URL** - Check and update the template
3. **Site URL misconfigured** - Check **Authentication** → **URL Configuration** → **Site URL** is set to `https://checkloop.co.uk`

## Quick Debug

Add this to the top of your homepage (`index.html` or `home.html`) to redirect invited users:

```javascript
// Redirect magic link users to staff-welcome
const params = new URLSearchParams(window.location.hash.slice(1));
if (params.get('access_token') && params.get('type') === 'magiclink') {
  window.location.href = '/staff-welcome.html';
}
```