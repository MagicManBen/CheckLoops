#!/usr/bin/env python3
"""
Analyze the schema of tables to merge into master_users
"""
import json
import glob

# Load the most recent backup
backup_files = sorted(glob.glob("supabase_backup_*.json"))
if not backup_files:
    print("No backup found!")
    exit(1)

backup_file = backup_files[-1]
print(f"Analyzing backup: {backup_file}")
print("=" * 80)

with open(backup_file, 'r') as f:
    backup = json.load(f)

# Tables to merge into master_users
tables_to_merge = [
    'profiles',
    'kiosk_users',
    'staff_app_welcome',
    '1_staff_holiday_profiles',
    '3_staff_working_patterns',
    'staff_working_patterns',
    'working_patterns',
    'user_profiles_complete'
]

# Analyze each table's columns
all_columns = {}
for table_name in tables_to_merge:
    if table_name in backup['tables'] and not isinstance(backup['tables'][table_name], dict) or 'error' not in backup['tables'][table_name]:
        data = backup['tables'].get(table_name, [])
        if isinstance(data, list) and data:
            columns = set(data[0].keys())
            all_columns[table_name] = columns
            print(f"\n{table_name} ({len(data)} rows):")
            for col in sorted(columns):
                # Get sample value
                sample = data[0].get(col, None)
                sample_type = type(sample).__name__
                print(f"  - {col}: {sample_type}")

# Find all unique columns for master table
print("\n" + "=" * 80)
print("MASTER TABLE SCHEMA DESIGN")
print("=" * 80)

unique_columns = set()
for table, cols in all_columns.items():
    unique_columns.update(cols)

# Categorize columns
user_id_columns = {col for col in unique_columns if 'user_id' in col.lower() or col == 'id'}
profile_columns = {col for col in unique_columns if any(x in col.lower() for x in ['name', 'email', 'avatar', 'nickname', 'role'])}
holiday_columns = {col for col in unique_columns if 'holiday' in col.lower() or 'annual' in col.lower()}
working_columns = {col for col in unique_columns if any(x in col.lower() for x in ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'hours', 'sessions'])}
site_columns = {col for col in unique_columns if 'site' in col.lower() or 'team' in col.lower()}
timestamp_columns = {col for col in unique_columns if 'created' in col.lower() or 'updated' in col.lower() or '_at' in col}
other_columns = unique_columns - user_id_columns - profile_columns - holiday_columns - working_columns - site_columns - timestamp_columns

print("\nUser ID columns:")
for col in sorted(user_id_columns):
    print(f"  - {col}")

print("\nProfile columns:")
for col in sorted(profile_columns):
    print(f"  - {col}")

print("\nHoliday columns:")
for col in sorted(holiday_columns):
    print(f"  - {col}")

print("\nWorking pattern columns:")
for col in sorted(working_columns):
    print(f"  - {col}")

print("\nSite/Team columns:")
for col in sorted(site_columns):
    print(f"  - {col}")

print("\nTimestamp columns:")
for col in sorted(timestamp_columns):
    print(f"  - {col}")

print("\nOther columns:")
for col in sorted(other_columns):
    print(f"  - {col}")

print(f"\nTotal unique columns: {len(unique_columns)}")