#!/bin/bash

# Script to restore item_allowed_types data from SupabaseInfo.txt backup
# This will extract the JSON data and convert it to SQL INSERT statements

echo "🔄 Restoring item_allowed_types data from backup..."
echo "📁 Source: CheckLoops copy 18/SupabaseInfo.txt (Sep 9, 2025)"
echo ""

# Extract the item_allowed_types data section
BACKUP_FILE="/Users/benhoward/Desktop/CheckLoop/All Full Backups/CheckLoops copy 18/SupabaseInfo.txt"
RESTORE_FILE="restore_item_allowed_types_$(date +%Y%m%d_%H%M%S).sql"

echo "📋 Extracting item_allowed_types data..."

# Create the SQL file header
cat > "$RESTORE_FILE" << 'EOF'
-- Restore item_allowed_types data from backup
-- Source: SupabaseInfo.txt from Sep 9, 2025
-- Generated: $(date)

-- Clear existing data (optional - remove if you want to keep current data)
-- DELETE FROM item_allowed_types WHERE site_id = 2;

-- Reset sequence to avoid conflicts
SELECT setval('item_allowed_types_id_seq', (SELECT COALESCE(MAX(id), 0) FROM item_allowed_types));

-- Insert restored data
EOF

# Use Python to parse the JSON and create INSERT statements
python3 << 'PYTHON_EOF'
import json
import re

# Read the backup file
backup_file = "/Users/benhoward/Desktop/CheckLoop/All Full Backups/CheckLoops copy 18/SupabaseInfo.txt"

try:
    with open(backup_file, 'r') as f:
        content = f.read()
    
    # Find the item_allowed_types section
    match = re.search(r'"public\.item_allowed_types": \[(.*?)\]', content, re.DOTALL)
    
    if match:
        json_data = '[' + match.group(1) + ']'
        
        # Clean up the JSON (remove trailing commas and fix formatting)
        json_data = re.sub(r',(\s*[}\]])', r'\1', json_data)
        
        try:
            records = json.loads(json_data)
            
            print(f"Found {len(records)} item_allowed_types records")
            
            # Generate INSERT statements
            with open("restore_item_allowed_types_temp.sql", "w") as sql_file:
                for record in records:
                    # Handle None/null values
                    def format_value(val):
                        if val is None:
                            return "NULL"
                        elif isinstance(val, str):
                            return f"'{val}'"
                        elif isinstance(val, bool):
                            return "true" if val else "false"
                        else:
                            return str(val)
                    
                    # Create INSERT statement
                    sql = f"""INSERT INTO item_allowed_types (id, site_id, item_id, check_type_id, frequency, required, warn_before, scheduled_day, responsible_team_id, active, created_at) VALUES ({format_value(record.get('id'))}, {format_value(record.get('site_id'))}, {format_value(record.get('item_id'))}, {format_value(record.get('check_type_id'))}, {format_value(record.get('frequency'))}, {format_value(record.get('required'))}, {format_value(record.get('warn_before'))}, {format_value(record.get('scheduled_day'))}, {format_value(record.get('responsible_team_id'))}, {format_value(record.get('active'))}, '{record.get('created_at')}');"""
                    
                    sql_file.write(sql + "\n")
                    
            print("✅ SQL statements generated successfully")
                    
        except json.JSONDecodeError as e:
            print(f"❌ JSON parsing error: {e}")
            print("First 500 chars of extracted data:")
            print(json_data[:500])
            
    else:
        print("❌ Could not find item_allowed_types data in backup file")
        
except FileNotFoundError:
    print("❌ Backup file not found")
except Exception as e:
    print(f"❌ Error: {e}")

PYTHON_EOF

# Check if Python script succeeded
if [ -f "restore_item_allowed_types_temp.sql" ]; then
    # Append the generated SQL to our main file
    cat restore_item_allowed_types_temp.sql >> "$RESTORE_FILE"
    rm restore_item_allowed_types_temp.sql
    
    # Add footer
    cat >> "$RESTORE_FILE" << 'EOF'

-- Update sequence to correct value
SELECT setval('item_allowed_types_id_seq', (SELECT MAX(id) FROM item_allowed_types));

-- Verify restoration
SELECT COUNT(*) as total_records FROM item_allowed_types WHERE site_id = 2;
SELECT 'item_allowed_types data restored successfully!' as status;
EOF

    echo ""
    echo "✅ Restore SQL file created: $RESTORE_FILE"
    echo ""
    echo "🔧 To apply the restoration:"
    echo "   1. Review the file: cat $RESTORE_FILE"
    echo "   2. Apply to database: supabase db push --linked"
    echo "      OR use psql connection to run the file"
    echo ""
    echo "📊 Preview of what will be restored:"
    head -20 "$RESTORE_FILE"
else
    echo "❌ Failed to generate SQL file"
fi

echo ""
echo "🎉 Data extraction complete!"