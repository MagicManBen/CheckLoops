# 📋 Holiday Tables Renamed with Number Prefixes

## ✅ **What Changed**

Your 4 main holiday tables have been renamed with number prefixes so they appear at the top of your Supabase table list:

| **Old Name** | **New Name** | **Purpose** |
|-------------|-------------|-------------|
| `staff_holiday_profiles` | `1_staff_holiday_profiles` | Main staff records (name, role, GP flag) |
| `staff_entitlements` | `2_staff_entitlements` | Annual leave allowances |
| `staff_working_patterns` | `3_staff_working_patterns` | Weekly work schedules |
| `holiday_bookings` | `4_holiday_bookings` | Individual holiday bookings |
| `staff_profile_user_links` | `5_staff_profile_user_links` | Links profiles to user accounts |

---

## 🔧 **How to Apply the Changes**

### **Step 1: Run the Rename SQL**
1. Open your Supabase dashboard
2. Go to SQL Editor
3. Copy all contents of `rename_holiday_tables.sql`
4. Paste and click **Run**

### **Step 2: Verify the Changes**
In your Table Editor, you should now see:
- `1_staff_holiday_profiles` at the top
- `2_staff_entitlements` 
- `3_staff_working_patterns`
- `4_holiday_bookings`
- `5_staff_profile_user_links`

### **Step 3: Test Uploads**
The `holiday-upload.html` file has been automatically updated to use the new table names. Your bulk uploads should continue working normally.

---

## 📊 **What the Rename Script Does**

1. **Renames Tables** - Adds number prefixes to all 5 tables
2. **Updates Sequences** - Renames the ID sequences to match
3. **Fixes References** - Updates foreign key constraints
4. **Recreates Views** - Updates `staff_with_entitlements` view
5. **Updates RLS Policies** - Maintains security settings
6. **Creates New View** - Adds `holiday_data_summary` for easy overview

---

## 🔍 **Views Available**

### **staff_with_entitlements**
Shows staff with their annual allowances:
```sql
SELECT * FROM staff_with_entitlements;
```

### **holiday_data_summary** (New!)
Shows overview of all staff data:
```sql
SELECT * FROM holiday_data_summary;
```

---

## 📝 **Files Updated**

- ✅ `rename_holiday_tables.sql` - Renames existing tables
- ✅ `create_numbered_holiday_tables.sql` - For fresh installations
- ✅ `holiday-upload.html` - Updated to use new table names

---

## ⚠️ **Important Notes**

- **All data preserved** - Only table names change, no data is lost
- **Foreign keys maintained** - All relationships still work
- **RLS policies updated** - Security settings preserved
- **Existing views recreated** - No functionality lost

The renaming is purely cosmetic to improve your table organization in Supabase. All upload functionality continues to work exactly the same way!

---

## 🚨 **If Something Goes Wrong**

If you encounter any issues, you can:

1. **Check table names** in Supabase Table Editor
2. **Verify views exist** by running: `SELECT * FROM staff_with_entitlements LIMIT 1;`
3. **Test upload** with a single row template
4. **Contact support** if tables are missing or broken

The system is designed to be backwards compatible, so your holiday upload system will continue working normally.