#!/usr/bin/env python3
"""
Complete cleanup of ALL references to old tables
Replace with master_users as the single source of truth
"""
import re
import glob
import os
from datetime import datetime

# Define the replacements needed
REPLACEMENTS = {
    # Simple table replacements
    r"\.from\(['\"](profiles)[\"']\)": r".from('master_users')",
    r"\.from\(['\"](kiosk_users)[\"']\)": r".from('master_users')",
    r"\.from\(['\"](staff_app_welcome)[\"']\)": r".from('master_users')",
    r"\.from\(['\"](user_profiles_complete)[\"']\)": r".from('master_users')",

    # SQL FROM replacements
    r"FROM\s+public\.(profiles)\b": r"FROM public.master_users",
    r"FROM\s+public\.(kiosk_users)\b": r"FROM public.master_users",
    r"FROM\s+public\.(staff_app_welcome)\b": r"FROM public.master_users",

    # INSERT INTO replacements
    r"INSERT\s+INTO\s+public\.(profiles)\b": r"INSERT INTO public.master_users",
    r"INSERT\s+INTO\s+public\.(kiosk_users)\b": r"INSERT INTO public.master_users",

    # DELETE FROM replacements
    r"DELETE\s+FROM\s+(profiles)\b": r"DELETE FROM master_users",
    r"DELETE\s+FROM\s+(kiosk_users)\b": r"DELETE FROM master_users",
    r"DELETE\s+FROM\s+(staff_app_welcome)\b": r"DELETE FROM master_users",
    r"DELETE\s+FROM\s+(staff_holiday_profiles)\b": r"DELETE FROM master_users",

    # Comments and log messages
    r"Avatar from profiles": r"Avatar from master_users",
    r"Users from profiles": r"Users from master_users",
    r"fetching avatar from profiles": r"fetching avatar from master_users",
    r"Error loading profiles": r"Error loading master_users",
    r"Cannot access site_invites table": r"Cannot access site_invites table",
    r"Delete from profiles": r"Delete from master_users",
    r"Delete from staff_holiday_profiles": r"Delete from master_users",
}

# Column mapping that needs to be fixed
COLUMN_FIXES = [
    # When querying master_users, use auth_user_id instead of user_id
    (r"(\.from\(['\"]*master_users['\"]*\)[^.]*\.eq\(['\"]*)(user_id)(['\"])", r"\1auth_user_id\3"),
    (r"(\.from\(['\"]*master_users['\"]*\)[^.]*\.select\([^)]*)(user_id)", r"\1auth_user_id"),
    (r"(INSERT INTO public\.master_users[^(]*\([^)]*)(user_id)", r"\1auth_user_id"),
]

def fix_file(file_path):
    """Fix all references in a single file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content
        changes_made = []

        # Apply simple replacements
        for pattern, replacement in REPLACEMENTS.items():
            matches = re.findall(pattern, content, re.IGNORECASE)
            if matches:
                content = re.sub(pattern, replacement, content, flags=re.IGNORECASE)
                changes_made.append(f"  - {pattern} → {replacement}: {len(matches)} replacements")

        # Apply column fixes
        for pattern, replacement in COLUMN_FIXES:
            matches = re.findall(pattern, content)
            if matches:
                content = re.sub(pattern, replacement, content)
                changes_made.append(f"  - Fixed column reference: {len(matches)} replacements")

        # Write back if changes were made
        if content != original_content:
            # Create backup
            backup_path = f"{file_path}.cleanup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
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
    print("COMPLETE CLEANUP - REMOVING ALL REFERENCES TO OLD TABLES")
    print("Making master_users the ONLY source of truth")
    print("=" * 80)

    # Get all files to update
    html_files = glob.glob('*.html')
    js_files = glob.glob('*.js')
    all_files = html_files + js_files

    # Exclude backup files
    all_files = [f for f in all_files
                 if not any(x in f for x in ['.backup', '.colfix', '.cleanup'])]

    updated_count = 0
    error_count = 0

    for file_path in all_files:
        updated, changes = fix_file(file_path)

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
    print(f"Cleanup complete!")
    print(f"  Files updated: {updated_count}")
    print(f"  Errors: {error_count}")
    print(f"  Files unchanged: {len(all_files) - updated_count - error_count}")
    print("=" * 80)

    print("\nBackup files created with .cleanup_* extension")
    print("\nNEXT STEPS:")
    print("1. Run remove_views.sql to drop any compatibility views")
    print("2. Test all functionality")
    print("3. Remove backup files: rm *.cleanup_*")

if __name__ == "__main__":
    main()