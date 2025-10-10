#!/bin/bash

# Quick verification script for save-slot-mappings setup
# Run this after deploying to verify everything is working

echo "🔍 Verifying save-slot-mappings setup..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if required files exist
echo "📁 Checking files..."
files=(
    "create_slot_mappings_table.sql"
    "save-slot-mappings-function.ts"
    "test-save-mappings.html"
    "emis_checker.html"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ${GREEN}✓${NC} $file exists"
    else
        echo -e "  ${RED}✗${NC} $file missing"
    fi
done

echo ""
echo "📋 Next steps:"
echo ""
echo "1. Create the database table:"
echo "   - Open: https://supabase.com/dashboard/project/unveoqnlqnobufhublyw/sql/new"
echo "   - Copy-paste contents of: create_slot_mappings_table.sql"
echo "   - Click 'Run'"
echo ""
echo "2. Deploy the Edge Function:"
echo "   - Open: https://supabase.com/dashboard/project/unveoqnlqnobufhublyw/functions"
echo "   - Click 'Create a new function'"
echo "   - Name: save-slot-mappings"
echo "   - Copy-paste contents of: save-slot-mappings-function.ts"
echo "   - Click 'Deploy'"
echo ""
echo "3. Test the setup:"
echo "   - Open: test-save-mappings.html in your browser"
echo "   - Make sure you're logged in"
echo "   - Click 'Save Sample Mappings'"
echo "   - Click 'View My Mappings'"
echo ""
echo "4. Use in the main app:"
echo "   - Open: emis_checker.html"
echo "   - Navigate to Step 4"
echo "   - Select and confirm mappings"
echo "   - Click 'Next'"
echo "   - Verify Step 5 shows confirmation"
echo ""

# Check if browser is available
if command -v open &> /dev/null; then
    echo "💡 Quick actions:"
    echo ""
    read -p "Open Supabase Dashboard? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open "https://supabase.com/dashboard/project/unveoqnlqnobufhublyw"
    fi
    echo ""
    read -p "Open test page? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open "test-save-mappings.html"
    fi
fi

echo ""
echo "✨ Setup verification complete!"
