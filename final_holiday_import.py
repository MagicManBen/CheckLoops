#!/usr/bin/env python3

import pandas as pd
import subprocess
import uuid
import json
from datetime import datetime

def run_sql_query(query):
    """Execute SQL query via Supabase CLI"""
    try:
        result = subprocess.run([
            'supabase', 'db', 'remote', 'query', '--query', query
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            return result.stdout, None
        else:
            return None, result.stderr
    except Exception as e:
        return None, str(e)

def create_missing_users():
    """Instructions for creating missing users"""
    print("=== CREATING MISSING USERS ===")
    print("Since we cannot directly create auth.users via SQL, follow these steps:")
    print()
    print("1. Open your Supabase Dashboard: http://127.0.0.1:54323")
    print("2. Go to Authentication > Users")
    print("3. Create users for each staff member in clean_staff_mapping.csv where needs_user_creation = YES")
    print("4. Use the email addresses provided in the CSV")
    print("5. After creating users, note their user_ids and update the CSV file")
    print()
    print("Alternatively, you can use the Supabase Auth API to bulk create users.")
    return True

def import_staff_entitlements():
    """Import staff holiday entitlements"""
    print("\n=== IMPORTING STAFF ENTITLEMENTS ===")
    
    # Read the mapping file
    try:
        mapping_df = pd.read_csv('/Users/benhoward/Desktop/CheckLoop/CheckLoops/clean_staff_mapping.csv')
    except FileNotFoundError:
        print("❌ clean_staff_mapping.csv not found. Run cleanup_and_map_users.py first.")
        return False
    
    # Filter only staff with valid user_ids
    valid_users = mapping_df[mapping_df['user_id'].notna() & (mapping_df['user_id'] != '')]
    
    if len(valid_users) == 0:
        print("❌ No users with valid user_ids found. Please update clean_staff_mapping.csv first.")
        return False
    
    print(f"Found {len(valid_users)} users with valid user_ids")
    
    success_count = 0
    error_count = 0
    
    for _, user in valid_users.iterrows():
        name = user['staff_name']
        user_id = user['user_id']
        role = user['role']
        entitlement = user['entitlement']
        
        # Parse entitlement
        annual_hours = '00:00:00'
        annual_sessions = 0
        
        entitlement_str = str(entitlement)
        if 'days' in entitlement_str:
            parts = entitlement_str.split(';')  # Using ; as separator due to CSV export
            if len(parts) == 2:
                annual_hours = parts[1].strip()
        elif entitlement_str.isdigit():
            annual_sessions = int(entitlement_str)
        elif entitlement_str.replace('.', '').isdigit():
            annual_sessions = int(float(entitlement_str))
        
        # Create SQL query
        query = f"""
        INSERT INTO holiday_entitlements (
          user_id, site_id, year, annual_hours, annual_sessions, 
          annual_education_sessions, carried_over_hours, carried_over_sessions, 
          carried_over_education_sessions, created_at, updated_at
        ) VALUES (
          '{user_id}',
          2,
          2025,
          '{annual_hours}',
          {annual_sessions},
          0, 0, 0, 0,
          NOW(),
          NOW()
        );
        """
        
        result, error = run_sql_query(query)
        
        if error:
            print(f"❌ Failed to import entitlement for {name}: {error}")
            error_count += 1
        else:
            print(f"✓ Imported entitlement for {name} ({role})")
            success_count += 1
    
    print(f"\nEntitlements import complete: {success_count} success, {error_count} errors")
    return error_count == 0

def import_backdated_holidays():
    """Import backdated holiday records"""
    print("\n=== IMPORTING BACKDATED HOLIDAYS ===")
    
    # Read data files
    try:
        mapping_df = pd.read_csv('/Users/benhoward/Desktop/CheckLoop/CheckLoops/clean_staff_mapping.csv')
        backdated_df = pd.read_csv('/Users/benhoward/Desktop/CheckLoop/CheckLoops/backdated_holidays.csv')
    except FileNotFoundError as e:
        print(f"❌ Required file not found: {e}")
        return False
    
    # Create name to user_id mapping
    user_mapping = {}
    for _, user in mapping_df.iterrows():
        if pd.notna(user['user_id']) and user['user_id'] != '':
            user_mapping[user['staff_name']] = user['user_id']
    
    print(f"Found user mappings for {len(user_mapping)} staff members")
    
    # Group holidays by staff member
    staff_holidays = backdated_df.groupby('StaffName')
    
    success_count = 0
    error_count = 0
    
    for staff_name, holidays in staff_holidays:
        if staff_name not in user_mapping:
            print(f"⚠️ Skipping {staff_name}: No user_id mapping found")
            continue
        
        user_id = user_mapping[staff_name]
        
        # Get date range
        dates = pd.to_datetime(holidays['Date']).sort_values()
        start_date = dates.min().strftime('%Y-%m-%d')
        end_date = dates.max().strftime('%Y-%m-%d')
        
        # Create holiday request
        request_query = f"""
        INSERT INTO holiday_requests (
          user_id, site_id, status, start_date, end_date, created_at, updated_at, approved_at
        ) VALUES (
          '{user_id}',
          2,
          'approved',
          '{start_date}',
          '{end_date}',
          NOW(),
          NOW(),
          NOW()
        ) RETURNING id;
        """
        
        request_result, request_error = run_sql_query(request_query)
        
        if request_error:
            print(f"❌ Failed to create holiday request for {staff_name}: {request_error}")
            error_count += 1
            continue
        
        # Extract request ID from result (this is tricky with CLI, so we'll use a different approach)
        # Let's use a single transaction approach instead
        
        # Get the maximum request ID and increment
        max_id_query = "SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM holiday_requests;"
        max_id_result, max_id_error = run_sql_query(max_id_query)
        
        if max_id_error:
            print(f"❌ Failed to get next request ID: {max_id_error}")
            error_count += 1
            continue
        
        # Create all records in a single transaction
        all_queries = []
        
        # Add the holiday request
        all_queries.append(f"""
        INSERT INTO holiday_requests (
          user_id, site_id, status, start_date, end_date, created_at, updated_at, approved_at
        ) VALUES (
          '{user_id}',
          2,
          'approved',
          '{start_date}',
          '{end_date}',
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
                try:
                    sessions_requested = int(float(value))
                except:
                    sessions_requested = 0
            
            all_queries.append(f"""
            INSERT INTO holiday_request_days (
              holiday_request_id, date, hours_requested, sessions_requested, created_at, updated_at
            ) VALUES (
              (SELECT MAX(id) FROM holiday_requests WHERE user_id = '{user_id}'),
              '{date}',
              '{hours_requested}',
              {sessions_requested},
              NOW(),
              NOW()
            );""")
        
        # Execute all queries as a transaction
        transaction_query = "BEGIN;\n" + "\n".join(all_queries) + "\nCOMMIT;"
        
        transaction_result, transaction_error = run_sql_query(transaction_query)
        
        if transaction_error:
            print(f"❌ Failed to import holidays for {staff_name}: {transaction_error}")
            error_count += 1
        else:
            print(f"✓ Imported {len(holidays)} holiday days for {staff_name}")
            success_count += 1
    
    print(f"\nBackdated holidays import complete: {success_count} staff, {error_count} errors")
    return error_count == 0

def main():
    """Main import process"""
    print("=== HOLIDAY DATA IMPORT PROCESS ===")
    print("This script will import holiday data into your Supabase database.")
    print()
    
    # Check if mapping file exists and has user_ids
    try:
        mapping_df = pd.read_csv('/Users/benhoward/Desktop/CheckLoop/CheckLoops/clean_staff_mapping.csv')
        users_with_ids = len(mapping_df[mapping_df['user_id'].notna() & (mapping_df['user_id'] != '')])
        users_needing_creation = len(mapping_df[mapping_df['needs_user_creation'] == 'YES'])
        
        print(f"Staff members in mapping file: {len(mapping_df)}")
        print(f"Users with valid IDs: {users_with_ids}")
        print(f"Users needing creation: {users_needing_creation}")
        print()
        
        if users_needing_creation > 0:
            print("⚠️ Some users need to be created first.")
            create_missing_users()
            print("Please create the missing users and update the mapping file before continuing.")
            print("Run this script again after updating user_ids.")
            return
        
        if users_with_ids == 0:
            print("❌ No users with valid user_ids found. Please update the mapping file.")
            return
        
        # Proceed with import
        print("Starting import process...")
        
        # Import staff entitlements
        entitlements_success = import_staff_entitlements()
        
        # Import backdated holidays
        holidays_success = import_backdated_holidays()
        
        if entitlements_success and holidays_success:
            print("\n🎉 Import completed successfully!")
            print("\nNext steps:")
            print("1. Verify data in your Supabase dashboard")
            print("2. Test the holiday system with the imported data")
            print("3. Consider backing up the current state")
        else:
            print("\n⚠️ Import completed with some errors. Please check the logs above.")
        
    except FileNotFoundError:
        print("❌ Mapping file not found. Please run cleanup_and_map_users.py first.")

if __name__ == "__main__":
    main()