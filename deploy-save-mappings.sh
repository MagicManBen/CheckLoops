#!/bin/bash
# Deploy the save-slot-mappings Edge Function

echo "🚀 Deploying save-slot-mappings Edge Function..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Deploy the function
supabase functions deploy save-slot-mappings

if [ $? -eq 0 ]; then
    echo "✅ Edge Function deployed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Run the SQL to create the table:"
    echo "   - Open Supabase Dashboard > SQL Editor"
    echo "   - Copy contents of sql/create_slot_type_mappings.sql"
    echo "   - Execute the SQL"
    echo ""
    echo "2. Test the function:"
    echo "   - Open emis_checker.html in browser"
    echo "   - Navigate to Step 4"
    echo "   - Select slot types and click Next"
    echo ""
    echo "🔗 Function URL:"
    echo "   https://unveoqnlqnobufhublyw.supabase.co/functions/v1/save-slot-mappings"
else
    echo "❌ Deployment failed"
    exit 1
fi
