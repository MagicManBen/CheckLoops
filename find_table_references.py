#!/usr/bin/env python3
"""
Find all references to tables that need to be updated to use master_users
"""
import re
import glob

# Tables to replace with master_users
TABLES_TO_REPLACE = [
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

# Find all files
html_files = glob.glob('*.html')
js_files = glob.glob('*.js')
all_files = html_files + js_files

# Track all references
references = {}

for file_path in all_files:
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

            file_refs = []
            for table in TABLES_TO_REPLACE:
                # Find .from('table_name') patterns
                pattern = rf"\.from\(['\"]({re.escape(table)})[\"']\)"
                matches = re.findall(pattern, content)
                if matches:
                    file_refs.extend([(table, 'from')] * len(matches))

                # Find references in SQL queries
                sql_pattern = rf"FROM\s+public\.{re.escape(table)}\b"
                sql_matches = re.findall(sql_pattern, content, re.IGNORECASE)
                if sql_matches:
                    file_refs.extend([(table, 'sql')] * len(sql_matches))

                # Find update/upsert patterns
                update_pattern = rf"\.(update|upsert)\([^)]*\)\.eq\([^)]*\).*{re.escape(table)}"
                update_matches = re.findall(update_pattern, content)
                if update_matches:
                    file_refs.extend([(table, 'update')] * len(update_matches))

            if file_refs:
                references[file_path] = file_refs
    except Exception as e:
        print(f"Error processing {file_path}: {e}")

# Generate report
print("=" * 80)
print("TABLE REFERENCES TO UPDATE")
print("=" * 80)

total_updates = 0
for file_path, refs in sorted(references.items()):
    print(f"\n{file_path}:")
    table_counts = {}
    for table, ref_type in refs:
        key = f"{table} ({ref_type})"
        table_counts[key] = table_counts.get(key, 0) + 1

    for key, count in sorted(table_counts.items()):
        print(f"  - {key}: {count} reference(s)")
        total_updates += count

print("\n" + "=" * 80)
print(f"Total files to update: {len(references)}")
print(f"Total references to update: {total_updates}")
print("=" * 80)

# List critical files
critical_files = ['staff.html', 'admin-dashboard.html', 'my-holidays.html', 'indexIpad.html', 'index.html', 'staff-welcome.html']
print("\nCRITICAL FILES:")
for cf in critical_files:
    if cf in references:
        print(f"  ✓ {cf} - {len(references[cf])} references")
    else:
        print(f"  - {cf} - No references found")