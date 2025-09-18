#!/usr/bin/env python3

import pandas as pd
import uuid
import numpy as np
from datetime import datetime

# Read the separated data
backdated = pd.read_csv('/Users/benhoward/Desktop/CheckLoop/CheckLoops/backdated_holidays.csv')
staff_data = pd.read_csv('/Users/benhoward/Desktop/CheckLoop/CheckLoops/staff_details.csv')

print('=== CREATING SQL IMPORT SCRIPTS ===')

# Clean staff data
staff_data = staff_data.dropna(subset=['Name', 'Role'])
staff_data = staff_data[staff_data['Name'] != 'Name']
staff_data = staff_data[staff_data['Role'] != 'Role']
staff_data = staff_data.drop_duplicates(subset=['Name'])

print(f'Processing {len(staff_data)} unique staff members')

# Process staff entitlements 
staff_entitlements_sql = []

for _, row in staff_data.iterrows():
    name = str(row['Name']).strip()
    role = str(row['Role']).strip()
    entitlement = str(row['Entitlement']).strip()
    
    if name == 'nan' or role == 'nan':
        continue
    
    # Parse entitlement
    annual_hours = '00:00:00'
    annual_sessions = 0
    
    if 'days' in entitlement:
        parts = entitlement.split(', ')
        if len(parts) == 2:
            annual_hours = parts[1]
    elif entitlement.isdigit():
        annual_sessions = int(entitlement)
    elif entitlement.replace('.', '').isdigit():
        annual_sessions = int(float(entitlement))
    
    user_uuid = str(uuid.uuid4())
    
    sql_entry = f"""
-- Holiday entitlement for {name} ({role})
INSERT INTO holiday_entitlements (
  user_id, site_id, year, annual_hours, annual_sessions, 
  annual_education_sessions, carried_over_hours, carried_over_sessions, 
  carried_over_education_sessions, created_at, updated_at
) VALUES (
  '{user_uuid}', -- TODO: Replace with actual user_id for {name}
  2, -- Default site_id
  2025,
  '{annual_hours}',
  {annual_sessions},
  0, 0, 0, 0,
  NOW(),
  NOW()
);"""
    
    staff_entitlements_sql.append(sql_entry)

print(f'Generated {len(staff_entitlements_sql)} staff entitlement records')

# Write SQL file
with open('/Users/benhoward/Desktop/CheckLoop/CheckLoops/import_staff_entitlements.sql', 'w') as f:
    f.write('-- Staff Holiday Entitlements Import\n')
    f.write('-- Generated from HolidayTransfer.xlsx\n\n')
    f.write('-- NOTE: Replace placeholder UUIDs with actual user_ids from your auth.users table\n')
    f.write('-- Run this after creating missing users and updating UUIDs\n\n')
    f.write('\n'.join(staff_entitlements_sql))

# Process backdated holidays
print('\nProcessing backdated holidays...')
backdated_sql = []

# Group by staff to create holiday requests
staff_holidays = backdated.groupby('StaffName')

for staff_name, holidays in staff_holidays:
    request_uuid = str(uuid.uuid4())
    user_uuid = str(uuid.uuid4())  # Placeholder
    
    # Create holiday request first
    backdated_sql.append(f"""
-- Holiday request for {staff_name}
INSERT INTO holiday_requests (
  id, user_id, site_id, status, start_date, end_date, created_at, updated_at, approved_at
) VALUES (
  {len(backdated_sql) + 1}, -- Sequential ID
  '{user_uuid}', -- TODO: Replace with actual user_id for {staff_name}
  2, -- Default site_id
  'approved', -- These are already approved holidays
  '{holidays.iloc[0]['Date']}', -- Start date
  '{holidays.iloc[-1]['Date']}', -- End date
  NOW(),
  NOW(),
  NOW()
);""")
    
    # Add individual holiday days
    for _, holiday in holidays.iterrows():
        date = holiday['Date']
        value = str(holiday['Value'])
        
        # Determine if it's hours or sessions
        if ':' in value:
            hours_requested = value
            sessions_requested = 0
        else:
            hours_requested = '00:00:00'
            sessions_requested = int(float(value)) if value != 'nan' else 0
        
        backdated_sql.append(f"""
-- Holiday day for {staff_name} on {date}
INSERT INTO holiday_request_days (
  holiday_request_id, date, hours_requested, sessions_requested, created_at, updated_at
) VALUES (
  {len(backdated_sql)}, -- References the request above
  '{date}',
  '{hours_requested}',
  {sessions_requested},
  NOW(),
  NOW()
);""")

# Write backdated holidays SQL
with open('/Users/benhoward/Desktop/CheckLoop/CheckLoops/import_backdated_holidays.sql', 'w') as f:
    f.write('-- Backdated Holidays Import\n')
    f.write('-- Generated from HolidayTransfer.xlsx\n\n')
    f.write('-- NOTE: Replace placeholder UUIDs with actual user_ids\n')
    f.write('-- These holidays are marked as approved\n\n')
    f.write('\n'.join(backdated_sql))

# Create mapping file for manual user_id assignment
staff_names = [name for name in staff_data['Name'].unique() if str(name) != 'nan']
with open('/Users/benhoward/Desktop/CheckLoop/CheckLoops/staff_name_mapping.csv', 'w') as f:
    f.write('staff_name,user_id,email,role,needs_user_creation,entitlement,has_backdated_holidays\n')
    for name in staff_names:
        staff_row = staff_data[staff_data['Name'] == name].iloc[0]
        role = staff_row['Role']
        entitlement = str(staff_row['Entitlement']).replace(',', ';')
        email = name.lower().replace(' ', '.').replace("'", '') + '@stoke.nhs.uk'
        has_holidays = 'YES' if name in backdated['StaffName'].values else 'NO'
        f.write(f'"{name}",,"{email}","{role}",YES,"{entitlement}",{has_holidays}\n')

# Create a user creation script template
with open('/Users/benhoward/Desktop/CheckLoop/CheckLoops/create_missing_users.sql', 'w') as f:
    f.write('-- User Creation Script Template\n')
    f.write('-- NOTE: You cannot directly insert into auth.users via SQL\n')
    f.write('-- Use Supabase Dashboard or Auth API to create these users\n\n')
    
    f.write('-- Users that need to be created:\n')
    for name in staff_names:
        staff_row = staff_data[staff_data['Name'] == name].iloc[0]
        role = staff_row['Role']
        email = name.lower().replace(' ', '.').replace("'", '') + '@stoke.nhs.uk'
        
        f.write(f'-- {name} ({role}): {email}\n')
    
    f.write(f'\n-- Total users to create: {len(staff_names)}\n')

print('\nFiles created:')
print('- import_staff_entitlements.sql')
print('- import_backdated_holidays.sql')
print('- staff_name_mapping.csv')
print('- create_missing_users.sql')

print(f'\nSummary:')
print(f'- {len(staff_names)} unique staff members')
print(f'- {len(backdated)} backdated holiday records')
print(f'- Staff with backdated holidays: {backdated["StaffName"].nunique()}')
print('\nRole breakdown:')
for role, count in staff_data['Role'].value_counts().items():
    print(f'  {role}: {count}')

print('\nNext steps:')
print('1. Create missing users in Supabase (use Dashboard or Auth API)')
print('2. Update staff_name_mapping.csv with actual user_ids')
print('3. Run a script to replace UUIDs in SQL files with actual user_ids')
print('4. Execute the import scripts via Supabase CLI')