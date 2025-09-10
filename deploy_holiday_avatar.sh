#!/bin/bash

echo "🚀 Deploying Holiday Avatar Function to Supabase..."

# Set the OpenAI API key as a secret
echo "📝 Setting HolidayAvatar secret..."
npx supabase secrets set HolidayAvatar="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"

# Deploy the function
echo "📦 Deploying generate-holiday-avatar function..."
npx supabase functions deploy generate-holiday-avatar

# Check deployment status
echo "✅ Deployment complete! Function should now be accessible."
echo ""
echo "Test the function with:"
echo "npx supabase functions invoke generate-holiday-avatar --body '{\"destination\":\"Paris\"}'"