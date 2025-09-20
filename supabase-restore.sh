#!/bin/bash

# Check if a backup file is specified
if [ $# -eq 0 ]; then
  echo "Error: No backup file specified"
  echo "Usage: $0 <backup_file.tar.gz>"
  exit 1
fi

BACKUP_FILE=$1

# Check if the backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file '$BACKUP_FILE' not found"
  exit 1
fi

# Create a temporary directory for extraction
TEMP_DIR=$(mktemp -d)
echo "Extracting backup to temporary directory: $TEMP_DIR"

# Extract the backup
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Load Supabase configuration
if [ -f "$TEMP_DIR/supabase_config.json" ]; then
  SUPABASE_URL=$(jq -r '.api.url' "$TEMP_DIR/supabase_config.json")
  SUPABASE_KEY=$(jq -r '.api.service_role' "$TEMP_DIR/supabase_config.json")
  echo "Using Supabase configuration from backup file"
else
  echo "No configuration found in backup. Please enter Supabase details:"
  read -p "Supabase URL: " SUPABASE_URL
  read -p "Supabase service role key: " SUPABASE_KEY
fi

# Set Supabase URL and Key as environment variables
export SUPABASE_URL
export SUPABASE_KEY

# Prompt for confirmation before restoring
echo "WARNING: This will attempt to restore data to Supabase at $SUPABASE_URL"
echo "This operation will overwrite existing data. Make sure you have backed up your current data."
read -p "Are you sure you want to proceed? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Restore cancelled"
  exit 1
fi

# Find all data files
DATA_FILES=$(find "$TEMP_DIR" -name "*_data.json")

# Restore each table
for DATA_FILE in $DATA_FILES; do
  TABLE_NAME=$(basename "$DATA_FILE" _data.json)
  echo "Restoring table: $TABLE_NAME"
  
  # Only proceed if the file has content
  if [ -s "$DATA_FILE" ]; then
    # Delete existing data first
    curl -X DELETE "$SUPABASE_URL/rest/v1/$TABLE_NAME" \
      -H "apikey: $SUPABASE_KEY" \
      -H "Authorization: Bearer $SUPABASE_KEY" \
      -H "Prefer: return=minimal"
    
    # Insert new data
    curl -X POST "$SUPABASE_URL/rest/v1/$TABLE_NAME" \
      -H "apikey: $SUPABASE_KEY" \
      -H "Authorization: Bearer $SUPABASE_KEY" \
      -H "Content-Type: application/json" \
      -H "Prefer: resolution=merge-duplicates" \
      --data-binary @"$DATA_FILE"
  else
    echo "  Skipping empty table: $TABLE_NAME"
  fi
done

echo "Cleaning up temporary files..."
rm -rf "$TEMP_DIR"

echo "Restore completed!"
echo "Note: Some constraints or triggers might need to be recreated manually."
echo "If any issues occur, you may need to restore using the Supabase dashboard or CLI."