#!/bin/bash

# Deployment script for Supabase Edge Functions
# This script deploys the Edge Functions needed for admin operations

echo "=== Deploying Supabase Edge Functions ==="
echo

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed"
    echo "Please install it first: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Check if we're in the project directory
if [ ! -d "supabase/functions" ]; then
    echo "❌ Not in project root directory"
    echo "Please run this script from the CheckLoops project root"
    exit 1
fi

# Function to deploy an Edge Function
deploy_function() {
    local function_name=$1
    echo "Deploying $function_name..."

    supabase functions deploy $function_name --no-verify-jwt

    if [ $? -eq 0 ]; then
        echo "✅ $function_name deployed successfully"
    else
        echo "❌ Failed to deploy $function_name"
        return 1
    fi
}

# Login to Supabase (if not already logged in)
echo "Checking Supabase login status..."
supabase projects list &> /dev/null
if [ $? -ne 0 ]; then
    echo "Please log in to Supabase:"
    supabase login
fi

# Link to project if not already linked
if [ ! -f "supabase/.temp/project-ref" ]; then
    echo
    echo "Please link to your Supabase project:"
    echo "Run: supabase link --project-ref unveoqnlqnobufhublyw"
    echo
    echo "After linking, run this script again."
    exit 1
fi

# Deploy the Edge Functions
echo
echo "Deploying Edge Functions..."
echo

deploy_function "create-user"
deploy_function "resend-invitation"
deploy_function "delete-user"

echo
echo "=== Setting Environment Variables ==="
echo

# Set the service role key as a secret
echo "Setting service role key as secret..."
echo "Please enter your Supabase SERVICE ROLE KEY:"
read -s SERVICE_ROLE_KEY
echo

if [ -z "$SERVICE_ROLE_KEY" ]; then
    echo "❌ Service role key is required"
    exit 1
fi

# Set secrets for all functions
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"

if [ $? -eq 0 ]; then
    echo "✅ Service role key set as secret"
else
    echo "❌ Failed to set service role key"
    exit 1
fi

echo
echo "=== Deployment Complete ==="
echo
echo "✅ All Edge Functions deployed successfully"
echo
echo "Your Edge Functions are now available at:"
echo "  - https://unveoqnlqnobufhublyw.supabase.co/functions/v1/create-user"
echo "  - https://unveoqnlqnobufhublyw.supabase.co/functions/v1/resend-invitation"
echo "  - https://unveoqnlqnobufhublyw.supabase.co/functions/v1/delete-user"
echo
echo "The admin dashboard will now use these functions for user management."
echo
echo "Note: Make sure your admin users have the 'Admin' role in the profiles table."