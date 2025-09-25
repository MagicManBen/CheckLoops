# Supabase Database Backup Instructions

This document provides instructions on how to create backups of your Supabase database using different methods.

## Available Backup Methods

### 1. REST API Backup (supabase-backup.sh)
- **Description**: Uses Supabase REST API to fetch table data
- **What it backs up**: Table data in JSON format
- **Best for**: Quick data exports of small databases
- **Limitations**: May not capture complex data relationships and DB schema

### 2. PostgreSQL Full Backup (backup_postgres.sh)
- **Description**: Uses PostgreSQL's pg_dump via Docker
- **What it backs up**: Complete database schema and data
- **Best for**: Complete database backups including schema, functions, and triggers
- **Limitations**: Requires PostgreSQL password

### 3. Database UI Export (manual method)
- **Description**: Use the Supabase Dashboard UI to export data
- **Steps**:
  1. Log in to Supabase Dashboard
  2. Go to your project
  3. Navigate to the SQL Editor
  4. Run: `SELECT * FROM pg_dump_table_schema();` to get schema 
  5. Use the "Export" option for data
- **Best for**: Occasional backups when scripting isn't available

## How to Use the Backup Scripts

### REST API Backup
```bash
./supabase-backup.sh
```
This will create a file named `supabase_backup_TIMESTAMP.tar.gz` containing JSON files of your table data.

### PostgreSQL Full Backup
```bash
./backup_postgres.sh
```
You'll be prompted for your PostgreSQL password if not provided in the script. This will create a file named `SUPABASE_POSTGRES_BACKUP_TIMESTAMP.tar.gz`.

## Restoring From Backup

### Restoring PostgreSQL Backup
```bash
# Extract the backup file
tar -xzf SUPABASE_POSTGRES_BACKUP_TIMESTAMP.tar.gz

# Restore using Docker
docker run --rm -v $(pwd):/backup postgres:15 psql -h YOUR_HOST -U postgres -d postgres -f /backup/SUPABASE_POSTGRES_BACKUP_TIMESTAMP.sql
```

## Recommended Backup Schedule

- **Daily**: Use `supabase-backup.sh` for quick data backups
- **Weekly**: Use `backup_postgres.sh` for complete schema and data backups
- **Before major changes**: Always run a full backup before schema changes or major data updates

## Important Notes

1. Store your backups securely as they contain sensitive data
2. Test your backups periodically by restoring them to a test environment
3. Keep multiple backup generations
4. Consider automating backups using cron jobs or CI/CD pipelines

## Troubleshooting

If you encounter issues:

1. Verify your Supabase credentials are correct
2. Check that Docker is installed and running
3. Ensure you have sufficient disk space
4. For permission errors, try running scripts with sudo (carefully)