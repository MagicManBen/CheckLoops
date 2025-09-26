#!/bin/bash

# Deploy NHS Data Edge Function to Supabase
# This script deploys the fetch-nhs-data-complete edge function

echo "========================================="
echo "NHS Edge Function Deployment Script"
echo "========================================="

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
else
    echo "✅ Supabase CLI is installed"
fi

# Check if logged in
echo ""
echo "Checking Supabase login status..."
if ! supabase projects list &> /dev/null; then
    echo "Please login to Supabase:"
    supabase login
fi

# Link to project
echo ""
echo "Linking to your project..."
supabase link --project-ref unveoqnlqnobufhublyw

# Deploy the edge function
echo ""
echo "Deploying fetch-nhs-data-complete edge function..."
supabase functions deploy fetch-nhs-data-complete

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Edge function deployed successfully!"
    echo ""
    echo "You can test it by visiting:"
    echo "https://unveoqnlqnobufhublyw.supabase.co/functions/v1/fetch-nhs-data-complete"
    echo ""
    echo "To view logs:"
    echo "supabase functions logs fetch-nhs-data-complete"
else
    echo ""
    echo "❌ Deployment failed. Please check the error messages above."
fi

echo ""
echo "========================================="
echo "Deployment Complete"
echo "========================================="