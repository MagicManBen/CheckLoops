#!/bin/bash

# Define source and destination paths
SOURCE_DIR="/Users/benhoward/Desktop/CheckLoop/CheckLoops"
DEST_DIR="/Users/benhoward/Desktop/SUPABASE_BACKUP"

# Create the destination directory
mkdir -p "$DEST_DIR"

echo "Copying Supabase backup files to your Desktop..."

# Copy all relevant backup files
cp -r "$SOURCE_DIR/SUPABASE_BACKUP_DATABASE" "$DEST_DIR/"
cp "$SOURCE_DIR/SUPABASE_BACKUP_DATABASE.sql" "$DEST_DIR/"
cp "$SOURCE_DIR/SUPABASE_BACKUP_DATABASE_"*.sql "$DEST_DIR/"
cp "$SOURCE_DIR/SUPABASE_BACKUP_INFO.json" "$DEST_DIR/"
cp "$SOURCE_DIR/SUPABASE_BACKUP_README.md" "$DEST_DIR/"

# Create a simple README if it doesn't exist
if [ ! -f "$DEST_DIR/README.txt" ]; then
    cat > "$DEST_DIR/README.txt" << EOL
# Supabase Database Backup

This directory contains a backup of your Supabase database as of $(date '+%Y-%m-%d %H:%M:%S').

## Main Backup Files:
- SUPABASE_BACKUP_DATABASE.sql - The main backup file (can be used to restore)
- SUPABASE_BACKUP_DATABASE_*.sql - Timestamped version of the backup
- SUPABASE_BACKUP_INFO.json - Metadata about the backup

## Detailed Backup (in SUPABASE_BACKUP_DATABASE folder):
- full_backup.sql - Complete database dump
- schema_backup.sql - Database schema only
- data_backup.sql - Data only
- functions_backup.sql - Functions and triggers
- rls_policies_backup.sql - Row-Level Security policies

## To restore this backup:
Run the following command in your project directory:
supabase db reset && psql -h localhost -p 54322 -U postgres -d postgres -f SUPABASE_BACKUP_DATABASE.sql
EOL
fi

echo "✅ Backup files copied successfully to: $DEST_DIR"
echo "You can find all your backup files at: $DEST_DIR"

# Open the backup folder in Finder
open "$DEST_DIR"