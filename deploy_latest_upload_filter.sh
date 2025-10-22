#!/bin/bash

# Deploy script to update emis_apps_filled view to only show latest upload
# This allows keeping all historical data while only displaying the most recent dataset

echo "🚀 Deploying latest upload filter for emis_apps_filled view..."
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI is not installed"
    echo "   Install it with: brew install supabase/tap/supabase"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "supabase/migrations/20251021_update_emis_apps_filled_latest_only.sql" ]; then
    echo "❌ Error: Migration file not found"
    echo "   Make sure you're in the project root directory"
    exit 1
fi

echo "📋 Migration file found"
echo ""

# Link to Supabase project (if not already linked)
echo "🔗 Linking to Supabase project..."
supabase link --project-ref unveoqnlqnobufhublyw

# Push the migration
echo ""
echo "📤 Pushing migration to Supabase..."
supabase db push

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 What changed:"
echo "   - emis_apps_filled view now only shows the LATEST upload per site"
echo "   - Historical data is preserved in emis_apps_raw"
echo "   - Dashboard, rules, and reports will now only use the most recent data"
echo ""
echo "🧪 To verify:"
echo "   1. Upload a CSV file via the dashboard"
echo "   2. Check that the dashboard shows correct counts"
echo "   3. Upload the same CSV again - counts should remain the same (not double)"
echo ""
