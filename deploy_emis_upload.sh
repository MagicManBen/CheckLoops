#!/bin/bash

# Deploy the updated edge function
echo "Deploying updated emis-upload edge function..."

# First, back up the current index.ts
cp supabase/functions/emis-upload/index.ts supabase/functions/emis-upload/index.ts.backup

# Replace with our new version
cp supabase/functions/emis-upload/index.ts.new supabase/functions/emis-upload/index.ts

# Deploy the function
echo "Running: supabase functions deploy emis-upload"
supabase functions deploy emis-upload

echo "Deployment complete!"
echo "You can test the connection by clicking the 'Test API Connection' button in the HTML page."
echo "The function is now using JWT authentication instead of API key authentication."