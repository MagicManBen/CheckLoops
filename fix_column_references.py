#!/usr/bin/env python3
"""
Fix column references in master_users queries
master_users uses auth_user_id, not user_id
"""
import re
import glob
import os
from datetime import datetime

def fix_master_users_queries(file_path):
    """Fix queries to master_users to use correct column names"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content
        changes_made = []

        # Fix .eq('user_id', ...) when querying master_users
        # Pattern: .from('master_users')...eq('user_id', ...)
        pattern = r"(\.from\(['\"]master_users['\"\)].*?)\.eq\(['\"]user_id['\"],([^)]+)\)"
        def replacement(match):
            prefix = match.group(1)
            user_value = match.group(2)
            return f"{prefix}.eq('auth_user_id',{user_value})"

        new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
        if new_content != content:
            matches = len(re.findall(pattern, content, flags=re.DOTALL))
            changes_made.append(f"  - Fixed .eq('user_id', ...) → .eq('auth_user_id', ...): {matches} replacements")
            content = new_content

        # Fix other potential user_id references in master_users context
        # Look for patterns like: supabase.from('master_users').select('user_id')
        select_pattern = r"(\.from\(['\"]master_users['\"\)].*?\.select\(['\"][^'\"]*?)user_id([^'\"]*['\"])"
        select_replacement = r"\1auth_user_id\2"

        new_content = re.sub(select_pattern, select_replacement, content, flags=re.DOTALL)
        if new_content != content:
            matches = len(re.findall(select_pattern, content, flags=re.DOTALL))
            changes_made.append(f"  - Fixed select('...user_id...') → select('...auth_user_id...'): {matches} replacements")
            content = new_content

        # Fix update queries that set user_id on master_users
        update_pattern = r"(\.from\(['\"]master_users['\"\)].*?\.update\(\{[^}]*?)user_id(\s*:)"
        update_replacement = r"\1auth_user_id\2"

        new_content = re.sub(update_pattern, update_replacement, content, flags=re.DOTALL)
        if new_content != content:
            matches = len(re.findall(update_pattern, content, flags=re.DOTALL))
            changes_made.append(f"  - Fixed update({{...user_id:...}}) → update({{...auth_user_id:...}}): {matches} replacements")
            content = new_content

        # Write back if changes were made
        if content != original_content:
            # Create backup
            backup_path = f"{file_path}.colfix_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
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
    print("FIXING COLUMN REFERENCES FOR master_users TABLE")
    print("=" * 80)
    print("Converting user_id → auth_user_id for master_users queries")

    # Get all files that might query master_users
    html_files = glob.glob('*.html')
    js_files = glob.glob('*.js')
    all_files = html_files + js_files

    # Exclude backup files
    all_files = [f for f in all_files if not '.backup_' in f and not '.colfix_' in f]

    updated_count = 0
    error_count = 0

    for file_path in all_files:
        # Only process files that contain master_users references
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                if 'master_users' not in content:
                    continue
        except:
            continue

        updated, changes = fix_master_users_queries(file_path)

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
    print(f"Column reference fix complete!")
    print(f"  Files updated: {updated_count}")
    print(f"  Errors: {error_count}")
    print(f"  Files unchanged: {len([f for f in all_files if 'master_users' in open(f, 'r').read()]) - updated_count - error_count}")
    print("=" * 80)

    if updated_count > 0:
        print("\nBackup files created with .colfix_* extension")
        print("Now run: migrate_to_master_fixed.sql in Supabase SQL Editor")

if __name__ == "__main__":
    main()