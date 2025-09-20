#!/bin/bash

# Supabase Database Backup Script
# Creates a full backup of the database with timestamp using Supabase CLI

# Configuration
PROJECT_REF="unveoqnlqnobufhublyw"
SUPABASE_URL="https://unveoqnlqnobufhublyw.supabase.co"

# Generate timestamp for filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="supabase_backup_${TIMESTAMP}.sql"

echo "🗄️  Creating Supabase database backup..."
echo "📅 Timestamp: ${TIMESTAMP}"
echo "📁 Backup file: ${BACKUP_FILE}"
echo "🔗 Project: ${PROJECT_REF}"
echo ""

# Check if logged in to Supabase
echo "🔐 Checking Supabase authentication..."
supabase projects list > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Not logged in to Supabase CLI"
    echo "💡 Please run: supabase login"
    echo "   Then link project: supabase link --project-ref ${PROJECT_REF}"
    exit 1
fi

# Create the backup using Supabase CLI
echo "⏳ Starting backup process..."
echo "📡 Connecting to remote database..."

# Use supabase db dump command
supabase db dump --linked --file "${BACKUP_FILE}" --schema public

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Backup completed successfully!"
    echo "📁 File: ${BACKUP_FILE}"
    
    # Show file size
    if [ -f "$BACKUP_FILE" ]; then
        FILE_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
        echo "📊 Size: ${FILE_SIZE}"
    fi
    
    echo ""
    echo "📋 Backup includes:"
    echo "   • Database schema (tables, indexes, constraints)"
    echo "   • All data from public schema"
    echo "   • Functions and procedures"
    echo "   • Sequences and triggers"
    echo ""
    echo "🔄 To restore this backup:"
    echo "   supabase db reset --linked"
    echo "   psql -h db.${PROJECT_REF}.supabase.co -p 5432 -U postgres -d postgres -f ${BACKUP_FILE}"
    echo ""
    echo "📝 Or create a new project and restore:"
    echo "   supabase projects create <new-project-name>"
    echo "   supabase link --project-ref <new-project-ref>"
    echo "   supabase db reset --linked"
    echo "   psql <connection-string> -f ${BACKUP_FILE}"
else
    echo ""
    echo "❌ Backup failed!"
    echo "Please ensure you're linked to the project:"
    echo "   supabase link --project-ref ${PROJECT_REF}"
    exit 1
fi

echo "🎉 Backup process complete!"