#!/usr/bin/env python3
"""
Verify that the cleanup is complete and master_users is the only source of truth
"""
import re
import glob
import os

def check_files():
    """Check all files for any remaining references to old tables"""

    # Tables that should NOT be referenced anymore (except master_users)
    forbidden_tables = [
        'profiles',
        'kiosk_users',
        'staff_app_welcome',
        'user_profiles_complete',
        'onboarding',
        'staff_holiday_profiles',
        'staff_working_patterns',
        'working_patterns',
        'holiday_entitlements',
        'user_permissions',
        'user_roles'
    ]

    # Get all files to check
    html_files = glob.glob('*.html')
    js_files = glob.glob('*.js')
    all_files = html_files + js_files

    # Exclude backup files
    all_files = [f for f in all_files
                 if not any(x in f for x in ['.backup', '.colfix', '.cleanup'])]

    issues_found = {}
    clean_files = 0
    total_files = 0

    for file_path in all_files:
        total_files += 1
        file_issues = []

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            for table in forbidden_tables:
                # Check for .from('table') patterns
                pattern = rf"\.from\(['\"]({re.escape(table)})[\"']\)"
                matches = re.findall(pattern, content)
                if matches:
                    file_issues.append(f"  ❌ Found .from('{table}'): {len(matches)} instances")

                # Check for SQL patterns
                sql_pattern = rf"FROM\s+public\.{re.escape(table)}\b"
                sql_matches = re.findall(sql_pattern, content, re.IGNORECASE)
                if sql_matches:
                    file_issues.append(f"  ❌ Found FROM public.{table}: {len(sql_matches)} instances")

                # Check for INSERT INTO patterns
                insert_pattern = rf"INSERT\s+INTO\s+public\.{re.escape(table)}\b"
                insert_matches = re.findall(insert_pattern, content, re.IGNORECASE)
                if insert_matches:
                    file_issues.append(f"  ❌ Found INSERT INTO public.{table}: {len(insert_matches)} instances")

            if file_issues:
                issues_found[file_path] = file_issues
            else:
                clean_files += 1

        except Exception as e:
            print(f"Error reading {file_path}: {e}")

    return issues_found, clean_files, total_files

def check_master_users_usage():
    """Check that master_users is being used correctly"""

    # Get all files
    html_files = glob.glob('*.html')
    js_files = glob.glob('*.js')
    all_files = html_files + js_files

    # Exclude backup files
    all_files = [f for f in all_files
                 if not any(x in f for x in ['.backup', '.colfix', '.cleanup'])]

    master_usage = []
    auth_user_id_usage = []

    for file_path in all_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Count master_users references
            pattern = r"\.from\(['\"]master_users[\"']\)"
            matches = re.findall(pattern, content)
            if matches:
                master_usage.append((file_path, len(matches)))

            # Check for auth_user_id usage (correct column name)
            auth_pattern = r"\.eq\(['\"]auth_user_id[\"']"
            auth_matches = re.findall(auth_pattern, content)
            if auth_matches:
                auth_user_id_usage.append((file_path, len(auth_matches)))

        except Exception as e:
            continue

    return master_usage, auth_user_id_usage

def main():
    print("=" * 80)
    print("VERIFICATION REPORT - Master Users as Single Source of Truth")
    print("=" * 80)

    # Check for forbidden table references
    issues, clean, total = check_files()

    print("\n1. FORBIDDEN TABLE REFERENCES CHECK")
    print("-" * 80)

    if not issues:
        print("✅ SUCCESS: No references to old tables found!")
        print(f"   All {clean}/{total} files are clean")
    else:
        print(f"⚠️  WARNING: Found {len(issues)} files with old table references:")
        for file_path, file_issues in issues.items():
            print(f"\n{file_path}:")
            for issue in file_issues:
                print(issue)

    # Check master_users usage
    print("\n2. MASTER_USERS TABLE USAGE")
    print("-" * 80)

    master_usage, auth_usage = check_master_users_usage()

    if master_usage:
        print(f"✅ Found master_users references in {len(master_usage)} files")
        print("\nTop 10 files using master_users:")
        master_usage.sort(key=lambda x: x[1], reverse=True)
        for file_path, count in master_usage[:10]:
            print(f"  - {file_path}: {count} references")

        total_refs = sum(count for _, count in master_usage)
        print(f"\nTotal master_users references: {total_refs}")
    else:
        print("⚠️  WARNING: No master_users references found!")

    print("\n3. COLUMN NAME USAGE")
    print("-" * 80)

    if auth_usage:
        print(f"✅ Found auth_user_id usage in {len(auth_usage)} files (correct column name)")
        total_auth = sum(count for _, count in auth_usage)
        print(f"   Total auth_user_id references: {total_auth}")
    else:
        print("⚠️  No auth_user_id references found")

    # Summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)

    if not issues and master_usage:
        print("✅ Cleanup appears COMPLETE!")
        print("   - No old table references remaining")
        print(f"   - master_users is used in {len(master_usage)} files")
        print(f"   - Total of {sum(c for _, c in master_usage)} references to master_users")
        print("\n📋 Next steps:")
        print("   1. Run complete_cleanup.sql in Supabase SQL Editor")
        print("   2. Test all critical functionality:")
        print("      - User login/logout")
        print("      - Profile updates")
        print("      - Admin dashboard")
        print("      - Staff welcome/onboarding")
        print("      - Holiday requests")
        print("      - Training records")
        print("      - Quiz submission")
        print("   3. Remove backup files: rm *.backup_* *.colfix_* *.cleanup_*")
    else:
        print("⚠️  Issues found - review the warnings above")

    print("=" * 80)

if __name__ == "__main__":
    main()