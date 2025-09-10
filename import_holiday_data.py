import pandas as pd
import json
from datetime import datetime, timedelta
import re

# Read the Excel file
excel_file = 'HolidayTransfer.xlsx'
df = pd.read_excel(excel_file)

# Separate the data into holiday requests and staff information
holiday_requests = df[['Date', 'StaffName', 'Value']].dropna(subset=['Date'])
staff_info = df[['Name', 'Role', 'Entitlement', 'Dr Monday Hours', 'Dr Tuesday Hours', 
                  'Dr Wednesday Hours', 'Dr Thursday Hours', 'Dr Friday Hours',
                  'Staff Monday Hours (HH:MM)', 'Staff Tuesday Hours (HH:MM)', 
                  'Staff Wednesday Hours (HH:MM)', 'Staff Thursday Hours (HH:MM)', 
                  'Staff Friday Hours (HH:MM)']].dropna(subset=['Name'])

# Filter out invalid rows from staff_info (where Role contains dates or 'Role' itself)
valid_roles = ['Nurse', 'GP', 'Manager', 'Admin', 'Reception', 'Pharmacist', 
                'Health Care Assistant', 'GP Assistant']
staff_info = staff_info[staff_info['Role'].isin(valid_roles)]

print("Generating SQL INSERT statements...")
print("=" * 60)

# Generate SQL file
with open('import_holiday_data.sql', 'w') as f:
    f.write("-- Import Holiday Data from Excel\n")
    f.write("-- Generated on: " + datetime.now().strftime("%Y-%m-%d %H:%M:%S") + "\n\n")
    
    # 1. Insert staff profiles
    f.write("-- Insert Staff Profiles\n")
    staff_profiles = {}
    profile_id = 1
    
    for _, row in staff_info.iterrows():
        name = row['Name']
        role = row['Role']
        is_gp = role == 'GP'
        
        # Check if this is a GP based on having Dr hours
        has_dr_hours = any([
            pd.notna(row['Dr Monday Hours']),
            pd.notna(row['Dr Tuesday Hours']),
            pd.notna(row['Dr Wednesday Hours']),
            pd.notna(row['Dr Thursday Hours']),
            pd.notna(row['Dr Friday Hours'])
        ])
        
        if has_dr_hours:
            is_gp = True
        
        if name not in staff_profiles:
            staff_profiles[name] = profile_id
            f.write(f"INSERT INTO staff_holiday_profiles (id, full_name, role, is_gp) VALUES ")
            f.write(f"({profile_id}, '{name}', '{role}', {str(is_gp).lower()}) ")
            f.write(f"ON CONFLICT (full_name) DO UPDATE SET role = EXCLUDED.role, is_gp = EXCLUDED.is_gp;\n")
            profile_id += 1
    
    # Add staff from holiday requests who aren't in staff_info
    for name in holiday_requests['StaffName'].unique():
        if name not in staff_profiles:
            staff_profiles[name] = profile_id
            f.write(f"INSERT INTO staff_holiday_profiles (id, full_name, role, is_gp) VALUES ")
            f.write(f"({profile_id}, '{name}', 'Unknown', false) ")
            f.write(f"ON CONFLICT (full_name) DO NOTHING;\n")
            profile_id += 1
    
    f.write("\n-- Reset sequence\n")
    f.write(f"SELECT setval('staff_holiday_profiles_id_seq', {profile_id}, true);\n\n")
    
    # 2. Insert working patterns
    f.write("-- Insert Working Patterns\n")
    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    
    for _, row in staff_info.iterrows():
        name = row['Name']
        if name not in staff_profiles:
            continue
            
        staff_id = staff_profiles[name]
        
        # Check if GP (has Dr hours)
        is_gp = False
        for day in days:
            dr_col = f'Dr {day} Hours'
            if pd.notna(row[dr_col]):
                is_gp = True
                # For GPs, insert sessions (1 or 2)
                try:
                    sessions = int(row[dr_col]) if isinstance(row[dr_col], (int, float)) else 1
                    f.write(f"INSERT INTO staff_working_patterns (staff_profile_id, day_of_week, sessions_worked) VALUES ")
                    f.write(f"({staff_id}, '{day}', {sessions}) ON CONFLICT DO NOTHING;\n")
                except:
                    pass
        
        # For regular staff, insert hours
        if not is_gp:
            for day in days:
                staff_col = f'Staff {day} Hours (HH:MM)'
                if pd.notna(row[staff_col]):
                    try:
                        # Convert time to interval
                        if isinstance(row[staff_col], str):
                            time_str = row[staff_col]
                        else:
                            time_str = str(row[staff_col])
                        
                        # Parse time string (HH:MM:SS or HH:MM)
                        if ':' in time_str:
                            parts = time_str.split(':')
                            hours = int(parts[0]) if parts[0] else 0
                            minutes = int(parts[1]) if len(parts) > 1 and parts[1] else 0
                            interval_str = f"{hours} hours {minutes} minutes"
                        else:
                            continue
                            
                        f.write(f"INSERT INTO staff_working_patterns (staff_profile_id, day_of_week, hours_worked) VALUES ")
                        f.write(f"({staff_id}, '{day}', INTERVAL '{interval_str}') ON CONFLICT DO NOTHING;\n")
                    except Exception as e:
                        print(f"Error processing hours for {name} on {day}: {e}")
    
    f.write("\n")
    
    # 3. Insert entitlements
    f.write("-- Insert Entitlements\n")
    for _, row in staff_info.iterrows():
        name = row['Name']
        if name not in staff_profiles:
            continue
            
        staff_id = staff_profiles[name]
        entitlement = row['Entitlement']
        
        if pd.notna(entitlement):
            # Check if GP (they use sessions)
            is_gp = row['Role'] == 'GP' or any([
                pd.notna(row[f'Dr {day} Hours']) for day in days
            ])
            
            if is_gp:
                # For GPs, store as sessions
                try:
                    sessions = int(entitlement) if isinstance(entitlement, (int, float)) else 44
                    f.write(f"INSERT INTO holiday_entitlements (staff_profile_id, year, annual_sessions, entitlement_sessions) VALUES ")
                    f.write(f"({staff_id}, 2025, {sessions}, {sessions}) ON CONFLICT DO NOTHING;\n")
                except:
                    pass
            else:
                # For regular staff, convert to hours
                try:
                    if isinstance(entitlement, pd.Timedelta):
                        total_seconds = entitlement.total_seconds()
                        hours = int(total_seconds // 3600)
                        minutes = int((total_seconds % 3600) // 60)
                        decimal_hours = hours + minutes/60
                        interval_str = f"{hours} hours {minutes} minutes"
                        
                        f.write(f"INSERT INTO holiday_entitlements (staff_profile_id, year, annual_hours, entitlement_hours) VALUES ")
                        f.write(f"({staff_id}, 2025, {decimal_hours}, INTERVAL '{interval_str}') ON CONFLICT DO NOTHING;\n")
                except Exception as e:
                    print(f"Error processing entitlement for {name}: {e}")
    
    f.write("\n")
    
    # 4. Insert holiday bookings
    f.write("-- Insert Holiday Bookings\n")
    for _, row in holiday_requests.iterrows():
        name = row['StaffName']
        date = row['Date']
        value = row['Value']
        
        if name not in staff_profiles:
            continue
            
        staff_id = staff_profiles[name]
        date_str = pd.to_datetime(date).strftime('%Y-%m-%d')
        
        # Check if this is a GP
        is_gp = False
        if name in staff_info['Name'].values:
            staff_row = staff_info[staff_info['Name'] == name].iloc[0] if not staff_info[staff_info['Name'] == name].empty else None
            if staff_row is not None:
                is_gp = staff_row['Role'] == 'GP' or any([
                    pd.notna(staff_row[f'Dr {day} Hours']) for day in days
                ])
        
        if is_gp:
            # For GPs, value is sessions (1 or 2)
            try:
                sessions = int(value) if isinstance(value, (int, float)) else 1
                f.write(f"INSERT INTO holiday_bookings (staff_profile_id, booking_date, sessions_booked) VALUES ")
                f.write(f"({staff_id}, '{date_str}', {sessions});\n")
            except:
                f.write(f"INSERT INTO holiday_bookings (staff_profile_id, booking_date, sessions_booked) VALUES ")
                f.write(f"({staff_id}, '{date_str}', 1);\n")
        else:
            # For regular staff, value is hours
            try:
                if isinstance(value, str) and ':' in value:
                    parts = value.split(':')
                    hours = int(parts[0]) if parts[0] else 0
                    minutes = int(parts[1]) if len(parts) > 1 and parts[1] else 0
                    interval_str = f"{hours} hours {minutes} minutes"
                elif hasattr(value, 'hour'):  # datetime.time object
                    hours = value.hour
                    minutes = value.minute
                    interval_str = f"{hours} hours {minutes} minutes"
                else:
                    continue
                    
                f.write(f"INSERT INTO holiday_bookings (staff_profile_id, booking_date, hours_booked) VALUES ")
                f.write(f"({staff_id}, '{date_str}', INTERVAL '{interval_str}');\n")
            except Exception as e:
                print(f"Error processing booking for {name} on {date}: {e}")
    
    f.write("\n")
    
    # 5. Link existing users
    f.write("-- Link existing users to their profiles\n")
    existing_users = {
        'Ben Howard': 'magic@hotmail.com',  # Admin account
        'Tom Donlan': None,  # We'll need to get his email from the users table
        'Benjamin Howard': None  # Admin development user
    }
    
    for name, email in existing_users.items():
        if name in staff_profiles:
            staff_id = staff_profiles[name]
            if email:
                f.write(f"-- Link {name} to user account\n")
                f.write(f"INSERT INTO staff_profile_user_links (staff_profile_id, user_id)\n")
                f.write(f"SELECT {staff_id}, id FROM auth.users WHERE email = '{email}' ON CONFLICT DO NOTHING;\n")
            else:
                f.write(f"-- Link {name} to user account (by name)\n")
                f.write(f"INSERT INTO staff_profile_user_links (staff_profile_id, user_id)\n")
                f.write(f"SELECT {staff_id}, id FROM auth.users WHERE raw_user_meta_data->>'full_name' = '{name}' ON CONFLICT DO NOTHING;\n")
    
    f.write("\n-- Data import complete\n")

print(f"SQL script generated: import_holiday_data.sql")
print(f"Total staff profiles: {len(staff_profiles)}")
print(f"Total holiday bookings: {len(holiday_requests)}")
print("\nStaff profiles created for:")
for name in sorted(staff_profiles.keys()):
    print(f"  - {name}")