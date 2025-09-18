# Holiday Data Import Summary

## Overview
This project processes and imports historical holiday data from `HolidayTransfer.xlsx` into your Supabase holiday management system.

## Files Processed
- **HolidayTransfer.xlsx**: Original Excel file with 4 data sections
- **323 holiday records** spanning to 2025-07-03
- **71 staff members** with entitlements and working patterns

## Generated Files

### Data Files
- `backdated_holidays.csv` - 323 historical holiday records
- `clean_staff_mapping.csv` - 21 clean staff records with role/entitlement mapping
- `staff_details.csv` - Working patterns and entitlements for all staff

### SQL Import Scripts
- `import_staff_entitlements.sql` - Holiday entitlements for each staff member
- `import_backdated_holidays.sql` - Historical approved holidays
- `create_missing_users.sql` - Template for user creation

### Python Scripts
- `create_import_scripts.py` - Generates SQL import scripts
- `cleanup_and_map_users.py` - Cleans data and maps to existing users  
- `test_supabase_connection.py` - Tests CLI connection
- `final_holiday_import.py` - **Main import script**

## Staff Analysis

### Clean Staff Records: 21
- **Reception**: 6 staff members
- **GP**: 4 staff members  
- **Nurse**: 3 staff members
- **Admin**: 3 staff members
- **Manager**: 2 staff members
- **Pharmacist**: 1 staff member
- **Health Care Assistant**: 1 staff member
- **GP Assistant**: 1 staff member

### User Status
- **Existing users found**: 2 (Ben Howard entries)
- **Need new user creation**: 19 staff members
- **Staff with backdated holidays**: 19 staff members

## Database Tables Affected

### holiday_entitlements
- Stores annual holiday allowances (hours for staff, sessions for GPs)
- Links to `auth.users` via `user_id`

### holiday_requests  
- Groups related holiday days into requests
- Status set to 'approved' for historical data

### holiday_request_days
- Individual holiday days with hours/sessions requested
- Links to parent `holiday_requests`

## Import Process

### Prerequisites
1. ✅ Supabase CLI installed and connected
2. ✅ Local Supabase instance running (postgresql://postgres:postgres@127.0.0.1:54322/postgres)
3. ❌ Missing users need to be created

### Step-by-Step Import

1. **Create Missing Users** (Manual Step)
   ```bash
   # Open Supabase Dashboard
   # http://127.0.0.1:54323
   # Go to Authentication > Users
   # Create 19 new users using emails from clean_staff_mapping.csv
   ```

2. **Update User Mapping**
   ```bash
   # Edit clean_staff_mapping.csv
   # Add user_ids for newly created users
   # Set needs_user_creation = 'NO' for completed users
   ```

3. **Run Import Script**
   ```bash
   python3 final_holiday_import.py
   ```

### Alternative: Direct SQL Execution
If you prefer to run SQL directly:

```bash
# After updating user_ids in the SQL files
supabase db remote query --file import_staff_entitlements.sql
supabase db remote query --file import_backdated_holidays.sql
```

## Data Validation

### Entitlements Format
- **Staff**: "X days, HH:MM:SS" → converted to annual_hours
- **GPs**: "X" (sessions) → converted to annual_sessions

### Holiday Values
- **Staff**: "HH:MM:SS" format → stored as hours_requested
- **GPs**: Integer values → stored as sessions_requested

## Key Data Points

### Historical Holiday Records
- **Date range**: 2025-02-13 to 2025-12-31
- **19 unique staff** have historical holidays
- **Total**: 323 individual holiday day records
- **Status**: All marked as 'approved' (historical data)

### Sample Staff Entitlements
- **Alexa Moreton (Nurse)**: 6 days, 13:30:00
- **Ashwini Nayak (GP)**: 44 sessions
- **Ben Howard (Manager)**: 8 days, 9:47:00
- **Carly Tweedie (Admin)**: 5 days, 10:00:00

## Troubleshooting

### Common Issues

1. **"No user_id mapping found"**
   - Solution: Create missing users and update clean_staff_mapping.csv

2. **"Failed to create holiday request"**
   - Check user_id exists in auth.users table
   - Verify site_id (currently set to 2)

3. **"Database connection failed"**
   - Ensure Supabase is running locally
   - Check connection with: `supabase status`

### Verification Queries

```sql
-- Check imported entitlements
SELECT COUNT(*) FROM holiday_entitlements WHERE year = 2025;

-- Check imported holiday requests  
SELECT COUNT(*) FROM holiday_requests WHERE status = 'approved';

-- Check holiday days
SELECT COUNT(*) FROM holiday_request_days;

-- View sample data
SELECT p.full_name, he.annual_hours, he.annual_sessions 
FROM holiday_entitlements he
JOIN profiles p ON he.user_id = p.user_id 
WHERE he.year = 2025
LIMIT 10;
```

## Next Steps After Import

1. **Verify Data**: Check Supabase Dashboard for imported records
2. **Test System**: Try creating new holiday requests via the web interface
3. **User Access**: Ensure staff can log in and view their holiday data
4. **Backup**: Export current state as backup before going live
5. **Monitor**: Watch for any data inconsistencies or missing records

## Support

If you encounter issues:
1. Check the terminal output for specific error messages
2. Verify Supabase connection with `test_supabase_connection.py`
3. Review the generated CSV files for data accuracy
4. Check user_ids in the Supabase Auth dashboard match the mapping file

---
*Generated by Holiday Import Process*
*Total processing time: ~5-10 minutes depending on user creation*