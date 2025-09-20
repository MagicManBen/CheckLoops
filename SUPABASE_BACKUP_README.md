# Supabase Backup and Restore

This directory contains tools for creating complete backups of your Supabase database and restoring them when needed.

## Backup Options

### Option 1: Bash Script (Recommended)

The most reliable method using the Supabase CLI and local PostgreSQL connection:

```bash
# Make the script executable
chmod +x create_supabase_backup.sh

# Run the script
./create_supabase_backup.sh
```

This will create a directory called `SUPABASE_BACKUP_DATABASE` containing:
- Full database dump
- Schema-only backup
- Data-only backup
- Functions and triggers backup
- RLS policies backup
- Metadata and README files

### Option 2: JavaScript (API-based)

If you don't have CLI access or prefer a JavaScript approach:

```bash
# Install dependencies if needed
npm install @supabase/supabase-js

# Run the backup script
node supabase_backup.mjs
```

This creates a similar `SUPABASE_BACKUP_DATABASE` directory with JSON files for each table.

## Restoration

### Option 1: Using the Supabase CLI

```bash
# Reset your local Supabase database and restore from the full backup
supabase db reset && psql -h localhost -p 54322 -U postgres -d postgres -f SUPABASE_BACKUP_DATABASE/full_backup.sql
```

### Option 2: Using the JavaScript Restore Script

```bash
# Run the restore script
node restore_supabase.mjs
```

This will prompt for confirmation before restoring all tables from the backup.

## Included Files

- `backup_supabase_full.sh`: Simple bash script for full database backup
- `create_supabase_backup.sh`: Comprehensive bash script for detailed backups
- `supabase_backup.mjs`: JavaScript backup script using Supabase API
- `restore_supabase.mjs`: JavaScript restore script using Supabase API

## Important Notes

- These backups capture the complete state of your Supabase database
- The backup includes schema, data, functions, and RLS policies
- To revert your entire Supabase instance to this state, use the restoration methods above
- Keep your backup files secure as they contain all your database data

## Requirements

- Bash scripts: Require Supabase CLI and PostgreSQL client tools
- JavaScript scripts: Require Node.js and the Supabase JavaScript client