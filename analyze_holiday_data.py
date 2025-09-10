import pandas as pd
import json
from datetime import datetime

# Read the Excel file
excel_file = 'HolidayTransfer.xlsx'
df = pd.read_excel(excel_file)

print("=" * 60)
print("DETAILED HOLIDAY DATA ANALYSIS")
print("=" * 60)

# Clean up the data - it looks like there are multiple sections
# Let's identify where the holiday requests end and the staff entitlements begin
print("\nAnalyzing data structure...")

# Check for sections
holiday_requests_df = df[['Date', 'StaffName', 'Value']].dropna(subset=['Date'])
staff_info_df = df[['Name', 'Role', 'Entitlement', 'Dr Monday Hours', 'Dr Tuesday Hours', 
                     'Dr Wednesday Hours', 'Dr Thursday Hours', 'Dr Friday Hours',
                     'Staff Monday Hours (HH:MM)', 'Staff Tuesday Hours (HH:MM)', 
                     'Staff Wednesday Hours (HH:MM)', 'Staff Thursday Hours (HH:MM)', 
                     'Staff Friday Hours (HH:MM)']].dropna(subset=['Name'])

print(f"\nHoliday Requests: {len(holiday_requests_df)} entries")
print(f"Staff Information: {len(staff_info_df)} entries")

# Analyze holiday requests
print("\n" + "=" * 40)
print("HOLIDAY REQUESTS DATA")
print("=" * 40)
print("\nSample holiday requests:")
print(holiday_requests_df.head(10))
print(f"\nUnique staff in requests: {holiday_requests_df['StaffName'].nunique()}")
print(f"Staff names: {sorted(holiday_requests_df['StaffName'].unique())}")
print(f"\nDate range: {holiday_requests_df['Date'].min()} to {holiday_requests_df['Date'].max()}")
print(f"\nValues (types of leave): {holiday_requests_df['Value'].unique()}")

# Analyze staff entitlements
print("\n" + "=" * 40)
print("STAFF ENTITLEMENTS DATA")
print("=" * 40)
print("\nSample staff information:")
print(staff_info_df.head())
print(f"\nUnique staff: {staff_info_df['Name'].nunique()}")
print(f"\nRoles: {staff_info_df['Role'].unique()}")
print(f"\nEntitlement types: {staff_info_df['Entitlement'].unique()}")

# Check for GP vs Staff distinction
gp_staff = staff_info_df[staff_info_df['Dr Monday Hours'].notna() | 
                          staff_info_df['Dr Tuesday Hours'].notna() |
                          staff_info_df['Dr Wednesday Hours'].notna() |
                          staff_info_df['Dr Thursday Hours'].notna() |
                          staff_info_df['Dr Friday Hours'].notna()]

regular_staff = staff_info_df[staff_info_df['Staff Monday Hours (HH:MM)'].notna() | 
                               staff_info_df['Staff Tuesday Hours (HH:MM)'].notna() |
                               staff_info_df['Staff Wednesday Hours (HH:MM)'].notna() |
                               staff_info_df['Staff Thursday Hours (HH:MM)'].notna() |
                               staff_info_df['Staff Friday Hours (HH:MM)'].notna()]

print(f"\nGPs identified: {len(gp_staff)}")
if len(gp_staff) > 0:
    print("GP Names:", gp_staff['Name'].tolist())
    
print(f"\nRegular Staff identified: {len(regular_staff)}")
if len(regular_staff) > 0:
    print("Sample Regular Staff:", regular_staff['Name'].head(10).tolist())

# Check for existing users mentioned
print("\n" + "=" * 40)
print("EXISTING USERS CHECK")
print("=" * 40)
existing_users = ['Ben Howard', 'Tom Donlan', 'Benjamin Howard']
for user in existing_users:
    in_requests = user in holiday_requests_df['StaffName'].values
    in_staff = user in staff_info_df['Name'].values
    print(f"{user}: In requests={in_requests}, In staff info={in_staff}")

# Export cleaned data for import
print("\n" + "=" * 40)
print("PREPARING DATA FOR IMPORT")
print("=" * 40)

# Clean holiday requests
holiday_requests_clean = holiday_requests_df.copy()
holiday_requests_clean['Date'] = pd.to_datetime(holiday_requests_clean['Date'])
holiday_requests_clean = holiday_requests_clean.rename(columns={
    'StaffName': 'staff_name',
    'Value': 'leave_type',
    'Date': 'date'
})

# Clean staff information
staff_info_clean = staff_info_df.copy()
staff_info_clean = staff_info_clean.rename(columns={
    'Name': 'full_name',
    'Role': 'role',
    'Entitlement': 'entitlement'
})

# Save to JSON for easy import
holiday_requests_clean.to_json('holiday_requests_data.json', orient='records', date_format='iso')
staff_info_clean.to_json('staff_entitlements_data.json', orient='records')

print("Data exported to:")
print("- holiday_requests_data.json")
print("- staff_entitlements_data.json")

print(f"\nTotal holiday requests to import: {len(holiday_requests_clean)}")
print(f"Total staff entitlements to import: {len(staff_info_clean)}")