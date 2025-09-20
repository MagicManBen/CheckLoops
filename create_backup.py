#!/usr/bin/env python3
"""
Create a comprehensive backup of all Supabase tables
"""
import os
import requests
import json
from datetime import datetime

# Supabase credentials
SUPABASE_URL = "https://unveoqnlqnobufhublyw.supabase.co"
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
if not SUPABASE_KEY:
    raise RuntimeError('SUPABASE_SERVICE_ROLE_KEY not set in environment')

# Tables to backup (excluding views)
TABLES_TO_BACKUP = [
    'master_users', 'profiles', 'kiosk_users', 'staff_app_welcome',
    '1_staff_holiday_profiles', 'staff_holiday_profiles',
    '3_staff_working_patterns', 'staff_working_patterns', 'working_patterns',
    'user_profiles_complete', 'onboarding', 'holiday_entitlements',
    'user_permissions', 'user_roles',
    '2_staff_entitlements', '4_holiday_bookings', '4_holiday_requests',
    '5_staff_profile_user_links', 'achievements', 'agenda_items',
    'check_types', 'complaint_attachments', 'complaint_categories',
    'complaints', 'fuzzy_match_holidays', 'fuzzy_match_training',
    'holiday_bookings', 'holiday_request_days', 'holiday_requests',
    'holiday_summary', 'item_allowed_types', 'items',
    'meeting_action_items', 'meeting_attendees', 'meeting_notes',
    'meetings', 'pir_attachments', 'pir_documents',
    'practice_quizzes', 'project_issues', 'quiz_attempts',
    'quiz_options', 'quiz_practices', 'quiz_questions',
    'rooms', 'site_invitations', 'site_invites', 'sites',
    'staff', 'staff_training_records', 'submission_rows',
    'submissions', 'teams', 'training_certificates',
    'training_records', 'training_types', 'user_achievements',
    'avatar_option_labels', 'kiosk_roles', 'role_permissions'
]

def backup_table(table_name):
    """Backup a single table"""
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }

    url = f"{SUPABASE_URL}/rest/v1/{table_name}"

    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            return {"table": table_name, "rows": len(data), "data": data}
        else:
            return {"table": table_name, "error": f"Status {response.status_code}: {response.text[:200]}"}
    except Exception as e:
        return {"table": table_name, "error": str(e)}

def main():
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"supabase_backup_{timestamp}.json"

    print(f"Creating backup: {backup_filename}")
    print("=" * 60)

    backup_data = {
        "timestamp": timestamp,
        "tables": {}
    }

    successful = 0
    failed = 0
    total_rows = 0

    for table in TABLES_TO_BACKUP:
        print(f"Backing up {table}...", end=" ")
        result = backup_table(table)

        if "error" in result:
            print(f"FAILED - {result['error'][:50]}")
            backup_data["tables"][table] = {"error": result["error"]}
            failed += 1
        else:
            rows = result["rows"]
            print(f"OK ({rows} rows)")
            backup_data["tables"][table] = result["data"]
            successful += 1
            total_rows += rows

    # Save backup
    with open(backup_filename, 'w') as f:
        json.dump(backup_data, f, indent=2, default=str)

    print("=" * 60)
    print(f"Backup complete: {backup_filename}")
    print(f"Tables backed up: {successful}/{len(TABLES_TO_BACKUP)}")
    print(f"Total rows: {total_rows}")
    if failed > 0:
        print(f"Failed tables: {failed}")

    return backup_filename

if __name__ == "__main__":
    main()
