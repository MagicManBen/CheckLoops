#!/bin/bash

# Deploy Certificate Processing System
# This script deploys the fixed PDF-to-Image certificate processing system

echo "🚀 Deploying Certificate Processing System (PDF-to-Image)"
echo "======================================================"

# Check if we're in the right directory
if [ ! -d "supabase" ]; then
    echo "❌ Error: supabase directory not found. Run this from the project root."
    exit 1
fi

# 1. Deploy the edge function
echo "📦 Deploying extract-certificate-v2 edge function..."
supabase functions deploy extract-certificate-v2

if [ $? -ne 0 ]; then
    echo "❌ Failed to deploy edge function"
    exit 1
fi

echo "✅ Edge function deployed successfully"

# 2. Set OpenAI API key
echo "🔑 Setting OpenAI API key..."
echo "Please enter your OpenAI API key (starts with sk-):"
read -s OPENAI_KEY

if [[ ! "$OPENAI_KEY" =~ ^sk- ]]; then
    echo "❌ Invalid API key format. Should start with 'sk-'"
    exit 1
fi

# Set the API key in multiple environment variables for redundancy
supabase secrets set OPENAI_API_KEY="$OPENAI_KEY"
supabase secrets set CheckLoopsAI="$OPENAI_KEY" 
supabase secrets set OPENAI_API_KEY_CERTIFICATE="$OPENAI_KEY"

if [ $? -ne 0 ]; then
    echo "❌ Failed to set API key"
    exit 1
fi

echo "✅ OpenAI API key configured successfully"

# 3. Verify storage bucket exists
echo "🪣 Verifying storage bucket..."
echo "Please run this SQL in your Supabase SQL Editor:"
echo ""
echo "-- Create training_certificates bucket if it doesn't exist"
echo "INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)"
echo "VALUES ("
echo "  'training_certificates',"
echo "  'training_certificates',"
echo "  false,"
echo "  10485760,"  # 10MB
echo "  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']"
echo ") ON CONFLICT (id) DO NOTHING;"
echo ""
echo "-- Set RLS policy for authenticated users"
echo "CREATE POLICY IF NOT EXISTS \"Authenticated users can upload certificates\""
echo "ON storage.objects FOR ALL"
echo "TO authenticated"
echo "USING (bucket_id = 'training_certificates');"
echo ""

# 4. Test the deployment
echo "🧪 Testing the deployment..."
echo "The system is now ready to use!"
echo ""
echo "📋 Next steps:"
echo "1. Run the SQL commands above in Supabase SQL Editor"
echo "2. Open your training page in a browser"
echo "3. Try uploading a PDF certificate"
echo "4. The system will convert PDF → Image → AI Analysis"
echo ""
echo "🔍 Debug features:"
echo "- Check browser console for [PDF-IMG] logs"
echo "- Use window.debugCertificateUpload() in console"
echo "- Look for the debug panel on successful uploads"
echo ""
echo "✅ Deployment complete!"