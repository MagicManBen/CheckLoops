#!/bin/bash

# AI Rule Generator - Quick Deploy Script
# This script deploys the edge function and configures the OpenAI API key

set -e

echo "🚀 AI Rule Generator Deployment"
echo "================================"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI is not installed"
    echo "Install it with: brew install supabase/tap/supabase"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Set the OpenAI API key. For security, do NOT hardcode your key here.
# Either export OPENAI_KEY in your shell, or create a local .env with the key and load it.
# Example (.env):
# OPENAI_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Read key from environment
OPENAI_KEY="${OPENAI_KEY:-}"
if [ -z "$OPENAI_KEY" ]; then
    if [ -f .env ]; then
        # shellcheck disable=SC1091
        export $(grep -v '^#' .env | xargs)
        OPENAI_KEY="${OPENAI_KEY:-}"
    fi
fi
if [ -z "$OPENAI_KEY" ]; then
    echo "ERROR: OPENAI_KEY not set. Export OPENAI_KEY or add it to a local .env file. Aborting."
    exit 1
fi

echo "🔑 Setting OpenAI API key..."
supabase secrets set OPENAI_API_KEY="$OPENAI_KEY"

if [ $? -eq 0 ]; then
    echo "✅ API key configured successfully"
else
    echo "⚠️ Warning: Failed to set API key (may already be set)"
fi

echo ""
echo "📦 Deploying ai-rule-generator function..."

# Deploy the function
supabase functions deploy ai-rule-generator --no-verify-jwt

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Open emis_rule_creator_ai.html in your browser"
    echo "2. Select a site from the dropdown"
    echo "3. Type a rule in natural language (e.g., 'Dr Smith cannot do wound checks')"
    echo "4. Click 'Generate Rule with AI'"
    echo "5. Review and save!"
    echo ""
    echo "🧪 Test the function with:"
    echo "curl -X POST 'https://unveoqnlqnobufhublyw.supabase.co/functions/v1/ai-rule-generator' \\"
    echo "  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME' \\"
    echo "  -H 'Content-Type: application/json' \\"
    echo "  -d '{\"rule_text\": \"Dr Smith cannot see wound checks\", \"site_id\": 2}'"
    echo ""
else
    echo "❌ Deployment failed"
    echo "Check the error messages above"
    exit 1
fi
