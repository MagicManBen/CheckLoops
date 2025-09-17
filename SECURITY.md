# Security Configuration

## Important: Protecting Sensitive Information

This project has been configured for secure deployment. All sensitive API keys and credentials have been removed from the codebase.

## Supabase Keys

### Anon Key (Public - Safe in Code)
- The anonymous key is safe to include in client-side code
- Located in `config.js`
- Used for public operations like user authentication

### Service Role Key (SECRET - Never Commit!)
- **NEVER commit service role keys to version control**
- Service role keys provide admin access to your database
- Must be kept secure on the server side only

## Admin Dashboard Security

The admin dashboard (`admin-dashboard.html`) requires service-role access for creating users and managing the system.

### Current Status
- Service role keys have been removed from admin-dashboard.html
- Admin functionality will not work without proper backend implementation

### Recommended Solutions

#### Option 1: Supabase Edge Functions (Recommended)
Create Edge Functions for admin operations:
1. Create an Edge Function for each admin operation
2. Store the service role key as an environment variable in Supabase
3. Call the Edge Functions from the admin dashboard

Example Edge Function:
```typescript
// supabase/functions/create-user/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Your admin logic here
})
```

#### Option 2: Backend Server
Implement a secure backend server (Node.js, Python, etc.) that:
1. Stores the service role key as an environment variable
2. Provides authenticated API endpoints for admin operations
3. Validates admin permissions before executing operations

## Environment Variables

For local development with admin features:

1. Create a `.env` file (already in .gitignore)
2. Add your service role key:
```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```
3. Use a backend server or Edge Functions to access this key

## Security Checklist

Before deploying or committing:

- [ ] No service role keys in any committed files
- [ ] `.env` file is in `.gitignore`
- [ ] No hardcoded passwords or sensitive data
- [ ] Admin operations use Edge Functions or backend server
- [ ] All test files with keys have been deleted
- [ ] Database credentials are stored securely

## Files Already Protected by .gitignore

The following are already excluded from version control:
- `.env` files
- `SupabaseInfo.txt`
- Database exports (`*.sql`)
- Node modules
- Test results

## Public Files

These files are safe to commit:
- `config.js` - Contains only the anon key (public)
- All HTML files (after security updates)
- JavaScript files (user utilities)
- CSS files

## Need Help?

If you need to restore admin functionality:
1. Set up Supabase Edge Functions (see Supabase documentation)
2. Or create a simple backend server
3. Never expose service keys in client-side code

## Reporting Security Issues

If you find any security vulnerabilities, please report them privately rather than creating a public issue.