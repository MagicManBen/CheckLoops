#!/bin/bash

# Configuration variables
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="SUPABASE_POSTGRES_BACKUP_${TIMESTAMP}.sql"

# Supabase project details - replace these with your actual values
SUPABASE_URL="https://unveoqnlqnobufhublyw.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc"
PROJECT_ID="unveoqnlqnobufhublyw"

# PostgreSQL connection details
PG_HOST="${PROJECT_ID}.supabase.co"
PG_PORT=5432
PG_DATABASE="postgres"
PG_USER="postgres"
PG_PASSWORD="YOUR_DATABASE_PASSWORD" # Replace with your actual password

echo "Starting PostgreSQL dump via Docker..."
echo "This will create a backup of your entire Supabase PostgreSQL database."

# Check if password needs to be entered
if [[ "$PG_PASSWORD" == "YOUR_DATABASE_PASSWORD" ]]; then
  echo "Please enter your Supabase PostgreSQL password:"
  read -s PG_PASSWORD
fi

# Create PostgreSQL password file for pgdump
echo "$PG_HOST:$PG_PORT:$PG_DATABASE:$PG_USER:$PG_PASSWORD" > ~/.pgpass
chmod 600 ~/.pgpass

# Create backup using Docker
docker run --rm -v $(pwd):/backup -v ~/.pgpass:/root/.pgpass:ro postgres:15 bash -c "chmod 600 /root/.pgpass && pg_dump --host=$PG_HOST --port=$PG_PORT --username=$PG_USER --dbname=$PG_DATABASE --format=plain --no-owner --no-acl > /backup/$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ]; then
  echo "PostgreSQL backup created successfully: $BACKUP_FILE"
  
  # Create compressed version
  echo "Compressing backup..."
  tar -czf "${BACKUP_FILE}.tar.gz" "$BACKUP_FILE"
  
  # Clean up the uncompressed file
  rm "$BACKUP_FILE"
  
  echo "Backup complete: ${BACKUP_FILE}.tar.gz"
else
  echo "Error: PostgreSQL backup failed."
fi

# Clean up pgpass file
rm ~/.pgpass