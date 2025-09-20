# Supabase Database Backup

This directory contains a complete backup of the Supabase database as of 2025-09-20 19:11:01.

## Backup Contents

- `full_backup.sql`: Complete database dump (schema + data + functions)
- `schema_backup.sql`: Database schema only (tables, views, etc.)
- `data_backup.sql`: Data only (no schema)
- `functions_backup.sql`: Functions, triggers, and procedures
- `rls_policies_backup.sql`: Row-Level Security policies
- `backup_metadata.json`: Backup metadata and restoration instructions

## Restoration Instructions

To restore the complete database:

```bash
supabase db reset && psql -h localhost -p 54322 -U postgres -d postgres -f full_backup.sql
```

Alternatively, you can restore specific parts of the database using the other SQL files.
See `backup_metadata.json` for detailed instructions.
