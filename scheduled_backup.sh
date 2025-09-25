#!/bin/bash
#
# scheduled_backup.sh
# Automated Supabase database backup script
#
# Usage: 
#   ./scheduled_backup.sh [backup_type]
#
# Arguments:
#   backup_type - Optional. Either "quick" (REST API backup) or "full" (PostgreSQL dump)
#                 Default is "quick"
#
# This script can be scheduled with cron to run automatically:
# Example crontab entries:
#   # Run quick backup daily at 3 AM
#   0 3 * * * /path/to/scheduled_backup.sh quick
#
#   # Run full backup weekly on Sunday at 2 AM
#   0 2 * * 0 /path/to/scheduled_backup.sh full

# Set script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Default to quick backup if no argument is provided
BACKUP_TYPE=${1:-quick}

# Configuration
BACKUP_DIR="$SCRIPT_DIR/backups"
RETENTION_DAYS_QUICK=7   # Keep quick backups for 7 days
RETENTION_DAYS_FULL=30   # Keep full backups for 30 days
LOG_FILE="$SCRIPT_DIR/backup_log.txt"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Log function
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Clean up old backups
cleanup_old_backups() {
  local pattern=$1
  local days=$2
  
  log "Cleaning up old $pattern backups (older than $days days)..."
  find "$BACKUP_DIR" -name "$pattern" -type f -mtime +$days -delete
  log "Cleanup complete."
}

# Perform backup
log "Starting $BACKUP_TYPE backup..."

# Move to backup directory
cd "$BACKUP_DIR"

if [ "$BACKUP_TYPE" = "full" ]; then
  # Run full PostgreSQL backup
  log "Running full PostgreSQL backup..."
  "$SCRIPT_DIR/backup_postgres.sh" 
  
  # Clean up old full backups
  cleanup_old_backups "SUPABASE_POSTGRES_BACKUP_*.tar.gz" $RETENTION_DAYS_FULL
else
  # Run quick REST API backup
  log "Running quick REST API backup..."
  "$SCRIPT_DIR/supabase-backup.sh"
  
  # Clean up old quick backups
  cleanup_old_backups "supabase_backup_*.tar.gz" $RETENTION_DAYS_QUICK
fi

log "Backup process completed."

# Return to original directory
cd "$SCRIPT_DIR"