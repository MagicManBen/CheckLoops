#!/usr/bin/env python3
"""
Update all references from old tables to master_users
"""
import re
import glob
import os
from datetime import datetime

# Tables to replace with master_users
TABLES_TO_REPLACE = {
    'profiles': 'master_users',
    'kiosk_users': 'master_users',
    'staff_app_welcome': 'master_users',
    '1_staff_holiday_profiles': 'master_users',
    'staff_holiday_profiles': 'master_users',
    '3_staff_working_patterns': 'master_users',
    'staff_working_patterns': 'master_users',
    'working_patterns': 'master_users',
    'user_profiles_complete': 'master_users',
    'onboarding': 'master_users',
    'holiday_entitlements': 'master_users',
    'user_permissions': 'master_users',
    'user_roles': 'master_users'
}

# Critical files to update first
CRITICAL_FILES = [
    'staff.html',
    'admin-dashboard.html',
    'my-holidays.html',
    'indexIpad.html',
    'index.html',
    'staff-welcome.html'
]

def update_file(file_path):
    """Update a single file to use master_users"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content
        changes_made = []

        for old_table, new_table in TABLES_TO_REPLACE.items():
            # Replace .from('table_name') patterns
            pattern = rf"\.from\(['\"]({re.escape(old_table)})[\"']\)"
            replacement = f".from('{new_table}')"

            matches = len(re.findall(pattern, content))
            if matches > 0:
                content = re.sub(pattern, replacement, content)
                changes_made.append(f"  - .from('{old_table}') → .from('{new_table}'): {matches} replacements")

            # Replace SQL FROM clauses
            sql_pattern = rf"FROM\s+public\.{re.escape(old_table)}\b"
            sql_replacement = f"FROM public.{new_table}"

            sql_matches = len(re.findall(sql_pattern, content, re.IGNORECASE))
            if sql_matches > 0:
                content = re.sub(sql_pattern, sql_replacement, content, flags=re.IGNORECASE)
                changes_made.append(f"  - FROM public.{old_table} → FROM public.{new_table}: {sql_matches} replacements")

            # Replace table references in comments or strings
            comment_pattern = rf"//.*{re.escape(old_table)}\s+table"
            if re.search(comment_pattern, content):
                content = re.sub(rf"\b{re.escape(old_table)}\s+table", f"{new_table} table", content)
                changes_made.append(f"  - Updated {old_table} references in comments")

        # Write back if changes were made
        if content != original_content:
            # Create backup
            backup_path = f"{file_path}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            with open(backup_path, 'w', encoding='utf-8') as f:
                f.write(original_content)

            # Write updated content
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)

            return True, changes_made

        return False, []

    except Exception as e:
        return False, [f"ERROR: {str(e)}"]

def main():
    print("=" * 80)
    print("UPDATING ALL TABLE REFERENCES TO USE master_users")
    print("=" * 80)

    # Get all files to update
    html_files = glob.glob('*.html')
    js_files = glob.glob('*.js')
    all_files = html_files + js_files

    # Sort to process critical files first
    critical_first = []
    other_files = []

    for f in all_files:
        if os.path.basename(f) in CRITICAL_FILES:
            critical_first.append(f)
        else:
            other_files.append(f)

    all_files = critical_first + other_files

    # Update each file
    updated_count = 0
    error_count = 0

    print("\nCRITICAL FILES:")
    print("-" * 80)

    for file_path in all_files:
        is_critical = os.path.basename(file_path) in CRITICAL_FILES

        if not is_critical and updated_count > 0 and updated_count == len(critical_first):
            print("\nOTHER FILES:")
            print("-" * 80)

        updated, changes = update_file(file_path)

        if updated:
            print(f"\n✓ {file_path}")
            for change in changes:
                print(change)
            updated_count += 1
        elif changes and changes[0].startswith("ERROR"):
            print(f"\n✗ {file_path}")
            for change in changes:
                print(change)
            error_count += 1

    print("\n" + "=" * 80)
    print(f"Update complete!")
    print(f"  Files updated: {updated_count}")
    print(f"  Errors: {error_count}")
    print(f"  Files unchanged: {len(all_files) - updated_count - error_count}")
    print("=" * 80)

    print("\nBackup files created with .backup_* extension")
    print("After verification, you can remove backups with: rm *.backup_*")

if __name__ == "__main__":
    main()