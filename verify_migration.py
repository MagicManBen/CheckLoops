#!/usr/bin/env python3
"""
Verify that all table references have been updated to master_users
"""
import re
import glob

# Tables that should no longer be referenced
OLD_TABLES = [
    'profiles',
    'kiosk_users',
    'staff_app_welcome',
    '1_staff_holiday_profiles',
    'staff_holiday_profiles',
    '3_staff_working_patterns',
    'staff_working_patterns',
    'working_patterns',
    'user_profiles_complete',
    'onboarding',
    'holiday_entitlements',
    'user_permissions',
    'user_roles'
]

def check_files():
    """Check all files for remaining references to old tables"""
    html_files = glob.glob('*.html')
    js_files = glob.glob('*.js')
    all_files = html_files + js_files

    # Exclude backup files
    all_files = [f for f in all_files if not f.endswith('.backup')]

    remaining_references = {}
    clean_files = 0
    total_files = 0

    for file_path in all_files:
        # Skip backup files
        if '.backup_' in file_path:
            continue

        total_files += 1

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            file_issues = []

            for table in OLD_TABLES:
                # Check for .from('table') patterns
                pattern = rf"\.from\(['\"]({re.escape(table)})[\"']\)"
                matches = re.findall(pattern, content)
                if matches:
                    file_issues.append(f"  ❌ Found .from('{table}'): {len(matches)} instances")

                # Check for SQL FROM patterns
                sql_pattern = rf"FROM\s+public\.{re.escape(table)}\b"
                sql_matches = re.findall(sql_pattern, content, re.IGNORECASE)
                if sql_matches:
                    file_issues.append(f"  ❌ Found FROM public.{table}: {len(sql_matches)} instances")

            if file_issues:
                remaining_references[file_path] = file_issues
            else:
                clean_files += 1

        except Exception as e:
            print(f"Error reading {file_path}: {e}")

    return remaining_references, clean_files, total_files

def verify_master_table_usage():
    """Verify that master_users is being used correctly"""
    html_files = glob.glob('*.html')
    js_files = glob.glob('*.js')
    all_files = html_files + js_files

    # Exclude backup files
    all_files = [f for f in all_files if not '.backup_' in f]

    master_usage = []

    for file_path in all_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Count master_users references
            pattern = r"\.from\(['\"]master_users[\"']\)"
            matches = re.findall(pattern, content)

            if matches:
                master_usage.append((file_path, len(matches)))

        except Exception as e:
            continue

    return master_usage

def main():
    print("=" * 80)
    print("MIGRATION VERIFICATION REPORT")
    print("=" * 80)

    # Check for remaining old table references
    remaining, clean, total = check_files()

    print("\n1. OLD TABLE REFERENCES CHECK")
    print("-" * 80)

    if not remaining:
        print("✅ SUCCESS: No references to old tables found!")
        print(f"   All {clean}/{total} files are clean")
    else:
        print(f"⚠️  WARNING: Found {len(remaining)} files with old table references:")
        for file_path, issues in remaining.items():
            print(f"\n{file_path}:")
            for issue in issues:
                print(issue)

    # Verify master_users usage
    print("\n2. MASTER_USERS TABLE USAGE")
    print("-" * 80)

    master_usage = verify_master_table_usage()
    master_usage.sort(key=lambda x: x[1], reverse=True)

    if master_usage:
        print(f"✅ Found master_users references in {len(master_usage)} files:")
        print("\nTop 10 files using master_users:")
        for file_path, count in master_usage[:10]:
            print(f"  - {file_path}: {count} references")

        total_refs = sum(count for _, count in master_usage)
        print(f"\nTotal master_users references: {total_refs}")
    else:
        print("⚠️  WARNING: No master_users references found!")

    # Summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)

    if not remaining:
        print("✅ Migration appears successful!")
        print("   - No old table references remaining")
        print(f"   - master_users is used in {len(master_usage)} files")
        print(f"   - Total of {sum(c for _, c in master_usage)} references to master_users")
        print("\n📋 Next steps:")
        print("   1. Run migrate_to_master.sql in Supabase SQL Editor")
        print("   2. Test the application thoroughly")
        print("   3. Run drop_redundant_tables.sql after verification")
        print("   4. Remove backup files: rm *.backup_*")
    else:
        print("⚠️  Some files still have old table references")
        print("   Please review and update these files manually")

    print("=" * 80)

if __name__ == "__main__":
    main()