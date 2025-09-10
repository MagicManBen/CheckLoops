#!/bin/bash

echo "🚀 Deploying Holiday Avatar Function to Supabase with new API key..."

# Set the new OpenAI API key as a secret
echo "📝 Setting HolidayAvatar secret with new API key..."
npx supabase secrets set HolidayAvatar="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"

# Also set as OPENAI_API_KEY for fallback
echo "📝 Setting OPENAI_API_KEY as fallback..."
npx supabase secrets set OPENAI_API_KEY="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"

# Deploy the function
echo "📦 Deploying generate-holiday-avatar function..."
npx supabase functions deploy generate-holiday-avatar

echo "✅ Deployment complete!"
echo ""
echo "The function is now accessible and will use the new API key."