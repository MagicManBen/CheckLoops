#!/bin/bash

# Configuration variables
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="SUPABASE_BACKUP_${TIMESTAMP}.sql"

# Check for credentials file
if [ -f ".env.supabase" ]; then
  echo "Loading Supabase credentials from .env.supabase..."
  source .env.supabase
fi

# If credentials are not set, prompt for them
if [ -z "$SUPABASE_DB_HOST" ] || [ -z "$SUPABASE_DB_PORT" ] || [ -z "$SUPABASE_DB_NAME" ] || [ -z "$SUPABASE_DB_USER" ] || [ -z "$SUPABASE_DB_PASSWORD" ]; then
  echo "Please enter your Supabase database connection details:"
  read -p "Database Host: " SUPABASE_DB_HOST
  read -p "Database Port (usually 5432): " SUPABASE_DB_PORT
  read -p "Database Name: " SUPABASE_DB_NAME
  read -p "Database User: " SUPABASE_DB_USER
  read -sp "Database Password: " SUPABASE_DB_PASSWORD
  echo ""
fi

# Backup command using Docker
echo "Creating backup of Supabase database..."
docker run --rm postgres:15 pg_dump \
  -h $SUPABASE_DB_HOST \
  -p $SUPABASE_DB_PORT \
  -d $SUPABASE_DB_NAME \
  -U $SUPABASE_DB_USER \
  -f /tmp/backup.sql \
  --no-owner \
  --no-acl \
  -v \
  -b \
  && docker cp $(docker ps -lq):/tmp/backup.sql $BACKUP_FILE

# Check if backup was successful
if [ $? -eq 0 ]; then
  echo "Backup successful! Saved to $BACKUP_FILE"
else
  echo "Backup failed. Please check your credentials and try again."
fi