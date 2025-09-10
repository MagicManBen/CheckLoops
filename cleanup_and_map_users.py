#!/usr/bin/env python3

import pandas as pd
import re

# Read and clean the data properly
print("=== CLEANING AND MAPPING USER DATA ===")

# Re-read the original CSV and clean it properly
df = pd.read_csv('/Users/benhoward/Desktop/CheckLoop/CheckLoops/Sheet1.csv')

# Extract clean staff data
staff_rows = []
seen_names = set()

for _, row in df.iterrows():
    name = row.get('Name', '')
    role = row.get('Role', '')
    entitlement = row.get('Entitlement', '')
    
    if pd.notna(name) and pd.notna(role) and name != 'Name' and role != 'Role':
        # Filter out rows where role looks like a date/time
        if not re.match(r'^\d{2}/\d{2}/\d{4}', str(role)):
            # Check if role is a valid role (not a timestamp)
            valid_roles = ['GP', 'Nurse', 'Admin', 'Reception', 'Manager', 'Pharmacist', 'Health Care Assistant', 'GP Assistant']
            if any(valid_role.lower() in str(role).lower() for valid_role in valid_roles) or str(role) in valid_roles:
                if name not in seen_names:
                    staff_rows.append({
                        'Name': name,
                        'Role': role,
                        'Entitlement': entitlement
                    })
                    seen_names.add(name)

staff_df = pd.DataFrame(staff_rows)
print(f"Found {len(staff_df)} clean staff records")

# Show role breakdown
print("\nRole breakdown:")
for role, count in staff_df['Role'].value_counts().items():
    print(f"  {role}: {count}")

# Get existing users from the database info
print("\nExtracting existing users from database...")
existing_users = [
    {'full_name': 'Benjamin Howard', 'user_id': '5e364f1d-2d4d-49c7-89c9-57de785c6cf5', 'role': 'staff'},
    {'full_name': 'Ben Howard', 'user_id': '55f1b4e6-01f4-452d-8d6c-617fe7794873', 'role': 'admin'},
    {'full_name': 'Tom Donlan', 'user_id': '68a1a111-ac7c-44a3-8fd3-8c37ff07e0a2', 'role': 'admin'}
]

# Create user mapping with better matching
user_mapping = []

for _, staff in staff_df.iterrows():
    name = staff['Name']
    role = staff['Role'] 
    entitlement = staff['Entitlement']
    
    # Try to match with existing users
    user_id = ''
    needs_creation = 'YES'
    
    for existing in existing_users:
        # Try exact match first
        if name == existing['full_name']:
            user_id = existing['user_id']
            needs_creation = 'NO'
            break
        # Try partial match (first name + last name)
        elif name.lower() in existing['full_name'].lower() or existing['full_name'].lower() in name.lower():
            user_id = existing['user_id']
            needs_creation = 'MAYBE - CHECK MANUALLY'
            break
    
    # Generate email
    email = name.lower().replace(' ', '.').replace("'", '').replace('-', '.') + '@stoke.nhs.uk'
    
    user_mapping.append({
        'staff_name': name,
        'user_id': user_id,
        'email': email,
        'role': role,
        'needs_user_creation': needs_creation,
        'entitlement': str(entitlement).replace(',', ';'),
        'has_backdated_holidays': 'NO'  # Will update this below
    })

# Check which staff have backdated holidays
backdated = pd.read_csv('/Users/benhoward/Desktop/CheckLoop/CheckLoops/backdated_holidays.csv')
staff_with_holidays = set(backdated['StaffName'].unique())

for mapping in user_mapping:
    if mapping['staff_name'] in staff_with_holidays:
        mapping['has_backdated_holidays'] = 'YES'

# Save the mapping
mapping_df = pd.DataFrame(user_mapping)
mapping_df.to_csv('/Users/benhoward/Desktop/CheckLoop/CheckLoops/clean_staff_mapping.csv', index=False)

print(f"\nCreated mapping for {len(mapping_df)} staff members")
print(f"Existing users found: {len([m for m in user_mapping if m['needs_user_creation'] == 'NO'])}")
print(f"Need manual check: {len([m for m in user_mapping if m['needs_user_creation'] == 'MAYBE - CHECK MANUALLY'])}")
print(f"Need new users: {len([m for m in user_mapping if m['needs_user_creation'] == 'YES'])}")
print(f"Staff with backdated holidays: {len([m for m in user_mapping if m['has_backdated_holidays'] == 'YES'])}")

# Create a Supabase connection test script
with open('/Users/benhoward/Desktop/CheckLoop/CheckLoops/test_supabase_connection.py', 'w') as f:
    f.write('''#!/usr/bin/env python3

import subprocess
import os

def test_supabase_cli():
    """Test Supabase CLI connection and get current database info"""
    
    print("=== TESTING SUPABASE CONNECTION ===")
    
    try:
        # Check if we're in a Supabase project
        result = subprocess.run(['supabase', 'status'], 
                               capture_output=True, text=True, cwd=os.getcwd())
        
        if result.returncode == 0:
            print("✓ Supabase project detected")
            print(result.stdout)
        else:
            print("❌ Not in a Supabase project or CLI not configured")
            print(result.stderr)
            
            # Try to get help
            help_result = subprocess.run(['supabase', '--help'], 
                                       capture_output=True, text=True)
            if help_result.returncode == 0:
                print("\\nSupabase CLI is available. You may need to:")
                print("1. cd to your Supabase project directory")
                print("2. Run 'supabase login'")
                print("3. Run 'supabase link --project-ref YOUR_PROJECT_REF'")
            
    except FileNotFoundError:
        print("❌ Supabase CLI not found")
        print("Install with: npm install -g supabase")
    
    # Test database connection if possible
    print("\\n=== TESTING DATABASE CONNECTION ===")
    try:
        db_result = subprocess.run(['supabase', 'db', 'remote', 'version'],
                                 capture_output=True, text=True, cwd=os.getcwd())
        
        if db_result.returncode == 0:
            print("✓ Database connection successful")
            print(db_result.stdout)
        else:
            print("❌ Database connection failed")
            print(db_result.stderr)
            
    except Exception as e:
        print(f"❌ Database connection test failed: {e}")

if __name__ == "__main__":
    test_supabase_cli()
''')

print("\nFiles created:")
print("- clean_staff_mapping.csv (cleaned user mapping)")
print("- test_supabase_connection.py (connection test script)")

print("\nNext steps:")
print("1. Review clean_staff_mapping.csv and update user_ids for existing users")
print("2. Run: python3 test_supabase_connection.py")
print("3. Create missing users via Supabase Dashboard")
print("4. Update the SQL import scripts with real user_ids")
print("5. Execute the import")