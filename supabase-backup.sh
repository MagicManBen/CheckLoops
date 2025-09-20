#!/bin/bash

# Create a timestamp for the backup file
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="supabase_backup_${TIMESTAMP}.sql"

# Set Supabase URL and Key as environment variables
export SUPABASE_URL="https://unveoqnlqnobufhublyw.supabase.co"
export SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc"

# Create a local config for this specific backup
cat > supabase_config.json << EOL
{
  "project_id": "unveoqnlqnobufhublyw",
  "api": {
    "url": "https://unveoqnlqnobufhublyw.supabase.co",
    "service_role": "${SUPABASE_KEY}"
  }
}
EOL

# Use curl to backup the database through the REST API
echo "Creating database backup through Supabase REST API..."
curl -X GET "${SUPABASE_URL}/rest/v1/" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" > "${BACKUP_FILE}"

# Get a list of all tables through the REST API
echo "Fetching table list..."
TABLES=$(curl -s -X GET "${SUPABASE_URL}/rest/v1/" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" | grep -o '"name":"[^"]*"' | sed 's/"name":"//g' | sed 's/"//g')

# Loop through each table and export its data
echo "Backing up table data..."
for TABLE in $TABLES; do
  echo "Backing up table: $TABLE"
  curl -s -X GET "${SUPABASE_URL}/rest/v1/${TABLE}" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_KEY}" > "${TABLE}_data.json"
done

# Create a combined backup file with all the data
echo "Creating combined backup file..."
tar -czf "supabase_backup_${TIMESTAMP}.tar.gz" "${BACKUP_FILE}" *_data.json supabase_config.json

# Clean up temporary files
echo "Cleaning up temporary files..."
rm -f *_data.json supabase_config.json

echo "Backup complete: supabase_backup_${TIMESTAMP}.tar.gz"
echo "This backup contains the database schema and table data exported from Supabase."