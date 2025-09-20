# Fix Admin Dashboard for RLS

## The Issue
Your admin dashboard uses `SUPABASE_ANON_KEY` which can't bypass RLS policies.

## Quick Fix Options:

### Option 1: Use Service Role Key in Admin Dashboard (Simplest)
Edit `/admin-dashboard.html` line 7087:

**Change from:**
```javascript
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
```

**To:**
```javascript
const supabase = createClient(SUPABASE_URL, CONFIG.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY, {
```

Then add service role key to your CONFIG object.

### Option 2: Create Admin-Specific Client
Add this after line 7087 in admin-dashboard.html:

```javascript
// Create admin client for admin operations
const adminSupabase = createClient(SUPABASE_URL,
  'YOUR_SERVICE_ROLE_KEY_HERE', {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    },
    global: {
      headers: { 'X-Admin-Request': 'true' }
    }
  }
);

// Use adminSupabase for admin operations
window.adminSupabase = adminSupabase;
```

### Option 3: Conditional Client Based on User Role
```javascript
// Check if user is admin and use appropriate client
async function getSupabaseClient() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return supabase;

  const { data: profile } = await supabase
    .from('master_users')
    .select('access_type')
    .eq('auth_user_id', user.id)
    .single();

  if (profile?.access_type === 'admin') {
    // Use service role for admins
    return createClient(SUPABASE_URL, 'YOUR_SERVICE_ROLE_KEY');
  }

  return supabase;
}
```

## Security Note
⚠️ **IMPORTANT**: Service role key bypasses ALL security. Only use it in admin-only pages that are properly authenticated.

## Testing After Fix
1. Clear browser cache
2. Log in as admin
3. Check if all sections load:
   - Training tracker
   - Complaints
   - Entitlement management
   - Staff Working Schedules
   - User Management
   - Training Import Records