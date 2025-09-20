# Supabase Backup and Restore Guide

This document provides information about the backup and restore process for your Supabase database.

## Backup Files

The following backup files have been created:

- **supabase_backup_20250920_222349.tar.gz**: Full database backup created on September 20, 2025

The backup includes:
- Database schema
- Table data in JSON format
- Supabase configuration

## Creating a New Backup

To create a new backup of your Supabase database:

1. Run the backup script:
   ```
   ./supabase-backup.sh
   ```

2. The script will:
   - Connect to your Supabase instance
   - Export all tables and their data
   - Create a timestamped backup file in the current directory

## Restoring from Backup

To restore your Supabase database from a backup:

1. Run the restore script with the backup file:
   ```
   ./supabase-restore.sh supabase_backup_20250920_222349.tar.gz
   ```

2. The script will:
   - Extract the backup file
   - Connect to your Supabase instance
   - Delete existing data from each table
   - Import the backed-up data

**WARNING**: Restoring will overwrite existing data. Always make sure you have a backup of your current data before performing a restore.

## Backup Contents

The backup archive contains:
- `supabase_backup_[timestamp].sql`: Schema information
- `[table_name]_data.json`: Individual table data exports
- `supabase_config.json`: Supabase connection information

## Connection Details

The backup and restore scripts use the following Supabase connection details:

- **URL**: https://unveoqnlqnobufhublyw.supabase.co
- **Service Key**: [REDACTED]

## Notes

- Row-Level Security (RLS) policies and other database-level configurations might need manual recreation after a restore.
- Some constraints and triggers might need to be manually recreated.
- For large databases, the restore process might take some time to complete.