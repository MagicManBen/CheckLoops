# Alternative: Direct User Creation Method

## If magic links aren't working, here's a simpler approach:

### Option 1: Create User with Temporary Password

Replace the invitation code in `admin-dashboard.html` with:

```javascript
// Create user directly with a temporary password
console.log('Creating user account directly');

// Generate a temporary password
const tempPassword = 'Welcome' + Math.random().toString(36).substring(2, 10) + '!';

// Create the user using admin API
const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
  email: formData.email,
  password: tempPassword,
  email_confirm: true,  // Auto-confirm their email
  user_metadata: {
    full_name: formData.fullName,
    role: formData.siteRole,
    role_detail: formData.jobRole,
    site_id: formData.siteId,
    invited: true
  }
});

if (createError) {
  throw new Error(`Failed to create user: ${createError.message}`);
}

// Send password reset email so they can set their own password
const { error: resetError } = await supabase.auth.resetPasswordForEmail(
  formData.email,
  {
    redirectTo: 'https://checkloop.co.uk/staff-welcome.html'
  }
);

if (resetError) {
  throw new Error(`Failed to send password reset: ${resetError.message}`);
}

console.log('User created and password reset email sent');
```

### Option 2: Use Supabase Invite (Proper Admin Invite)

```javascript
// Use proper admin invitation
const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
  formData.email,
  {
    data: {
      full_name: formData.fullName,
      role: formData.siteRole,
      role_detail: formData.jobRole,
      site_id: formData.siteId
    },
    redirectTo: 'https://checkloop.co.uk/staff-welcome.html'
  }
);

if (inviteError) {
  throw new Error(`Failed to invite user: ${inviteError.message}`);
}
```

### Option 3: Simple Magic Link (No Complications)

```javascript
// Simplest possible magic link
const { error } = await supabase.auth.signInWithOtp({
  email: formData.email
});

// That's it! Let Supabase handle everything else
```

Then in Supabase dashboard:
1. Set default redirect URL to: `https://checkloop.co.uk/staff-welcome.html`
2. Customize the magic link email template

## Which Method to Choose?

### Use Magic Link if:
- You want passwordless authentication
- Simple is better
- Users are comfortable with email-based login

### Use Direct Creation if:
- You need users to have passwords
- You want immediate account creation
- You need more control

### Use Admin Invite if:
- You want the "official" Supabase invite flow
- You need audit trails
- You want Supabase to handle everything

## The Simplest Fix

If nothing else works, just use this minimal code:

```javascript
// Just send the magic link, no extra options
await supabase.auth.signInWithOtp({
  email: formData.email
});
```

And handle everything else (profile creation, redirects, etc.) on the frontend after login.