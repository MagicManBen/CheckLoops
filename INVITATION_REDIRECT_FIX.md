# Invitation Redirect Fix - Deep Dive

## Problem
When users were invited and set their password, they were being redirected to the homepage instead of `staff-welcome.html` for onboarding.

## Root Causes Discovered

### 1. **Edge Function Not Setting Metadata**
The `invite-user` edge function was creating users but NOT setting critical metadata:
- ❌ Missing `site_id` in `user_metadata`
- ❌ Missing `needs_onboarding` flag in `user_metadata`

These fields were only being stored in the `master_users` table, but the redirect logic needed them in the auth user metadata.

### 2. **Admin Dashboard Not Passing site_id**
The admin dashboard was calling the edge function with:
```javascript
body: {
  email: formData.email,
  name: formData.fullName,  // ❌ Wrong field name
  role: formData.siteRole,   // ❌ Wrong field name
  role_detail: formData.jobRole || '',
  reports_to_id: formData.teamId || null,
  // ❌ site_id was missing!
}
```

### 3. **Edge Function Not Sending Emails**
The `invite-user` function was creating users with a temporary password but never sending them an email, so users had no way to access the system.

### 4. **URL Parameter Loss**
When Supabase sends password reset emails, query parameters from the `redirect_to` URL are NOT preserved. Only hash parameters (tokens) are passed through. This meant that even though `site_id` was in the redirect_to URL, it was lost when the user clicked the link.

## Solutions Implemented

### ✅ Fix 1: Updated Edge Function Metadata
**File:** `supabase/functions/invite-user/index.ts`

Added `site_id` and `needs_onboarding` to user metadata:
```typescript
user_metadata: {
  full_name: full_name,
  access_type: access_type,
  role_detail: role_detail,
  site_id: site_id || null,           // ✅ Added
  needs_onboarding: true               // ✅ Added
}
```

### ✅ Fix 2: Added Password Generation
**File:** `supabase/functions/invite-user/index.ts`

Added automatic temporary password generation:
```typescript
// Generate temporary password if not provided
if (!password) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%'
  password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
}
```

### ✅ Fix 3: Added Email Sending
**File:** `supabase/functions/invite-user/index.ts`

Added password reset email after user creation:
```typescript
// Send password reset email so user can set their own password
const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(
  email,
  {
    redirectTo: 'https://checkloops.co.uk/simple-set-password.html'
  }
)
```

### ✅ Fix 4: Updated Admin Dashboard Body
**File:** `admin-dashboard-design.html`

Fixed the edge function call to pass correct parameters:
```javascript
body: {
  email: formData.email,
  full_name: formData.fullName,      // ✅ Fixed field name
  access_type: formData.siteRole,    // ✅ Fixed field name
  role_detail: formData.jobRole || '',
  team_id: formData.teamId || null,  // ✅ Fixed field name
  site_id: formData.siteId,          // ✅ Added site_id
  // ... rest of body
}
```

### ✅ Fix 5: Updated Redirect Logic
**File:** `simple-set-password.html`

Changed redirect logic to check for `site_id` in user metadata (since URL params are lost):
```javascript
// Check if user came from invitation (has site_id)
const hasSiteId = urlParams.site_id || currentUser?.user?.user_metadata?.site_id;
const isInvitedUser = !!hasSiteId; // If they have a site_id, they were invited

// Determine redirect URL based on whether user was invited
let redirectUrl;
if (isInvitedUser) {
  // Invited user with site_id - go to staff welcome for onboarding
  redirectUrl = `${CONFIG.baseUrl}/staff-welcome.html`;
  debug('Invited user detected (has site_id), redirecting to staff-welcome.html');
} else {
  // Regular password reset - go to index/home
  redirectUrl = `${CONFIG.baseUrl}/index.html`;
  debug('Password reset user (no site_id), redirecting to index.html');
}
```

## Flow Diagram

### Before Fix:
```
Admin invites → Edge function creates user (no metadata) 
→ No email sent → User can't access system ❌
```

### After Fix:
```
Admin invites user
  ↓
Edge function creates user with:
  - site_id in metadata ✅
  - needs_onboarding: true ✅
  - Temporary password
  ↓
Edge function sends password reset email ✅
  ↓
User clicks link → simple-set-password.html
  ↓
Gets auth tokens from URL hash
  ↓
Fetches user data and checks metadata
  ↓
Sees site_id in user_metadata ✅
  ↓
Redirects to staff-welcome.html (logged in) ✅
```

## Testing Checklist

- [ ] Deploy edge function changes to Supabase
- [ ] Test inviting a new user from admin dashboard
- [ ] Verify invitation email is received
- [ ] Click link in email and verify redirect to simple-set-password.html
- [ ] Set password and verify redirect to staff-welcome.html
- [ ] Verify user is logged in at staff-welcome.html
- [ ] Verify site_id is preserved in session
- [ ] Test regular password reset flow (non-invitation)
- [ ] Verify password reset goes to index.html, not staff-welcome.html

## Deployment Steps

1. Deploy edge function:
   ```bash
   cd supabase
   supabase functions deploy invite-user
   ```

2. No changes needed for simple-set-password.html (already deployed)

3. Deploy admin-dashboard-design.html changes to production

## Additional Notes

- The `send-invitation` edge function also exists and properly sets metadata. Consider using that function instead if email sending issues persist.
- Make sure Supabase SMTP settings are configured correctly for reliable email delivery.
- Monitor edge function logs for any errors during invitation process.
- Consider adding a "Resend Invitation" button in admin dashboard for users who don't receive email.

## Files Modified

1. `supabase/functions/invite-user/index.ts` - Added metadata, password generation, and email sending
2. `admin-dashboard-design.html` - Fixed edge function call parameters
3. `simple-set-password.html` - Updated redirect logic to check user metadata
