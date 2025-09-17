# Supabase Edge Functions Setup Guide

## Overview

This project uses Supabase Edge Functions to securely handle admin operations that require service-role access. This keeps sensitive keys on the server side while maintaining full functionality.

## Edge Functions Implemented

### 1. `create-user`
Creates new users with authentication and profile setup.
- **Path**: `/supabase/functions/create-user/index.ts`
- **Purpose**: Securely create users from the admin dashboard
- **Required Role**: Admin

### 2. `resend-invitation`
Resends invitation emails to existing users.
- **Path**: `/supabase/functions/resend-invitation/index.ts`
- **Purpose**: Reset passwords and resend invitations
- **Required Role**: Admin

### 3. `delete-user`
Removes users from the system.
- **Path**: `/supabase/functions/delete-user/index.ts`
- **Purpose**: Complete user deletion from admin dashboard
- **Required Role**: Admin

## Setup Instructions

### Prerequisites

1. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Get your Service Role Key**
   - Go to your Supabase project settings
   - Navigate to API settings
   - Copy the `service_role` key (keep this secret!)

### Deployment Steps

#### Option 1: Automated Deployment (Recommended)

Run the deployment script:
```bash
./deploy-edge-functions.sh
```

The script will:
1. Check for Supabase CLI installation
2. Deploy all Edge Functions
3. Prompt you for your service role key
4. Set up environment variables

#### Option 2: Manual Deployment

1. **Login to Supabase CLI**
   ```bash
   supabase login
   ```

2. **Link your project**
   ```bash
   supabase link --project-ref unveoqnlqnobufhublyw
   ```

3. **Deploy each function**
   ```bash
   supabase functions deploy create-user --no-verify-jwt
   supabase functions deploy resend-invitation --no-verify-jwt
   supabase functions deploy delete-user --no-verify-jwt
   ```

4. **Set the service role key as a secret**
   ```bash
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"
   ```

## Testing the Functions

### Test create-user function:
```javascript
const { data, error } = await supabase.functions.invoke('create-user', {
  body: {
    email: 'test@example.com',
    password: 'TestPassword123!',
    fullName: 'Test User',
    siteId: 2,
    role: 'Visitor'
  }
})
```

### Test resend-invitation function:
```javascript
const { data, error } = await supabase.functions.invoke('resend-invitation', {
  body: {
    email: 'user@example.com'
  }
})
```

## Environment Variables Required

The following environment variable must be set in Supabase:
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

This is automatically handled by the deployment script.

## Security Notes

1. **Service Role Key**: Never expose this in client-side code
2. **Authentication**: All functions verify the user is an admin
3. **CORS**: Configured to allow requests from your domain
4. **JWT Verification**: Functions verify the requesting user's JWT token

## Troubleshooting

### Function not working?
1. Check if the function is deployed:
   ```bash
   supabase functions list
   ```

2. Check function logs:
   ```bash
   supabase functions logs create-user
   ```

### Authentication errors?
- Ensure the user has the 'Admin' role in the profiles table
- Verify the JWT token is being sent in the Authorization header

### Service role key issues?
- Verify the secret is set:
   ```bash
   supabase secrets list
   ```
- Re-set if needed:
   ```bash
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your_key"
   ```

## Local Development

To test Edge Functions locally:

1. Start the local Supabase instance:
   ```bash
   supabase start
   ```

2. Serve functions locally:
   ```bash
   supabase functions serve
   ```

3. Update your frontend to use local function URLs:
   ```javascript
   // For local testing
   const LOCAL_FUNCTIONS_URL = 'http://localhost:54321/functions/v1'
   ```

## Production URLs

Your Edge Functions are available at:
- `https://unveoqnlqnobufhublyw.supabase.co/functions/v1/create-user`
- `https://unveoqnlqnobufhublyw.supabase.co/functions/v1/resend-invitation`
- `https://unveoqnlqnobufhublyw.supabase.co/functions/v1/delete-user`

## Admin Dashboard Integration

The admin dashboard (`admin-dashboard.html`) automatically uses these Edge Functions when:
1. Creating new users
2. Resending invitations
3. Deleting users

No additional configuration is needed in the frontend - it will automatically detect and use the Edge Functions.

## Maintenance

### Updating Functions
1. Modify the TypeScript files in `/supabase/functions/`
2. Redeploy using the deployment script or manually
3. Test the updated functions

### Monitoring
- View function invocations in your Supabase dashboard
- Check logs for errors or debugging

## Support

If you encounter issues:
1. Check the function logs in Supabase dashboard
2. Verify your service role key is set correctly
3. Ensure the user has Admin role in profiles table
4. Review the browser console for client-side errors