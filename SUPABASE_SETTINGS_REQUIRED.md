# Exact Supabase Settings Required

## The Problem
Your invitation emails are going to the homepage instead of staff-welcome.html

## The Fix - Do These Steps in Supabase Dashboard

### Step 1: URL Configuration
1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to: `https://checkloop.co.uk`
3. Add to **Redirect URLs**:
   ```
   https://checkloop.co.uk/staff-welcome.html
   https://checkloop.co.uk/simple-set-password.html
   https://checkloop.co.uk/
   ```
4. Click **Save**

### Step 2: Email Templates
1. Go to **Authentication** → **Email Templates**
2. Find the template being used (likely **Magic Link** or **Confirm signup**)
3. Check the template body - look for any hardcoded URLs
4. The template should use `{{ .ConfirmationURL }}` not a hardcoded URL
5. Example template:

```html
<h2>Welcome to CheckLoop</h2>
<p>Hi {{ .Email }},</p>
<p>You've been invited to join CheckLoop. Click below to get started:</p>
<a href="{{ .ConfirmationURL }}">Accept Invitation</a>
```

### Step 3: Provider Settings
1. Go to **Authentication** → **Providers** → **Email**
2. Make sure **Enable Email Signups** is ON
3. Set **Confirm email** to OFF (for easier testing)
4. Save changes

### Step 4: The Code is Already Fixed
The admin-dashboard.html now sends invites with:
- Magic link authentication
- Direct redirect to staff-welcome.html
- No password required (magic link handles auth)

## Testing

1. Invite a test user
2. Check the email received
3. The link should:
   - Log them in automatically
   - Take them to staff-welcome.html
   - NOT go to the homepage

## If STILL Not Working

The issue is that your Supabase project might have a default redirect that's overriding our setting. Try:

### Option A: Remove the redirect parameter entirely
```javascript
// Let Supabase use its default
await supabase.auth.signInWithOtp({
  email: formData.email,
  options: {
    data: { /* user data */ }
    // No emailRedirectTo - use Supabase default
  }
});
```

Then set the default in Supabase dashboard under **Site URL**.

### Option B: Add redirect handler to homepage
Add this to the top of `index.html`:

```javascript
// Check if this is a magic link login
const hashParams = new URLSearchParams(window.location.hash.substring(1));
if (hashParams.get('access_token')) {
  // This is a magic link login, redirect to staff-welcome
  window.location.replace('/staff-welcome.html');
}
```

## The Nuclear Option

If nothing works, change the Supabase email template directly to have the link go to:
```
https://checkloop.co.uk/staff-welcome.html#access_token={{ .Token }}&token_type=bearer&type=magiclink
```

But this is hacky and not recommended.