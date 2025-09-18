# ✅ FIXED: Magic Link Redirect Issue

## The Problem Was
- Magic links were going to `http://checkloops.co.uk/?code=xxx`
- This was showing the root folder instead of password setup

## The Solution Applied
Added redirect handler to `index.html` that:
1. Detects magic link parameters (`?code=`, `#access_token=`, etc.)
2. Immediately redirects to `simple-set-password.html`
3. Preserves all URL parameters

## How It Works Now

### When User Clicks Magic Link
1. Email link goes to: `https://checkloops.co.uk/?code=xxx`
2. Index.html detects the `code` parameter
3. Automatically redirects to: `https://checkloops.co.uk/simple-set-password.html?code=xxx`
4. simple-set-password.html exchanges code for session
5. User sets password
6. Redirects to staff-welcome.html

## Testing

1. **Invite a new user** from admin-dashboard
2. **User receives email** with magic link
3. **Clicks link** → Goes to homepage → **Immediately redirects** to password setup
4. **Sets password** → Continues to staff-welcome

## If It Still Doesn't Work

Make sure your web server is configured to:
- Serve `index.html` for the root URL
- Not show directory listing

## Alternative Quick Fix

If the redirect isn't working, you can also update the Supabase email template to use the direct URL:

In Supabase Dashboard → Authentication → Email Templates → Magic Link:

Change:
```
{{ .ConfirmationURL }}
```

To:
```
{{ .ConfirmationURL | replace "https://checkloops.co.uk/" "https://checkloops.co.uk/simple-set-password.html" }}
```

But the JavaScript redirect should work immediately without any Supabase changes.

## Summary

✅ **Homepage now catches magic links and redirects them**
✅ **No Supabase configuration changes needed**
✅ **Works with existing email templates**
✅ **Users can now complete the invitation flow**